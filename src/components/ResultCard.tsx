import type { NetworkResult } from "../network.js";
import "./ResultCard.scss";

interface Props {
  result: NetworkResult;
  target: number;
}

function formatDeviation(deviation: number): string {
  const absDeviation = Math.abs(deviation);
  const sign = deviation >= 0 ? "+" : "-";

  if (absDeviation > 0 && absDeviation < 0.01) {
    return `${sign}<0.01%`;
  }

  return `${sign}${absDeviation.toFixed(2)}%`;
}

function ResultCard({ result, target }: Props) {
  const deviation = result.deviationPct;
  const deviationStr = formatDeviation(deviation);
  const isExact = result.absError < Number.EPSILON;

  return (
    <article className="result-card" role="listitem">
      <p className="result-card__status">
        {isExact ? "Exact match" : "Approximate match (within 5%)"}
      </p>
      <p className="result-card__value">
        {result.value.toFixed(2)}Ω using {result.count} resistor{result.count === 1 ? "" : "s"}
      </p>
      <p className="result-card__deviation">Deviation: {deviationStr}</p>
      <p className="result-card__description" data-testid="network-description">
        {result.description}
      </p>
    </article>
  );
}

export default ResultCard;
