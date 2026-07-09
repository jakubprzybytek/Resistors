import { useState } from "react";
import type { RankingModel } from "../resultRanking.js";
import TierCard from "./TierCard.tsx";
import "./RankingView.scss";

interface Props {
  model: RankingModel | null;
}

function RankingView({ model }: Props) {
  if (!model || model.tiers.length === 0) {
    return (
      <div className="result-card result-card--empty ranking-view__empty" role="status">
        <p>No results could be determined for the given inputs within +/-5% and the 5-resistor limit.</p>
      </div>
    );
  }

  const [topIndex, setTopIndex] = useState(model.anchorIndex);
  const [bottomIndex, setBottomIndex] = useState(model.anchorIndex);
  const [positions, setPositions] = useState<number[]>(() => model.tiers.map(() => 0));

  const hasMoreAccurate = topIndex > 0;
  const hasSimpler = bottomIndex < model.tiers.length - 1;
  const visibleTiers = model.tiers.slice(topIndex, bottomIndex + 1);

  const movePosition = (index: number, delta: -1 | 1) => {
    setPositions((current) => {
      const next = [...current];
      const tier = model.tiers[index];
      const nextPosition = Math.max(0, Math.min(current[index] + delta, tier.results.length - 1));
      next[index] = nextPosition;
      return next;
    });
  };

  return (
    <section className="ranking-view" aria-label="Calculated results">
      {hasMoreAccurate && (
        <button
          className="ranking-view__nav"
          type="button"
          onClick={() => setTopIndex((current) => current - 1)}
        >
          Show more accurate
        </button>
      )}

      <div className="ranking-view__tiers">
        {visibleTiers.map((tier, offset) => {
          const index = topIndex + offset;
          const position = positions[index];

          return (
            <TierCard
              key={tier.count}
              tier={tier}
              position={position}
              onPrev={() => movePosition(index, -1)}
              onNext={() => movePosition(index, 1)}
            />
          );
        })}
      </div>

      {hasSimpler && (
        <button
          className="ranking-view__nav"
          type="button"
          onClick={() => setBottomIndex((current) => current + 1)}
        >
          Show simpler
        </button>
      )}
    </section>
  );
}

export default RankingView;
