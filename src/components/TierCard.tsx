import type { TierCard as TierCardModel } from "../resultRanking.js";
import ResultCard from "./ResultCard.tsx";
import "./TierCard.scss";

interface Props {
  tier: TierCardModel;
  position: number;
  onPrev: () => void;
  onNext: () => void;
}

function TierCard({ tier, position, onPrev, onNext }: Props) {
  const currentResult = tier.results[position];
  const hasPrev = position > 0;
  const hasNext = position < tier.results.length - 1;

  return (
    <article className="tier-card" aria-label={`${tier.count}-resistor tier`}>
      <header className="tier-card__header">
        <h2 className="tier-card__title">
          {tier.count} resistor{tier.count === 1 ? "" : "s"}
        </h2>
      </header>

      <ResultCard result={currentResult} />

      <div className="tier-card__controls">
        <button
          className="tier-card__arrow"
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Previous configuration"
        >
          ←
        </button>
        <span className="tier-card__position">
          {position + 1} / {tier.results.length}
        </span>
        <button
          className="tier-card__arrow"
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next configuration"
        >
          →
        </button>
      </div>
    </article>
  );
}

export default TierCard;
