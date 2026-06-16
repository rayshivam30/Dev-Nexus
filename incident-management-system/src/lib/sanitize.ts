/**
 * Centralized sanitization utilities for DevNexus.
 *
 * - sanitizeJsonValue: recursively strips HTML tags from all string leaves
 *   in a JSON-serializable value.  Used before persisting user-controlled
 *   JSON (tags, metadata, breadcrumbs, github_raw, AI output).
 *
 * - isAllowedUrl: validates a URL is https:// on an allowlisted domain.
 *   Used in the UI before rendering external links (e.g. html_url).
 */

import DOMPurify from 'isomorphic-dompurify';

// ── HTML Stripping ───────────────────────────────────────────────────────────

/**
 * Strip HTML tags and dangerous patterns from a single string value.
 */
function stripHtml(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],  // No tags allowed
    ALLOWED_ATTR: [],  // No attributes allowed
    KEEP_CONTENT: true,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM: false,
  }).trim();
}

/**
 * Recursively walk a JSON-serializable value and strip HTML from every
 * string leaf and object key.
 *
 * Depth is capped to prevent stack overflow on adversarial input.
 */
export function sanitizeJsonValue<T>(value: T, maxDepth = 10): T {
  return _walk(value, 0, maxDepth);
}

function _walk<T>(value: T, depth: number, maxDepth: number): T {
  if (depth > maxDepth) return value;

  if (typeof value === "string") {
    return stripHtml(value) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => _walk(item, depth + 1, maxDepth)) as unknown as T;
  }

  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const sanitizedKey = DOMPurify.sanitize(k, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
      }).substring(0, 256);
      out[sanitizedKey] = _walk(v, depth + 1, maxDepth);
    }
    return out as unknown as T;
  }

  return value; // number, boolean, null, undefined
}

// ── URL Validation ───────────────────────────────────────────────────────────

const ALLOWED_LINK_DOMAINS = new Set([
  "github.com",
  "www.github.com",
  "avatars.githubusercontent.com",
  "raw.githubusercontent.com",
]);

/**
 * Returns `true` only when `url` is a valid `https://` URL whose hostname
 * is on the allow-list.  Use this before rendering user-controlled URLs in
 * `<a href>` attributes to prevent phishing / open-redirect / javascript:
 * schemes.
 */
export function isAllowedUrl(url: unknown): boolean {
  if (typeof url !== "string" || url.length === 0) return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_LINK_DOMAINS.has(parsed.hostname);
  } catch {
    return false;
  }
}
