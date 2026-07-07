import ResultCard from "./ResultCard.tsx";
import type { NetworkResult } from "../network.js";
import type { RankingMode } from "../resultRanking.js";
import "./ResultsList.scss";

interface Props {
  results: NetworkResult[];
  visibleCount: number;
  ranking: RankingMode;
  onRankingChange: (mode: RankingMode) => void;
  onShowMore: () => void;
  target: number;
}

const RANKINGS: { label: string; value: RankingMode }[] = [
  { label: "Accuracy", value: "accuracy" },
  { label: "Resistor Count", value: "resistorCount" },
];

function ResultsList({
  results,
  visibleCount,
  ranking,
  onRankingChange,
  onShowMore,
  target,
}: Props) {
  if (results.length === 0) {
    return (
      <div className="result-card result-card--empty results-list__empty" role="status">
        <p>No results could be determined for the given inputs within +/-5% and the 5-resistor limit.</p>
      </div>
    );
  }

  const visibleResults = results.slice(0, visibleCount);

  return (
    <section className="results-list" aria-label="Calculated results">
      <div className="results-list__ranking" role="tablist" aria-label="Result ranking">
        {RANKINGS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={ranking === value}
            className={
              "results-list__ranking-tab" +
              (ranking === value ? " results-list__ranking-tab--active" : "")
            }
            onClick={() => onRankingChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="results-list__items" role="list">
        {visibleResults.map((result) => (
          <ResultCard key={result.description} result={result} target={target} />
        ))}
      </div>
      {visibleCount < results.length && (
        <button className="results-list__show-more" type="button" onClick={onShowMore}>
          Show 3 more
        </button>
      )}
    </section>
  );
}

export default ResultsList;