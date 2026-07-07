import { useState } from "react";
import ResistorForm from "./components/ResistorForm.tsx";
import ResultsList from "./components/ResultsList.tsx";
import { findAllResistorNetworks, type NetworkResult } from "./network.js";
import { sortResults, type RankingMode } from "./resultRanking.js";
import "./App.scss";

function App() {
  const [results, setResults] = useState<NetworkResult[]>([]);
  const [ranking, setRanking] = useState<RankingMode>("accuracy");
  const [visibleCount, setVisibleCount] = useState(3);
  const [target, setTarget] = useState<number | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  const handleCalculate = (values: number[], targetValue: number) => {
    const start = performance.now();
    const found = findAllResistorNetworks(values, targetValue, {
      relTolerance: 0.05,
      maxResistors: 5,
    });
    const durationMs = performance.now() - start;

    console.log(`Found results: ${found.length}`);
    console.log(`Computation time: ${durationMs.toFixed(2)}ms`);

    setResults(sortResults(found, ranking));
    setVisibleCount(3);
    setTarget(targetValue);
    setHasCalculated(true);
  };

  const handleRankingChange = (mode: RankingMode) => {
    setRanking(mode);
    setResults((current) => sortResults(current, mode));
    setVisibleCount(3);
  };

  const handleShowMore = () => {
    setVisibleCount((current) => Math.min(current + 3, results.length));
  };

  return (
    <main className="app">
      <h1 className="app__title">Resistor Network Calculator</h1>
      <p className="app__subtitle">// find a resistor combination that hits your target</p>
      <ResistorForm onCalculate={handleCalculate} />
      {hasCalculated && (
        <ResultsList
          results={results}
          visibleCount={visibleCount}
          ranking={ranking}
          onRankingChange={handleRankingChange}
          onShowMore={handleShowMore}
          target={target ?? 0}
        />
      )}
    </main>
  );
}

export default App;
