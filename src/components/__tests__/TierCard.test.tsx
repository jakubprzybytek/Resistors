import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TierCard from "../TierCard.js";
import type { TierCard as TierCardModel } from "../../resultRanking.js";
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

const TIER: TierCardModel = {
  count: 3,
  bestError: 1,
  results: [makeResult("best", 3, 1), makeResult("alt-1", 3, 1.5), makeResult("alt-2", 3, 1.9)],
};

describe("TierCard", () => {
  it("starts at first result and disables previous arrow", () => {
    render(<TierCard tier={TIER} position={0} onPrev={vi.fn()} onNext={vi.fn()} target={100} />);

    expect(screen.getByText("best")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous configuration/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next configuration/i })).toBeEnabled();
  });

  it("advances and returns through carousel controls", async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { rerender } = render(
      <TierCard tier={TIER} position={0} onPrev={onPrev} onNext={onNext} target={100} />
    );

    await user.click(screen.getByRole("button", { name: /next configuration/i }));
    expect(onNext).toHaveBeenCalledTimes(1);

    rerender(<TierCard tier={TIER} position={1} onPrev={onPrev} onNext={onNext} target={100} />);
    expect(screen.getByText("alt-1")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /previous configuration/i }));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("disables next arrow at the end", () => {
    render(<TierCard tier={TIER} position={2} onPrev={vi.fn()} onNext={vi.fn()} target={100} />);

    expect(screen.getByText("alt-2")).toBeInTheDocument();
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next configuration/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /previous configuration/i })).toBeEnabled();
  });
});
