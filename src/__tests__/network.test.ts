import { describe, it, expect } from "vitest";
import {
  canonicalKey,
  findAllResistorNetworks,
  findResistorNetworkUnlimited,
  type Node,
} from "../network.js";

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
    expect(result!.description).toBe("220");
  });

  it("formats detailed descriptions with suffix tokens", () => {
    const result = findResistorNetworkUnlimited([4700], 4700);
    expect(result).not.toBeNull();
    expect(result!.description).toBe("4.7k");
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

  it("omits redundant parentheses for chained same-operator expressions", () => {
    const result = findResistorNetworkUnlimited([100], 300, { relTolerance: 0.001, maxResistors: 3 });
    expect(result).not.toBeNull();
    expect(result!.found).toBe(true);
    expect(result!.description).toBe("100 + 100 + 100");
  });

  it("combines two resistors in parallel to hit the target", () => {
    // 100 ∥ 100 = 50
    const result = findResistorNetworkUnlimited([100], 50, { relTolerance: 0.001 });
    expect(result).not.toBeNull();
    expect(result!.found).toBe(true);
    expect(result!.count).toBe(2);
    expect(result!.value).toBeCloseTo(50, 5);
    expect(result!.description).toContain("||");
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

describe("findAllResistorNetworks", () => {
  it("returns every matching result within the tolerance band", () => {
    const results = findAllResistorNetworks([100, 200, 300], 300, { relTolerance: 0.05 });

    expect(results.length).toBeGreaterThanOrEqual(3);
    expect(results.map((result) => result.description)).toEqual(
      expect.arrayContaining([
        "300",
        "100 + 200",
        "100 + 100 + 100",
      ])
    );
  });

  it("keeps results within the 5 resistor search cap", () => {
    const results = findAllResistorNetworks([100], 500, { relTolerance: 0.05, maxResistors: 5 });

    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.count).toBeLessThanOrEqual(5);
      expect(result.absError).toBeLessThanOrEqual(25);
    }
  });

  it("returns an empty list when nothing falls inside the tolerance band", () => {
    expect(findAllResistorNetworks([100], 1000, { relTolerance: 0.01, maxResistors: 2 })).toEqual(
      []
    );
  });

  it("does not duplicate the same combination", () => {
    const results = findAllResistorNetworks([100, 200, 300], 300, { relTolerance: 0.05 });
    const descriptions = results.map((result) => result.description);

    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
});

describe("canonicalKey", () => {
  const leaf = (value: number): Node => ({
    kind: "leaf",
    value,
    description: `${value}Ω`,
    signature: `leaf:${value}`,
  });

  const series = (left: Node, right: Node): Node => ({
    kind: "series",
    left,
    right,
    value: left.value + right.value,
    description: `${left.description} + ${right.description}`,
    signature: `series:${left.signature}|${right.signature}`,
  });

  const parallel = (left: Node, right: Node): Node => ({
    kind: "parallel",
    left,
    right,
    value: (left.value * right.value) / (left.value + right.value),
    description: `${left.description} ∥ ${right.description}`,
    signature: `parallel:${left.signature}|${right.signature}`,
  });

  it("matches equivalent commutative forms", () => {
    const left = series(leaf(100), parallel(leaf(220), leaf(330)));
    const right = series(parallel(leaf(330), leaf(220)), leaf(100));

    expect(canonicalKey(left)).toBe(canonicalKey(right));
  });

  it("flattens associative chains", () => {
    const nestedLeft = series(series(leaf(100), leaf(220)), leaf(330));
    const nestedRight = series(leaf(100), series(leaf(220), leaf(330)));

    expect(canonicalKey(nestedLeft)).toBe(canonicalKey(nestedRight));
  });

  it("keeps distinct topologies as distinct keys", () => {
    const allSeries = series(series(leaf(100), leaf(100)), leaf(100));
    const mixed = series(leaf(100), parallel(leaf(200), leaf(200)));

    expect(canonicalKey(allSeries)).not.toBe(canonicalKey(mixed));
  });

  it("rounds leaf values to avoid floating-point noise duplicates", () => {
    expect(canonicalKey(leaf(100.0000000001))).toBe(canonicalKey(leaf(100.0000000002)));
  });
});
