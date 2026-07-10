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

function expectComputedValue(value: string) {
  expect(document.querySelector(".result-card__value")).toHaveTextContent(value);
}

describe("ResultCard", () => {
  it("formats value at the 1kΩ boundary as a whole number without suffixes", () => {
    render(<ResultCard result={makeResult(1000, 0)} />);

    expectComputedValue("Ro=1000Ω");
  });

  it("formats values below 1kΩ without suffix", () => {
    render(<ResultCard result={makeResult(470, 0)} />);

    expectComputedValue("Ro=470Ω");
  });

  it("formats values in kΩ range without suffixes", () => {
    render(<ResultCard result={makeResult(4700, 0)} />);

    expectComputedValue("Ro=4700Ω");
  });

  it("formats values in MΩ range without suffixes", () => {
    render(<ResultCard result={makeResult(2_200_000, 0)} />);

    expectComputedValue("Ro=2200000Ω");
  });

  it("rounds displayed values to whole ohms", () => {
    render(<ResultCard result={makeResult(1000.49, 0.49)} />);

    expectComputedValue("Ro=1000Ω");
  });

  it("shows exact match status for zero error", () => {
    render(<ResultCard result={makeResult(1000, 0)} />);

    expect(screen.getByText("Exact Match")).toHaveClass("result-card__status--exact");
  });

  it("shows blue approximate status for errors below 1%", () => {
    render(<ResultCard result={makeResult(1000.05, 0.05)} />);

    expect(screen.getByText("Approximate match")).toHaveClass("result-card__status--near");
  });

  it("shows orange approximate status for errors of 1% or more", () => {
    render(<ResultCard result={makeResult(1010, 10)} />);

    expect(screen.getByText("Approximate match")).toHaveClass("result-card__status--wide");
  });

  it("shows deviation inside the result card", () => {
    render(<ResultCard result={makeResult(1000.005, 0.005)} />);

    expect(screen.getByText("Deviation: +<0.01%")).toBeInTheDocument();
  });

  it("renders a schematic with two terminals below the description", () => {
    render(<ResultCard result={makeResult(1000, 0)} />);

    expect(screen.getByTestId("network-schematic")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /schematic/i })).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});