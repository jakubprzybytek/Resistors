import { describe, expect, it } from "vitest";
import { sortResults } from "../resultRanking.js";
import type { NetworkResult } from "../network.js";

const makeResult = (
  description: string,
  value: number,
  count: number,
  absError: number
): NetworkResult => ({
  node: { kind: "leaf", value, description, signature: description },
  count,
  value,
  absError,
  deviationPct: value === 0 ? 0 : absError,
  description,
});

describe("sortResults", () => {
  it("sorts by accuracy and breaks ties by resistor count", () => {
    const results = sortResults(
      [
        makeResult("three-part", 303, 3, 3),
        makeResult("one-part", 302, 1, 2),
        makeResult("two-part", 302, 2, 2),
      ],
      "accuracy"
    );

    expect(results.map((result) => result.description)).toEqual([
      "one-part",
      "two-part",
      "three-part",
    ]);
  });

  it("sorts by resistor count and breaks ties by accuracy", () => {
    const results = sortResults(
      [
        makeResult("one-part-worse", 304, 1, 4),
        makeResult("two-part", 301, 2, 1),
        makeResult("one-part-better", 302, 1, 2),
      ],
      "resistorCount"
    );

    expect(results.map((result) => result.description)).toEqual([
      "one-part-better",
      "one-part-worse",
      "two-part",
    ]);
  });
});