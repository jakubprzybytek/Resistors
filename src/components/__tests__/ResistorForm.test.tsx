import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResistorForm, { parseResistorValues } from "../ResistorForm.js";

describe("parseResistorValues", () => {
  it("parses comma-separated values", () => {
    expect(parseResistorValues("100, 220, 330")).toEqual([100, 220, 330]);
  });

  it("parses newline-separated values", () => {
    expect(parseResistorValues("100\n220\n330")).toEqual([100, 220, 330]);
  });

  it("parses mixed comma and newline separators", () => {
    expect(parseResistorValues("100, 220\n330")).toEqual([100, 220, 330]);
  });

  it("ignores blank entries", () => {
    expect(parseResistorValues("100,,220\n\n330")).toEqual([100, 220, 330]);
  });
});

describe("ResistorForm", () => {
  it("shows a validation error when no values are provided", async () => {
    const onCalculate = vi.fn();
    render(<ResistorForm onCalculate={onCalculate} />);

    await userEvent.type(screen.getByPlaceholderText("660"), "220");
    await userEvent.click(screen.getByRole("button", { name: /calculate/i }));

    expect(await screen.findByText(/at least one available resistor value/i)).toBeInTheDocument();
    expect(onCalculate).not.toHaveBeenCalled();
  });

  it("shows a validation error for a non-positive target", async () => {
    const onCalculate = vi.fn();
    render(<ResistorForm onCalculate={onCalculate} />);

    await userEvent.type(screen.getByPlaceholderText(/100, 220, 330/), "100, 220");
    await userEvent.type(screen.getByPlaceholderText("660"), "0");
    await userEvent.click(screen.getByRole("button", { name: /calculate/i }));

    expect(await screen.findByText(/target value must be a positive number/i)).toBeInTheDocument();
    expect(onCalculate).not.toHaveBeenCalled();
  });

  it("calls onCalculate with parsed values and target when valid", async () => {
    const onCalculate = vi.fn();
    render(<ResistorForm onCalculate={onCalculate} />);

    await userEvent.type(screen.getByPlaceholderText(/100, 220, 330/), "100, 220, 330");
    await userEvent.type(screen.getByPlaceholderText("660"), "660");
    await userEvent.click(screen.getByRole("button", { name: /calculate/i }));

    expect(onCalculate).toHaveBeenCalledWith([100, 220, 330], 660);
  });
});
