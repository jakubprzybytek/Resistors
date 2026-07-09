import { describe, expect, it } from "vitest";
import { buildRankingModel, selectKnee, type TierCard } from "../resultRanking.js";
import type { NetworkResult, Node } from "../network.js";

function leaf(value: number, label: string): Node {
  return { kind: "leaf", value, description: label, signature: label };
}

function series(left: Node, right: Node, value: number, label: string): Node {
  return { kind: "series", value, left, right, description: label, signature: label };
}

function makeResult(count: number, absError: number, description: string, node: Node): NetworkResult {
  const target = 100;
  const value = target + absError + count / 1000 + description.length / 10000;
  return {
    node,
    count,
    value,
    absError,
    deviationPct: (absError / target) * 100,
    description,
  };
}

describe("buildRankingModel", () => {
  it("builds Pareto spine tiers, drops dominated tiers, and bounds similar results", () => {
    const baseLeaf = leaf(100, "100Ω");
    const equivalentSeriesA = series(leaf(10, "10Ω"), leaf(90, "90Ω"), 100, "10Ω + 90Ω");
    const equivalentSeriesB = series(leaf(90, "90Ω"), leaf(10, "10Ω"), 100, "90Ω + 10Ω");

    const results: NetworkResult[] = [
      makeResult(5, 0.5, "5-best", leaf(100.5, "5-best")),
      makeResult(5, 0.8, "5-alt-1", leaf(100.8, "5-alt-1")),
      makeResult(5, 1.1, "5-alt-2", leaf(101.1, "5-alt-2")),
      makeResult(4, 1.5, "4-dominated", leaf(101.5, "4-dominated")),
      makeResult(3, 1.0, "3-best", leaf(101.0, "3-best")),
      makeResult(3, 1.4, "3-alt-1", leaf(101.4, "3-alt-1")),
      makeResult(3, 2.0, "3-too-high", leaf(102.0, "3-too-high")),
      makeResult(2, 2.0, "2-best", leaf(102.0, "2-best")),
      makeResult(2, 3.5, "2-alt-1", leaf(103.5, "2-alt-1")),
      makeResult(2, 5.0, "2-edge-excluded", leaf(105.0, "2-edge-excluded")),
      makeResult(1, 6.0, "1-out-of-tolerance", leaf(106.0, "1-out-of-tolerance")),
      makeResult(2, 2.4, "dedup-A", equivalentSeriesA),
      makeResult(2, 2.4, "dedup-B", equivalentSeriesB),
    ];

    const model = buildRankingModel(results, { target: 100, relTolerance: 0.05 });

    expect(model.tiers.map((tier) => tier.count)).toEqual([5, 3, 2]);
    expect(model.tiers[0].results.map((result) => result.description)).toEqual(["5-best", "5-alt-1"]);
    expect(model.tiers[1].results.map((result) => result.description)).toEqual(["3-best", "3-alt-1"]);
    expect(model.tiers[2].results[0].description).toBe("2-best");
    expect(model.tiers[2].results[2].description).toBe("2-alt-1");

    const dedupTierDescriptions = model.tiers[2].results.map((result) => result.description);
    expect(dedupTierDescriptions.includes("dedup-A") || dedupTierDescriptions.includes("dedup-B")).toBe(true);
    expect(dedupTierDescriptions.includes("dedup-A") && dedupTierDescriptions.includes("dedup-B")).toBe(false);
  });

  it("returns an empty model when no tier remains after tolerance filtering", () => {
    const model = buildRankingModel([makeResult(1, 10, "too-far", leaf(110, "too-far"))], {
      target: 100,
      relTolerance: 0.05,
    });

    expect(model.tiers).toEqual([]);
    expect(model.anchorIndex).toBe(0);
  });
});

describe("selectKnee", () => {
  const tier = (count: number, bestError: number): TierCard => ({
    count,
    bestError,
    results: [
      {
        node: leaf(100 + bestError, `${count}-${bestError}`),
        count,
        value: 100 + bestError,
        absError: bestError,
        deviationPct: bestError,
        description: `${count}-${bestError}`,
      },
    ],
  });

  it("returns index 0 for one or two tiers", () => {
    expect(selectKnee([tier(3, 1)])).toBe(0);
    expect(selectKnee([tier(5, 0.5), tier(2, 2)])).toBe(0);
  });

  it("returns the strongest elbow index for longer spines", () => {
    const tiers = [tier(5, 0.2), tier(4, 0.4), tier(3, 0.9), tier(2, 1.8), tier(1, 3.6)];
    expect(selectKnee(tiers)).toBe(2);
  });
});
