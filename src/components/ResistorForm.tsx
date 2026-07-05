import { useState, type FormEvent } from "react";
import "./ResistorForm.scss";

interface Props {
  onCalculate: (values: number[], target: number) => void;
}

export function parseResistorValues(input: string): number[] {
  return input
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s));
}

function ResistorForm({ onCalculate }: Props) {
  const [valuesText, setValuesText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const values = parseResistorValues(valuesText);
    if (values.length === 0) {
      setError("Enter at least one available resistor value.");
      return;
    }
    if (values.some((v) => !Number.isFinite(v) || v <= 0)) {
      setError("Available values must be positive numbers.");
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
      <label className="resistor-form__field">
        <span>Available resistor values (Ω, comma or newline separated)</span>
        <textarea
          className="resistor-form__textarea"
          value={valuesText}
          onChange={(e) => setValuesText(e.target.value)}
          rows={6}
          placeholder={"100, 220, 330\n1000\n4700"}
        />
      </label>
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
