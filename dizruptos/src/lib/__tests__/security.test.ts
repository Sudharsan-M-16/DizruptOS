import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeEmail, sanitizeSlug, sanitizeCsv } from "@/server/lib/sanitize";

describe("sanitizeText", () => {
  it("strips HTML tags (keeps inner text)", () => {
    // The regex removes tag markup but preserves the text content inside tags.
    expect(sanitizeText("<script>alert(1)</script>hello")).toBe("alert(1)hello");
    expect(sanitizeText("<b>bold</b>")).toBe("bold");
    expect(sanitizeText("<img src='x' onerror='evil()'>safe")).toBe("safe");
  });

  it("strips control characters", () => {
    expect(sanitizeText("hello\x00world")).toBe("helloworld");
    expect(sanitizeText("a\x08b")).toBe("ab");
  });

  it("trims whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("enforces max length", () => {
    const long = "a".repeat(2000);
    expect(sanitizeText(long, 100)).toHaveLength(100);
  });

  it("preserves normal text", () => {
    expect(sanitizeText("Hello, World!")).toBe("Hello, World!");
  });
});

describe("sanitizeEmail", () => {
  it("normalizes to lowercase", () => {
    expect(sanitizeEmail("User@EXAMPLE.COM")).toBe("user@example.com");
  });

  it("trims whitespace", () => {
    expect(sanitizeEmail("  user@example.com  ")).toBe("user@example.com");
  });

  it("throws on invalid format", () => {
    expect(() => sanitizeEmail("notanemail")).toThrow("Invalid email format");
    expect(() => sanitizeEmail("@example.com")).toThrow("Invalid email format");
    expect(() => sanitizeEmail("user@")).toThrow("Invalid email format");
  });

  it("accepts valid emails", () => {
    expect(sanitizeEmail("user+tag@sub.example.co.uk")).toBe("user+tag@sub.example.co.uk");
  });
});

describe("sanitizeSlug", () => {
  it("converts to lowercase hyphen-separated slug", () => {
    expect(sanitizeSlug("Hello World")).toBe("hello-world");
    expect(sanitizeSlug("My Project 2026")).toBe("my-project-2026");
  });

  it("strips special characters and collapses hyphens", () => {
    // Special chars become hyphens, which then get collapsed to single hyphens.
    const result = sanitizeSlug("Hello! @World#");
    expect(result).toMatch(/^[a-z0-9-]+$/);
    expect(result).toContain("hello");
    expect(result).toContain("world");
  });

  it("collapses multiple hyphens", () => {
    expect(sanitizeSlug("hello   world")).toBe("hello-world");
  });

  it("strips leading/trailing hyphens", () => {
    expect(sanitizeSlug("-hello-")).toBe("hello");
  });

  it("enforces max length of 32", () => {
    expect(sanitizeSlug("a".repeat(100))).toHaveLength(32);
  });
});

describe("sanitizeCsv", () => {
  it("passes through clean CSV unchanged", () => {
    const csv = "name,email\nDana,dana@example.com";
    expect(sanitizeCsv(csv)).toBe(csv);
  });

  it("throws if CSV exceeds max byte size", () => {
    const bigCsv = "a".repeat(11 * 1024 * 1024); // 11 MB
    expect(() => sanitizeCsv(bigCsv)).toThrow("CSV exceeds maximum size");
  });

  it("neutralizes formula injection in data rows (= prefix)", () => {
    const csv = "name,cmd\nDana,=HYPERLINK(\"evil.com\")";
    const result = sanitizeCsv(csv);
    expect(result).toContain("'=");
  });

  it("does NOT modify the header row", () => {
    const csv = "=name,email\nDana,dana@example.com";
    const result = sanitizeCsv(csv);
    // Header row (i===0) is exempt — =name stays as-is
    expect(result.split("\n")[0]).toBe("=name,email");
  });
});
