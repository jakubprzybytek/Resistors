import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ResultCard from "../ResultCard.js";
import type { NetworkResult } from "../../network.js";

function makeResult(value: number, absError: number): NetworkResult {
  return {
    node: { kind: "leaf", value, description: `${value}Ω`, signature: `${value}` },
    count: 1,
    value,
    absError,
    deviationPct: ((value - 1000) / 1000) * 100,
    description: `${value}Ω`,
  };
}

describe("ResultCard", () => {
  it("formats value at the 1kΩ boundary with k suffix", () => {
    render(<ResultCard result={makeResult(1000, 0)} />);

    expect(screen.getByText("1kΩ", { selector: ".result-card__value" })).toBeInTheDocument();
  });

  it("formats values below 1kΩ without suffix", () => {
    render(<ResultCard result={makeResult(470, 0)} />);

    expect(screen.getByText("470Ω", { selector: ".result-card__value" })).toBeInTheDocument();
  });

  it("formats values in kΩ range with k suffix", () => {
    render(<ResultCard result={makeResult(4700, 0)} />);

    expect(screen.getByText("4.7kΩ", { selector: ".result-card__value" })).toBeInTheDocument();
  });

  it("formats values in MΩ range with M suffix", () => {
    render(<ResultCard result={makeResult(2_200_000, 0)} />);

    expect(screen.getByText("2.2MΩ", { selector: ".result-card__value" })).toBeInTheDocument();
  });

  it("shows exact match status for zero error", () => {
    render(<ResultCard result={makeResult(1000, 0)} />);

    expect(screen.getByText("Exact match")).toBeInTheDocument();
  });

  it("shows approximate match status for non-zero error", () => {
    render(<ResultCard result={makeResult(1000.05, 0.05)} />);

    expect(screen.getByText("Approximate match (within 5%)")).toBeInTheDocument();
  });
});