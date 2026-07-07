import type { NetworkResult } from "./network.js";

export type RankingMode = "accuracy" | "resistorCount";

export function sortResults(results: NetworkResult[], mode: RankingMode): NetworkResult[] {
  return [...results].sort((left, right) => {
    if (mode === "accuracy") {
      return left.absError - right.absError || left.count - right.count;
    }

    return left.count - right.count || left.absError - right.absError;
  });
}