import { describe, it, expect } from "vitest";
import { parseAndValidate, csvTemplate, SCHEMAS } from "@/lib/import/csv";

describe("hris_bulk schema", () => {
  const validCsv = [
    "name,email,title,role,department,location,capacity_hours",
    "Sarah Chen,sarah@co.com,Engineering Manager,dept_head,Engineering,SF,40",
    "James Kim,james@co.com,Backend Engineer,employee,Engineering,Remote,40",
  ].join("\n");

  it("parses a valid hris_bulk CSV correctly", () => {
    const result = parseAndValidate("hris_bulk", validCsv);
    expect(result.errors).toHaveLength(0);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({ name: "Sarah Chen", email: "sarah@co.com", role: "dept_head" });
    expect(result.records[1]).toMatchObject({ name: "James Kim", email: "james@co.com", capacity_hours: 40 });
  });

  it("requires name and email", () => {
    const r = parseAndValidate("hris_bulk", "title\nManager");
    expect(r.errors.some((e) => /name/.test(e.message))).toBe(true);
    expect(r.errors.some((e) => /email/.test(e.message))).toBe(true);
  });

  it("rejects invalid role enum", () => {
    const bad = parseAndValidate("hris_bulk", "name,email,role\nJohn,j@co.com,wizard");
    expect(bad.errors.some((e) => /not in/.test(e.message))).toBe(true);
  });

  it("coerces capacity_hours to a number", () => {
    const r = parseAndValidate("hris_bulk", "name,email,capacity_hours\nA,a@co.com,32");
    expect(r.records[0].capacity_hours).toBe(32);
    expect(typeof r.records[0].capacity_hours).toBe("number");
  });

  it("fails when capacity_hours is not numeric", () => {
    const r = parseAndValidate("hris_bulk", "name,email,capacity_hours\nA,a@co.com,forty");
    expect(r.errors.some((e) => /not a number/.test(e.message))).toBe(true);
  });

  it("generates a usable template", () => {
    const tpl = csvTemplate("hris_bulk");
    expect(tpl).toMatch(/name,email,title,role,department,location,capacity_hours/);
    expect(tpl).toMatch(/Sarah Chen/);
  });

  it("hris_bulk is present in SCHEMAS", () => {
    expect(SCHEMAS.hris_bulk).toBeDefined();
    const required = SCHEMAS.hris_bulk.fields.filter((f) => f.required).map((f) => f.csv);
    expect(required).toContain("name");
    expect(required).toContain("email");
  });
});

describe("org creation slug validation", () => {
  const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

  it("accepts valid slugs", () => {
    expect(SLUG_RE.test("acme")).toBe(true);
    expect(SLUG_RE.test("my-company-123")).toBe(true);
    expect(SLUG_RE.test("a1b")).toBe(true); // minimum 3 chars: start + middle + end
  });

  it("rejects slugs with uppercase letters", () => {
    expect(SLUG_RE.test("Acme")).toBe(false);
  });

  it("rejects slugs starting or ending with hyphens", () => {
    expect(SLUG_RE.test("-acme")).toBe(false);
    expect(SLUG_RE.test("acme-")).toBe(false);
  });

  it("rejects slugs shorter than 3 chars", () => {
    expect(SLUG_RE.test("a")).toBe(false);
    expect(SLUG_RE.test("ab")).toBe(false); // needs middle section {1,30}
  });

  it("rejects slugs with special chars", () => {
    expect(SLUG_RE.test("acme.co")).toBe(false);
    expect(SLUG_RE.test("acme_co")).toBe(false);
  });
});
