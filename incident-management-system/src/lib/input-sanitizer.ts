import DOMPurify from "isomorphic-dompurify";

/**
 * Frontend input sanitization utilities
 * Validates and cleans user input before sending to API
 */

export interface SanitizationOptions {
  maxLength?: number;
  allowHtml?: boolean;
  trimWhitespace?: boolean;
}

/**
 * Sanitize text input
 * - Removes HTML tags
 * - Trims whitespace
 * - Enforces max length
 */
export function sanitizeText(
  input: string,
  options: SanitizationOptions = {}
): string {
  const {
    maxLength = 1000,
    allowHtml = false,
    trimWhitespace = true,
  } = options;

  let sanitized = input || "";

  // Trim whitespace
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Remove HTML tags if not allowed
  if (!allowHtml) {
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  }

  // Enforce max length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  return sanitizeText(email.toLowerCase(), {
    maxLength: 254,
    allowHtml: false,
  });
}

/**
 * Sanitize issue description (allows multi-line)
 */
export function sanitizeDescription(desc: string): string {
  return sanitizeText(desc, {
    maxLength: 10000,
    allowHtml: false,
  });
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string contains only safe characters
 */
export function isSafeString(str: string): boolean {
  const safeRegex = /^[a-zA-Z0-9\s.,!?\-()&':";@/]*$/;
  return safeRegex.test(str);
}
