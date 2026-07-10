// WCAG AA contrast unit tests — inline formula, no external deps.
// Tests the design-token color pairs used in both light and dark themes.

import { describe, expect, it } from "vitest";

function sRGB(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * sRGB(r) + 0.7152 * sRGB(g) + 0.0722 * sRGB(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("WCAG AA contrast — dark theme design tokens", () => {
  const ink = "#0d0e11";        // --ink background
  const inkSurface = "#141518"; // --ink-surface

  it("primary fg #E8EAF0 on ink meets AA normal text (4.5:1)", () => {
    expect(contrastRatio("#E8EAF0", ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("fg-secondary #9BA1B0 on ink meets AA large text (3:1)", () => {
    expect(contrastRatio("#9BA1B0", ink)).toBeGreaterThanOrEqual(3);
  });

  it("brand #00ED82 on ink meets AA large text (3:1, used as heading accent)", () => {
    expect(contrastRatio("#00ED82", ink)).toBeGreaterThanOrEqual(3);
  });

  it("danger #F87171 on ink-surface meets AA normal text (4.5:1)", () => {
    expect(contrastRatio("#F87171", inkSurface)).toBeGreaterThanOrEqual(4.5);
  });

  it("warn #F59E0B on ink meets AA large text (3:1)", () => {
    expect(contrastRatio("#F59E0B", ink)).toBeGreaterThanOrEqual(3);
  });
});

describe("WCAG AA contrast — light theme design tokens", () => {
  const white = "#FFFFFF";
  const lightSurface = "#F8F9FA"; // approximate light ink

  it("danger #DC2626 on white passes AA (4.5:1)", () => {
    expect(contrastRatio("#DC2626", white)).toBeGreaterThanOrEqual(4.5);
  });

  it("brand-dark #008F50 on white passes AA large text (3:1, display heading usage)", () => {
    expect(contrastRatio("#008F50", white)).toBeGreaterThanOrEqual(3.0);
  });

  it("ink text #1A1D23 on light surface passes AA (7:1 target)", () => {
    expect(contrastRatio("#1A1D23", lightSurface)).toBeGreaterThanOrEqual(4.5);
  });
});
