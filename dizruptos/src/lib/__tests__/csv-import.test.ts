import { describe, it, expect } from "vitest";
import { parseCSV, parseAndValidate, csvTemplate } from "@/lib/import/csv";

describe("CSV parser", () => {
  it("handles quoted fields, embedded commas, quotes, and newlines", () => {
    const g = parseCSV('a,b,c\n1,"x,y","he said ""hi"""\n2,"multi\nline",z');
    expect(g[0]).toEqual(["a", "b", "c"]);
    expect(g[1]).toEqual(["1", "x,y", 'he said "hi"']);
    expect(g[2]).toEqual(["2", "multi\nline", "z"]);
  });
  it("skips blank rows", () => {
    expect(parseCSV("a\n\n1\n\n")).toEqual([["a"], ["1"]]);
  });
});

describe("entity validation", () => {
  it("accepts a valid capabilities CSV", () => {
    const r = parseAndValidate("capabilities", "name,category,strategic_importance\nKubernetes,engineering,high\nFinance,finance,critical");
    expect(r.errors).toEqual([]);
    expect(r.records).toHaveLength(2);
    expect(r.records[0]).toEqual({ name: "Kubernetes", category: "engineering", strategic_importance: "high" });
  });
  it("flags missing required columns and bad enums/numbers", () => {
    const r = parseAndValidate("capabilities", "category\nengineering"); // no name column
    expect(r.errors.some((e) => /Missing required column "name"/.test(e.message))).toBe(true);

    const bad = parseAndValidate("capabilities", "name,strategic_importance\nX,supercritical");
    expect(bad.errors.some((e) => /not in/.test(e.message))).toBe(true);

    const emp = parseAndValidate("employees", "name,email,capacity_hours\nA,a@x.io,forty");
    expect(emp.errors.some((e) => /not a number/.test(e.message))).toBe(true);
  });
  it("is case-insensitive on headers and trims", () => {
    const r = parseAndValidate("employees", " Name , Email \n Dana , dana@x.io ");
    expect(r.records[0]).toEqual({ name: "Dana", email: "dana@x.io" });
  });
  it("emits usable templates", () => {
    expect(csvTemplate("capabilities")).toMatch(/^name,category,strategic_importance/);
  });
});
