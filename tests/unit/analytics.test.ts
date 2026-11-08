/**
 * Unit tests — analytics numerator/denominator logic + small-cell suppression (Phase 13.1).
 */
import { describe, it, expect } from "vitest";
import { suppressSmall } from "@/domains/analytics/service";

describe("small-cell disclosure prevention", () => {
  it("suppresses counts below the threshold", () => {
    const rows = [
      { group: "a", count: 3 },
      { group: "b", count: 12 },
      { group: "c", count: 0 },
    ];
    const out = suppressSmall(rows, 5);
    expect(out[0].suppressed).toBe(true);
    expect(out[0].count).toBe(0); // hidden, not shown as a small number
    expect(out[1].count).toBe(12);
    expect(out[1].suppressed).toBe(false);
    expect(out[2].suppressed).toBe(false);
    expect(out[2].count).toBe(0);
  });

  it("boundary: count equal to threshold is shown", () => {
    const out = suppressSmall([{ group: "x", count: 5 }], 5);
    expect(out[0].suppressed).toBe(false);
    expect(out[0].count).toBe(5);
  });
});
