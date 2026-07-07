import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResultsList from "../ResultsList.js";
import type { NetworkResult } from "../../network.js";
import type { RankingMode } from "../../resultRanking.js";
import { sortResults } from "../../resultRanking.js";

const makeResult = (
  description: string,
  value: number,
  count: number,
  absError: number
): NetworkResult => ({
  node: { kind: "leaf", value, description, signature: description },
  count,
  value,
  absError,
  deviationPct: (value - 300) / 3,
  description,
});

const RESULTS = [
  makeResult("result-1", 300, 1, 0),
  makeResult("result-2", 301, 2, 1),
  makeResult("result-3", 302, 3, 2),
  makeResult("result-4", 303, 4, 3),
  makeResult("result-5", 304, 5, 4),
];

function renderResultsList(override: Partial<Parameters<typeof ResultsList>[0]> = {}) {
  const props = {
    results: RESULTS,
    visibleCount: 3,
    ranking: "accuracy" as RankingMode,
    onRankingChange: vi.fn(),
    onShowMore: vi.fn(),
    target: 300,
    ...override,
  };

  render(<ResultsList {...props} />);
  return props;
}

describe("ResultsList", () => {
  it("renders the first three results initially", () => {
    renderResultsList();

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("result-1")).toBeInTheDocument();
    expect(screen.queryByText("result-4")).not.toBeInTheDocument();
  });

  it("shows the rest of the results after Show 3 more", async () => {
    const onShowMore = vi.fn();
    const user = userEvent.setup();
    const props = {
      results: RESULTS,
      visibleCount: 3,
      ranking: "accuracy" as RankingMode,
      onRankingChange: vi.fn(),
      onShowMore,
      target: 300,
    };
    const view = render(<ResultsList {...props} />);

    await user.click(screen.getByRole("button", { name: /show 3 more/i }));
    expect(onShowMore).toHaveBeenCalledTimes(1);

    view.rerender(<ResultsList {...props} visibleCount={5} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByRole("button", { name: /show 3 more/i })).not.toBeInTheDocument();
  });

  it("renders an empty-state message when there are no results", () => {
    renderResultsList({ results: [] });

    expect(screen.getByRole("status")).toHaveTextContent(/no results could be determined/i);
    expect(screen.queryByRole("tab", { name: /accuracy/i })).not.toBeInTheDocument();
  });

  it("reflects ranking changes by rendering the supplied ordering", async () => {
    const onRankingChange = vi.fn();
    const user = userEvent.setup();
    const props = {
      results: sortResults(RESULTS, "accuracy"),
      visibleCount: 3,
      ranking: "accuracy" as RankingMode,
      onRankingChange,
      onShowMore: vi.fn(),
      target: 300,
    };
    const view = render(<ResultsList {...props} />);

    await user.click(screen.getByRole("tab", { name: /resistor count/i }));
    expect(onRankingChange).toHaveBeenCalledWith("resistorCount");

    view.rerender(
      <ResultsList
        {...props}
        results={sortResults([...RESULTS].reverse(), "resistorCount")}
        visibleCount={3}
        onRankingChange={onRankingChange}
        onShowMore={props.onShowMore}
        target={300}
        ranking={"resistorCount"}
      />
    );

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("result-1");
  });

  it("resets the visible slice to the first three results when ranking changes", () => {
    const props = {
      results: sortResults(RESULTS, "resistorCount"),
      visibleCount: 3,
      ranking: "resistorCount",
      onRankingChange: vi.fn(),
      onShowMore: vi.fn(),
      target: 300,
    };

    render(<ResultsList {...props} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});