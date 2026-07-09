import { canonicalKey, COMPARISON_EPSILON, type NetworkResult } from "./network.js";

export interface TierCard {
  count: number;
  bestError: number;
  results: NetworkResult[];
}

export interface RankingModel {
  tiers: TierCard[];
  anchorIndex: number;
}

interface BuildRankingOptions {
  target: number;
  relTolerance?: number;
}

interface TierBuild {
  count: number;
  bestError: number;
  results: NetworkResult[];
}

function compareByError(left: NetworkResult, right: NetworkResult): number {
  return left.absError - right.absError;
}

function deduplicateResults(results: NetworkResult[]): NetworkResult[] {
  const deduped = new Map<string, NetworkResult>();

  for (const result of results) {
    const key = canonicalKey(result.node);
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, result);
      continue;
    }

    if (
      result.absError < existing.absError - COMPARISON_EPSILON ||
      (Math.abs(result.absError - existing.absError) <= COMPARISON_EPSILON && result.count < existing.count)
    ) {
      deduped.set(key, result);
    }
  }

  return [...deduped.values()];
}

function buildParetoTiers(results: NetworkResult[]): TierBuild[] {
  const byCount = new Map<number, NetworkResult[]>();

  for (const result of results) {
    const countResults = byCount.get(result.count) ?? [];
    countResults.push(result);
    byCount.set(result.count, countResults);
  }

  const countsAsc = [...byCount.keys()].sort((left, right) => left - right);
  const keptAsc: TierBuild[] = [];
  let bestSoFar = Number.POSITIVE_INFINITY;

  for (const count of countsAsc) {
    const sorted = [...(byCount.get(count) ?? [])].sort(compareByError);
    if (sorted.length === 0) continue;

    const bestError = sorted[0].absError;
    if (bestError < bestSoFar - COMPARISON_EPSILON) {
      keptAsc.push({ count, bestError, results: sorted });
      bestSoFar = bestError;
    }
  }

  return keptAsc.reverse();
}

function boundTierResults(tiers: TierBuild[], toleranceEdge: number): TierCard[] {
  return tiers.map((tier, index) => {
    const nextSimpler = tiers[index + 1];
    const bound = Math.min(nextSimpler?.bestError ?? toleranceEdge, toleranceEdge);

    const bounded = tier.results.filter(
      (result) =>
        result.absError >= tier.bestError - COMPARISON_EPSILON &&
        result.absError < bound - COMPARISON_EPSILON
    );

    if (bounded.length === 0 && tier.results.length > 0) {
      bounded.push(tier.results[0]);
    }

    return {
      count: tier.count,
      bestError: tier.bestError,
      results: bounded,
    };
  });
}

export function selectKnee(tiers: TierCard[]): number {
  if (tiers.length <= 1) return 0;
  if (tiers.length === 2) return 0;

  const counts = tiers.map((tier) => tier.count);
  const errors = tiers.map((tier) => tier.bestError);

  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  const minError = Math.min(...errors);
  const maxError = Math.max(...errors);

  if (
    Math.abs(maxCount - minCount) <= COMPARISON_EPSILON ||
    Math.abs(maxError - minError) <= COMPARISON_EPSILON
  ) {
    return 0;
  }

  const points = tiers.map((tier) => ({
    x: (tier.count - minCount) / (maxCount - minCount),
    y: (tier.bestError - minError) / (maxError - minError),
  }));

  const start = points[0];
  const end = points[points.length - 1];
  const lineDx = end.x - start.x;
  const lineDy = end.y - start.y;
  const lineLength = Math.hypot(lineDx, lineDy);

  if (lineLength <= COMPARISON_EPSILON) {
    return 0;
  }

  let bestIndex = 0;
  let bestDistance = -1;

  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    // x is normalized from max-count (1) to min-count (0), so endpoint dx is guaranteed non-zero here.
    const interpolationFactor = (point.x - start.x) / lineDx;
    const lineY = start.y + interpolationFactor * lineDy;

    // Skip points above the endpoint line because they are worse-than-linear trade-offs and cannot be knees.
    if (point.y > lineY + COMPARISON_EPSILON) {
      continue;
    }

    const area = Math.abs(lineDx * (start.y - point.y) - (start.x - point.x) * lineDy);
    const distance = area / lineLength;

    if (distance > bestDistance + COMPARISON_EPSILON) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

export function buildRankingModel(
  results: NetworkResult[],
  options: BuildRankingOptions
): RankingModel {
  const toleranceEdge = (options.relTolerance ?? 0.05) * options.target;
  const withinTolerance = results.filter((result) => result.absError <= toleranceEdge + COMPARISON_EPSILON);
  const deduped = deduplicateResults(withinTolerance);
  const paretoTiers = buildParetoTiers(deduped);
  const tiers = boundTierResults(paretoTiers, toleranceEdge);

  return {
    tiers,
    anchorIndex: selectKnee(tiers),
  };
}
