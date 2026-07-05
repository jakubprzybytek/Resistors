import { describe, it, expect } from "vitest";
import { findResistorNetworkUnlimited } from "../network.js";

describe("findResistorNetworkUnlimited", () => {
  it("returns null for an empty resistor set", () => {
    expect(findResistorNetworkUnlimited([], 100)).toBeNull();
  });

  it("returns null for a non-positive target", () => {
    expect(findResistorNetworkUnlimited([100, 220], 0)).toBeNull();
    expect(findResistorNetworkUnlimited([100, 220], -10)).toBeNull();
  });

  it("finds an exact single-resistor match", () => {
    const result = findResistorNetworkUnlimited([100, 220, 330], 220);
    expect(result).not.toBeNull();
    expect(result!.found).toBe(true);
    expect(result!.count).toBe(1);
    expect(result!.value).toBe(220);
    expect(result!.description).toBe("220Ω");
  });

  it("combines two resistors in series to hit the target", () => {
    // 100 + 100 = 200
    const result = findResistorNetworkUnlimited([100], 200, { relTolerance: 0.001 });
    expect(result).not.toBeNull();
    expect(result!.found).toBe(true);
    expect(result!.count).toBe(2);
    expect(result!.value).toBeCloseTo(200, 5);
    expect(result!.description).toContain("+");
  });

  it("combines two resistors in parallel to hit the target", () => {
    // 100 ∥ 100 = 50
    const result = findResistorNetworkUnlimited([100], 50, { relTolerance: 0.001 });
    expect(result).not.toBeNull();
    expect(result!.found).toBe(true);
    expect(result!.count).toBe(2);
    expect(result!.value).toBeCloseTo(50, 5);
    expect(result!.description).toContain("∥");
  });

  it("respects relative tolerance when deciding a match", () => {
    // Target 100, available only 110 -> 10% off.
    const loose = findResistorNetworkUnlimited([110], 100, { relTolerance: 0.2 });
    expect(loose!.found).toBe(true);

    const strict = findResistorNetworkUnlimited([110], 100, { relTolerance: 0.01 });
    expect(strict!.found).toBe(false);
  });

  it("falls back to the closest match when nothing is within tolerance", () => {
    const result = findResistorNetworkUnlimited([1, 2, 3], 1_000_000, {
      relTolerance: 0.0001,
      maxResistors: 2
    });
    expect(result).not.toBeNull();
    expect(result!.found).toBe(false);
    expect(result!.value).toBeLessThan(1_000_000);
  });

  it("prefers the minimal resistor count among matching networks", () => {
    // 220 alone is within 1% tolerance of 220, so it must win over any multi-resistor combo.
    const result = findResistorNetworkUnlimited([220, 100], 220, { relTolerance: 0.01 });
    expect(result!.count).toBe(1);
  });
});
