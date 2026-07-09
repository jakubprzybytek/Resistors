import type { NetworkResult } from "../network.js";
import "./ResultCard.scss";

interface Props {
  result: NetworkResult;
}

function formatResistorValue(value: number): string {
  return `${Math.round(value)}Ω`;
}

function ResultCard({ result }: Props) {
  const isExact = result.absError < Number.EPSILON;

  return (
    <article className="result-card" role="listitem">
      <p className="result-card__status">
        {isExact ? "Exact match" : "Approximate match (within 5%)"}
      </p>
      <p className="result-card__value">
        {formatResistorValue(result.value)}
      </p>
      <p className="result-card__description" data-testid="network-description">
        {result.description}
      </p>
    </article>
  );
}

export default ResultCard;
