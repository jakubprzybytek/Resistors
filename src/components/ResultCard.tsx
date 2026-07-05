import type { SearchResult } from "../network.js";
import "./ResultCard.scss";

interface Props {
  result: SearchResult | null;
  target: number;
}

function ResultCard({ result, target }: Props) {
  if (!result) {
    return (
      <div className="result-card result-card--empty" role="status">
        <p>No network could be found for the given values.</p>
      </div>
    );
  }

  const deviation = ((result.value - target) / target) * 100;
  const deviationStr = (deviation >= 0 ? "+" : "") + deviation.toFixed(2) + "%";

  return (
    <div className="result-card" role="status">
      <p className="result-card__status">
        {result.found ? "Exact match (within tolerance)" : "Closest possible match"}
      </p>
      <p className="result-card__value">
        {result.value.toFixed(2)}Ω using {result.count} resistor{result.count === 1 ? "" : "s"}
      </p>
      <p className="result-card__deviation">Deviation: {deviationStr}</p>
      <p className="result-card__description">{result.description}</p>
    </div>
  );
}

export default ResultCard;
