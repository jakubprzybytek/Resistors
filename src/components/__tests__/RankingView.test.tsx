import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RankingView from "../RankingView.js";
import type { RankingModel } from "../../resultRanking.js";
import type { NetworkResult, Node } from "../../network.js";

function makeLeaf(label: string, value: number): Node {
  return { kind: "leaf", value, description: label, signature: label };
}

function makeResult(label: string, count: number, absError: number): NetworkResult {
  return {
    node: makeLeaf(label, 100 + absError),
    count,
    value: 100 + absError,
    absError,
    deviationPct: absError,
    description: label,
  };
}

const MODEL: RankingModel = {
  anchorIndex: 1,
  tiers: [
    { count: 5, bestError: 0.5, results: [makeResult("5-best", 5, 0.5)] },
    { count: 3, bestError: 1, results: [makeResult("3-best", 3, 1), makeResult("3-alt", 3, 1.4)] },
    { count: 2, bestError: 2, results: [makeResult("2-best", 2, 2)] },
  ],
};

describe("RankingView", () => {
  it("renders only the anchor tier initially", () => {
    render(<RankingView model={MODEL} />);

    expect(screen.getByRole("heading", { name: "3 resistors" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "5 resistors" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "2 resistors" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show more accurate/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /show simpler/i })).toBeVisible();
  });

  it("reveals adjacent tiers and keeps already shown tiers visible", async () => {
    const user = userEvent.setup();
    render(<RankingView model={MODEL} />);

    await user.click(screen.getByRole("button", { name: /show more accurate/i }));
    expect(screen.getByRole("heading", { name: "5 resistors" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show more accurate/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show simpler/i }));
    expect(screen.getByRole("heading", { name: "5 resistors" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "3 resistors" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2 resistors" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show simpler/i })).not.toBeInTheDocument();
  });

  it("renders empty state when model is missing or has no tiers", () => {
    const { rerender } = render(<RankingView model={null} />);

    expect(screen.getByRole("status")).toHaveTextContent(/no results could be determined/i);
    expect(screen.queryByRole("button", { name: /show simpler/i })).not.toBeInTheDocument();

    rerender(<RankingView model={{ anchorIndex: 0, tiers: [] }} />);
    expect(screen.getByRole("status")).toHaveTextContent(/no results could be determined/i);
  });
});
