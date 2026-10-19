import { prisma } from "@/lib/db";
import sourceMap from "source-map-js";
import { logger } from "@/lib/logger";

/**
 * Upload and store a source map for a specific project release.
 */
export async function uploadSourceMap(
  projectId: string,
  release: string,
  filename: string,
  content: string
) {
  // Validate that content is valid source map JSON
  try {
    const parsed = JSON.parse(content);
    if (!parsed.version || !parsed.sources || !parsed.mappings) {
      throw new Error("Invalid source map format (missing version, sources, or mappings)");
    }
  } catch (err) {
    throw new Error(`Failed to parse source map JSON: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Normalize filename (ensure it ends in .map)
  const normalizedFilename = filename.endsWith(".map") ? filename : `${filename}.map`;

  return await prisma.sourceMap.upsert({
    where: {
      projectId_release_filename: {
        projectId,
        release,
        filename: normalizedFilename,
      },
    },
    create: {
      projectId,
      release,
      filename: normalizedFilename,
      content,
    },
    update: {
      content,
      createdAt: new Date(),
    },
    select: {
      id: true,
      projectId: true,
      release: true,
      filename: true,
      createdAt: true,
    },
  });
}

/**
 * List all source maps for a project, optionally filtered by release.
 */
export async function listSourceMaps(projectId: string, release?: string) {
  return await prisma.sourceMap.findMany({
    where: {
      projectId,
      ...(release ? { release } : {}),
    },
    select: {
      id: true,
      release: true,
      filename: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Delete a source map.
 */
export async function deleteSourceMap(id: string, projectId: string) {
  return await prisma.sourceMap.deleteMany({
    where: { id, projectId },
  });
}

/**
 * Regex to parse stack trace lines:
 * e.g. "    at Component (https://example.com/assets/index-abc123.js:1:2345)"
 * or "    at https://example.com/assets/index-abc123.js:1:2345"
 * or "    at index-abc123.js:1:2345"
 */
const STACK_LINE_REGEX = /^\s*at\s+(?:([^\s(]+)\s+\((?:https?:\/\/[^/]+)?([^:]+):(\d+):(\d+)\)|(?:https?:\/\/[^/]+)?([^:]+):(\d+):(\d+))\s*$/;

/**
 * De-minifies a JavaScript stack trace using stored source maps.
 * Translates bundle line:column positions to original TypeScript/JSX file:line numbers.
 */
export async function resolveStackTrace(
  projectId: string,
  release: string,
  rawStackTrace: string
): Promise<{ resolved: boolean; stackTrace: string }> {
  if (!rawStackTrace || typeof rawStackTrace !== "string") {
    return { resolved: false, stackTrace: rawStackTrace };
  }

  const lines = rawStackTrace.split("\n");
  const resolvedLines: string[] = [];
  let anyResolved = false;

  // Cache source map consumers for this resolution pass to avoid re-parsing JSON
  const consumerCache = new Map<string, sourceMap.SourceMapConsumer | null>();

  for (const line of lines) {
    const match = line.match(STACK_LINE_REGEX);
    if (!match) {
      resolvedLines.push(line);
      continue;
    }

    const fnName = match[1] || "<anonymous>";
    const filePath = match[2] || match[5];
    const lineNum = parseInt(match[3] || match[6], 10);
    const colNum = parseInt(match[4] || match[7], 10);

    if (!filePath || isNaN(lineNum) || isNaN(colNum)) {
      resolvedLines.push(line);
      continue;
    }

    // Extract basename (e.g., "index-abc123.js" from "/assets/index-abc123.js")
    const basename = filePath.split("/").pop() || filePath;
    const mapFilename = `${basename}.map`;

    let consumer = consumerCache.get(mapFilename);
    if (consumer === undefined) {
      const mapRecord = await prisma.sourceMap.findUnique({
        where: {
          projectId_release_filename: {
            projectId,
            release,
            filename: mapFilename,
          },
        },
      });

      if (mapRecord) {
        try {
          consumer = new sourceMap.SourceMapConsumer(JSON.parse(mapRecord.content));
          consumerCache.set(mapFilename, consumer);
        } catch (e) {
          logger.warn({ err: e, mapFilename }, "Failed to parse source map consumer");
          consumerCache.set(mapFilename, null);
          consumer = null;
        }
      } else {
        consumerCache.set(mapFilename, null);
        consumer = null;
      }
    }

    if (consumer) {
      const original = consumer.originalPositionFor({
        line: lineNum,
        column: colNum,
      });

      if (original && original.source && original.line) {
        anyResolved = true;
        const resolvedFn = original.name || fnName;
        resolvedLines.push(
          `    at ${resolvedFn} (${original.source}:${original.line}:${original.column || 0})`
        );
        continue;
      }
    }

    resolvedLines.push(line);
  }

  return {
    resolved: anyResolved,
    stackTrace: resolvedLines.join("\n"),
  };
}
