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
  it("shows <0.01% for non-exact deviations that round to 0.00%", () => {
    render(<ResultCard result={makeResult(1000.05, 0.05)} target={1000} />);

    expect(screen.getByText("Deviation: +<0.01%")).toBeInTheDocument();
  });

  it("keeps 0.00% for an exact match", () => {
    render(<ResultCard result={makeResult(1000, 0)} target={1000} />);

    expect(screen.getByText("Deviation: +0.00%")).toBeInTheDocument();
  });
});