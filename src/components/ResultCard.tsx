import type { NetworkResult } from "../network.js";
import "./ResultCard.scss";

interface Props {
  result: NetworkResult;
}

function formatResistorValue(value: number): string {
  return `${Math.round(value)}Ω`;
}

function formatDeviation(value: number): string {
  if (Object.is(value, 0)) {
    return "0.00%";
  }

  const sign = value >= 0 ? "+" : "-";
  const abs = Math.abs(value);

  if (abs > 0 && abs < 0.01) {
    return `${sign}<0.01%`;
  }

  return `${sign}${abs.toFixed(2)}%`;
}

function ResultCard({ result }: Props) {
  const isExact = result.absError < Number.EPSILON;
  const isSmallError = Math.abs(result.deviationPct) < 1;
  const statusLabel = isExact ? "Exact Match" : "Approximate match";
  const statusTone = isExact ? "exact" : isSmallError ? "near" : "wide";

  return (
    <article className="result-card" role="listitem">
      <p className={`result-card__status result-card__status--${statusTone}`}>
        {statusLabel}
      </p>
      <p className="result-card__value" aria-label={`R sub o equals ${formatResistorValue(result.value)}`}>
        <span className="result-card__value-label">
          R<sub>o</sub>=
        </span>
        {formatResistorValue(result.value)}
      </p>
      <p className="result-card__deviation">Deviation: {formatDeviation(result.deviationPct)}</p>
      <p className="result-card__description" data-testid="network-description">
        {result.description}
      </p>
    </article>
  );
}

export default ResultCard;
