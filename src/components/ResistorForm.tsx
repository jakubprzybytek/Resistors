import { useState, type FormEvent } from "react";
import "./ResistorForm.scss";
import { parseResistorValues } from "../resistorValueTokens.js";
import { formatSeriesAsRows, type SeriesName } from "../resistorSeries.js";

interface Props {
  onCalculate: (values: number[], target: number) => void;
}

type SeriesTab = SeriesName | "Custom";

const TABS: SeriesTab[] = ["E3", "E6", "E12", "E24", "Custom"];

function ResistorForm({ onCalculate }: Props) {
  const [activeTab, setActiveTab] = useState<SeriesTab>(TABS[0]);
  const [customText, setCustomText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isCustomTab = activeTab === "Custom";
  const valuesText = isCustomTab ? customText : formatSeriesAsRows(activeTab);

  const handleTabClick = (tab: SeriesTab) => {
    setActiveTab(tab);
    setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { values, invalidTokens } = parseResistorValues(valuesText);
    if (invalidTokens.length > 0) {
      setError(`Invalid value(s): ${invalidTokens.join(", ")}`);
      return;
    }
    if (values.length === 0) {
      setError("Enter at least one available resistor value.");
      return;
    }

    const target = Number(targetText.trim());
    if (!Number.isFinite(target) || target <= 0) {
      setError("Target value must be a positive number.");
      return;
    }

    setError(null);
    onCalculate(values, target);
  };

  return (
    <form className="resistor-form" onSubmit={handleSubmit}>
      <p className="resistor-form__label">Input parameters</p>
      <div className="resistor-form__field">
        <span>Available resistor values (Ω)</span>
        <div className="resistor-form__tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={
                "resistor-form__tab" +
                (activeTab === tab ? " resistor-form__tab--active" : "")
              }
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <textarea
          className="resistor-form__textarea"
          value={valuesText}
          onChange={(e) => isCustomTab && setCustomText(e.target.value)}
          readOnly={!isCustomTab}
          rows={6}
          placeholder={"100, 220, 330\n1000\n4700"}
        />
      </div>
      <label className="resistor-form__field">
        <span>Target resistance (Ω)</span>
        <input
          className="resistor-form__input"
          type="text"
          value={targetText}
          onChange={(e) => setTargetText(e.target.value)}
          placeholder="660"
        />
      </label>
      {error && <p className="resistor-form__error">{error}</p>}
      <button className="resistor-form__button" type="submit">
        &gt; Calculate
      </button>
    </form>
  );
}

export default ResistorForm;
