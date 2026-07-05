import { useState } from "react";
import ResistorForm from "./components/ResistorForm.tsx";
import ResultCard from "./components/ResultCard.tsx";
import { findResistorNetworkUnlimited } from "./network.js";
import type { SearchResult } from "./network.js";
import "./App.scss";

function App() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);

  const handleCalculate = (values: number[], targetValue: number) => {
    const found = findResistorNetworkUnlimited(values, targetValue, { relTolerance: 0.01 });
    setResult(found);
    setTarget(targetValue);
    setSearched(true);
  };

  return (
    <main className="app">
      <h1 className="app__title">Resistor Network Calculator</h1>
      <ResistorForm onCalculate={handleCalculate} />
      {searched && <ResultCard result={result} target={target ?? 0} />}
    </main>
  );
}

export default App;
