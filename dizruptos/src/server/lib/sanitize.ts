// Input sanitization helpers for user-provided strings.
// Used in API routes before passing data to repositories or CSV parsers.

/**
 * Strip HTML tags, control characters, and enforce max length.
 */
export function sanitizeText(input: string, maxLength = 1000): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars (keep \t \n \r)
    .trim()
    .slice(0, maxLength);
}

/**
 * Normalize and validate an email address.
 */
export function sanitizeEmail(input: string): string {
  const clean = input.toLowerCase().trim().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new Error("Invalid email format");
  return clean;
}

/**
 * Convert a string into a safe URL slug: lowercase, alphanumeric + hyphens, max 32 chars.
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

/**
 * Sanitize a CSV string:
 *  • Enforce a max byte size (default 10 MB).
 *  • Neutralize CSV formula injection in data rows (cells starting with =, +, -, @).
 */
export function sanitizeCsv(input: string, maxBytes = 10 * 1024 * 1024): string {
  if (Buffer.byteLength(input, "utf8") > maxBytes) {
    throw new Error(`CSV exceeds maximum size of ${maxBytes / (1024 * 1024)} MB`);
  }
  const lines = input.split("\n");
  const sanitized = lines.map((line, i) => {
    if (i === 0) return line; // header row is exempt
    return line
      .split(",")
      .map((cell) => {
        // Strip surrounding quotes to inspect content, then neutralize formulas.
        const stripped = cell.trim().replace(/^["']|["']$/g, "");
        if (/^[=+\-@|`]/.test(stripped)) {
          // Prefix with a single quote to neutralize spreadsheet formula injection.
          return `'${cell}`;
        }
        return cell;
      })
      .join(",");
  });
  return sanitized.join("\n");
}
