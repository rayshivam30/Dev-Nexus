import { createPrismaMock } from "./mock-db";
import { mock, describe, it, expect, beforeEach } from "bun:test";

const prismaMock = createPrismaMock();
mock.module("@/lib/db", () => ({ prisma: prismaMock }));
mock.module("../src/lib/db", () => ({ prisma: prismaMock }));

import {
  uploadSourceMap,
  listSourceMaps,
  resolveStackTrace,
} from "../src/services/sourcemap-service";

describe("Source Map Service (Stack Trace De-minification)", () => {
  const projectId = "proj-123";
  const release = "v1.0.0";

  // A valid sample source map generated from a TypeScript file
  const sampleMapContent = JSON.stringify({
    version: 3,
    file: "bundle.js",
    sources: ["src/components/UserWidget.tsx"],
    names: ["handleClick", "fetchUser"],
    mappings: "AAAA,SAASA,WAAW;IAClBC,SAAS;",
  });

  beforeEach(() => {
    prismaMock.sourceMap.upsert.mockClear();
    prismaMock.sourceMap.findUnique.mockClear();
    prismaMock.sourceMap.findMany.mockClear();
  });

  it("uploadSourceMap rejects invalid non-JSON source maps", async () => {
    expect(
      uploadSourceMap(projectId, release, "bundle.js.map", "not-json")
    ).rejects.toThrow("Failed to parse source map JSON");
  });

  it("uploadSourceMap rejects JSON missing required source map fields", async () => {
    expect(
      uploadSourceMap(projectId, release, "bundle.js.map", JSON.stringify({ foo: "bar" }))
    ).rejects.toThrow("missing version, sources, or mappings");
  });

  it("uploadSourceMap successfully stores valid source map", async () => {
    prismaMock.sourceMap.upsert.mockResolvedValue({
      id: "map-1",
      projectId,
      release,
      filename: "bundle.js.map",
      createdAt: new Date(),
    });

    const res = await uploadSourceMap(projectId, release, "bundle.js", sampleMapContent);
    expect(res.id).toBe("map-1");
    expect(res.filename).toBe("bundle.js.map");
    expect(prismaMock.sourceMap.upsert).toHaveBeenCalled();
  });

  it("listSourceMaps returns source maps for project", async () => {
    prismaMock.sourceMap.findMany.mockResolvedValue([
      { id: "map-1", release, filename: "bundle.js.map", createdAt: new Date() },
    ]);

    const res = await listSourceMaps(projectId, release);
    expect(res.length).toBe(1);
    expect(res[0].filename).toBe("bundle.js.map");
  });

  it("resolveStackTrace returns original if no matching source map exists", async () => {
    prismaMock.sourceMap.findUnique.mockResolvedValue(null);

    const rawStack = "Error: Test Error\n    at handleClick (https://app.com/assets/bundle.js:1:5)";
    const res = await resolveStackTrace(projectId, release, rawStack);

    expect(res.resolved).toBe(false);
    expect(res.stackTrace).toBe(rawStack);
  });

  it("resolveStackTrace de-minifies line/column to original TypeScript file", async () => {
    prismaMock.sourceMap.findUnique.mockResolvedValue({
      id: "map-1",
      content: sampleMapContent,
    });

    const minifiedStack = "Error: Click Failed\n    at handleClick (https://app.com/assets/bundle.js:1:1)";
    const res = await resolveStackTrace(projectId, release, minifiedStack);

    expect(res.resolved).toBe(true);
    expect(res.stackTrace.includes("src/components/UserWidget.tsx")).toBe(true);
  });
});
