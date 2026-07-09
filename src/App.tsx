import { useState } from "react";
import ResistorForm from "./components/ResistorForm.tsx";
import RankingView from "./components/RankingView.tsx";
import { findAllResistorNetworks } from "./network.js";
import { buildRankingModel, type RankingModel } from "./resultRanking.js";
import "./App.scss";

function App() {
  const [model, setModel] = useState<RankingModel | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [calcId, setCalcId] = useState(0);

  const handleCalculate = (values: number[], targetValue: number) => {
    const start = performance.now();
    const found = findAllResistorNetworks(values, targetValue, {
      relTolerance: 0.05,
      maxResistors: 5,
    });
    const durationMs = performance.now() - start;

    console.log(`Found results: ${found.length}`);
    console.log(`Computation time: ${durationMs.toFixed(2)}ms`);
    setModel(buildRankingModel(found, { relTolerance: 0.05, target: targetValue }));
    setHasCalculated(true);
    setCalcId((current) => current + 1);
  };

  return (
    <main className="app">
      <h1 className="app__title">Resistor Network Calculator</h1>
      <p className="app__subtitle">// find a resistor combination that hits your target</p>
      <ResistorForm onCalculate={handleCalculate} />
      {hasCalculated && <RankingView key={calcId} model={model} />}
    </main>
  );
}

export default App;
