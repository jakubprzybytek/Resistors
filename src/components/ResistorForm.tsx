import { useEffect, useState, type FormEvent } from "react";
import "./ResistorForm.scss";
import { parseResistorValues } from "../resistorValueTokens.js";
import { formatSeriesAsRows, type SeriesName } from "../resistorSeries.js";

interface Props {
  onCalculate: (values: number[], target: number) => void;
}

type SeriesTab = SeriesName | "Custom";

const TABS: SeriesTab[] = ["E3", "E6", "E12", "E24", "Custom"];
const STORAGE_KEYS = {
  activeTab: "resistor-form.activeTab",
  customText: "resistor-form.customText",
  targetText: "resistor-form.targetText",
};

function readStoredValue(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore persistence failures and keep the form usable.
  }
}

function isSeriesTab(value: string | null): value is SeriesTab {
  return value !== null && TABS.includes(value as SeriesTab);
}

function getInitialActiveTab() {
  const storedTab = readStoredValue(STORAGE_KEYS.activeTab);
  return isSeriesTab(storedTab) ? storedTab : TABS[0];
}

function getInitialStoredText(key: string) {
  return readStoredValue(key) ?? "";
}

function ResistorForm({ onCalculate }: Props) {
  const [activeTab, setActiveTab] = useState<SeriesTab>(getInitialActiveTab);
  const [customText, setCustomText] = useState(() => getInitialStoredText(STORAGE_KEYS.customText));
  const [targetText, setTargetText] = useState(() => getInitialStoredText(STORAGE_KEYS.targetText));
  const [error, setError] = useState<string | null>(null);

  const isCustomTab = activeTab === "Custom";
  const valuesText = isCustomTab ? customText : formatSeriesAsRows(activeTab);

  useEffect(() => {
    writeStoredValue(STORAGE_KEYS.activeTab, activeTab);
  }, [activeTab]);

  useEffect(() => {
    writeStoredValue(STORAGE_KEYS.customText, customText);
  }, [customText]);

  useEffect(() => {
    writeStoredValue(STORAGE_KEYS.targetText, targetText);
  }, [targetText]);

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
          type="number"
          min="0"
          step="any"
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
