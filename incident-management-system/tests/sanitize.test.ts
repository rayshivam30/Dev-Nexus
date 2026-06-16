import { expect, test, describe } from "bun:test";
import { sanitizeJsonValue, isAllowedUrl } from "../src/lib/sanitize";

describe("Sanitization Utilities", () => {
  describe("sanitizeJsonValue", () => {
    test("strips simple HTML tags", () => {
      const input = "<script>alert('xss')</script>Hello <b>World</b>";
      const result = sanitizeJsonValue(input);
      expect(result).toBe("Hello World");
    });

    test("strips SVG and event handlers", () => {
      const input = "<svg/onload=alert(1)> <img src=x onerror=alert(2)>";
      const result = sanitizeJsonValue(input);
      expect(result).toBe("");
    });

    test("recursively sanitizes nested objects and arrays", () => {
      const input = {
        title: "<b>Danger</b> Zone",
        tags: ["<script>bad</script>", "safe"],
        nested: {
          text: "<iframe src='malicious'></iframe>content",
        },
      };

      const result = sanitizeJsonValue(input);
      expect(result).toEqual({
        title: "Danger Zone",
        tags: ["", "safe"],
        nested: {
          text: "content",
        },
      });
    });

    test("sanitizes dangerous object keys", () => {
      const input = {
        "<script>alert(1)</script>key": "value",
      };

      const result = sanitizeJsonValue<Record<string, unknown>>(input);
      expect(result).toEqual({
        "key": "value",
      });
    });
  });

  describe("isAllowedUrl", () => {
    test("allows whitelisted domains with https", () => {
      expect(isAllowedUrl("https://github.com/user/repo")).toBe(true);
      expect(isAllowedUrl("https://avatars.githubusercontent.com/u/123")).toBe(true);
    });

    test("rejects non-https urls", () => {
      expect(isAllowedUrl("http://github.com/user/repo")).toBe(false);
    });

    test("rejects non-whitelisted domains", () => {
      expect(isAllowedUrl("https://malicious.com/user/repo")).toBe(false);
      expect(isAllowedUrl("javascript:alert(1)")).toBe(false);
    });
  });
});
