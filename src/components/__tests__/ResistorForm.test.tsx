import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResistorForm from "../ResistorForm.js";

describe("ResistorForm tabs", () => {
  it("defaults to the E3 tab with read-only generated content", () => {
    render(<ResistorForm onCalculate={vi.fn()} />);

    const tab = screen.getByRole("tab", { name: "E3" });
    expect(tab).toHaveAttribute("aria-selected", "true");

    const textarea = screen.getByPlaceholderText(/100, 220, 330/) as HTMLTextAreaElement;
    expect(textarea).toHaveAttribute("readonly");
    expect(textarea.value).toContain("1, 2.2, 4.7");
    expect(textarea.value).toContain("1k, 2.2k, 4.7k");
  });

  it("shows an editable, empty textarea when switching to Custom", async () => {
    render(<ResistorForm onCalculate={vi.fn()} />);

    await userEvent.click(screen.getByRole("tab", { name: "Custom" }));

    const textarea = screen.getByPlaceholderText(/100, 220, 330/) as HTMLTextAreaElement;
    expect(textarea).not.toHaveAttribute("readonly");
    expect(textarea.value).toBe("");
  });

  it("preserves custom text when switching tabs away and back", async () => {
    render(<ResistorForm onCalculate={vi.fn()} />);

    await userEvent.click(screen.getByRole("tab", { name: "Custom" }));
    const textarea = screen.getByPlaceholderText(/100, 220, 330/) as HTMLTextAreaElement;
    await userEvent.type(textarea, "100, 220, 330");

    await userEvent.click(screen.getByRole("tab", { name: "E3" }));
    await userEvent.click(screen.getByRole("tab", { name: "Custom" }));

    expect((screen.getByPlaceholderText(/100, 220, 330/) as HTMLTextAreaElement).value).toBe(
      "100, 220, 330"
    );
  });

  it("shows generated content for E24 when selected", async () => {
    render(<ResistorForm onCalculate={vi.fn()} />);

    await userEvent.click(screen.getByRole("tab", { name: "E24" }));

    const textarea = screen.getByPlaceholderText(/100, 220, 330/) as HTMLTextAreaElement;
    expect(textarea.value).toContain("1, 1.1, 1.2");
  });
});

describe("ResistorForm validation", () => {
  it("shows a validation error when no values are provided", async () => {
    const onCalculate = vi.fn();
    render(<ResistorForm onCalculate={onCalculate} />);

    await userEvent.click(screen.getByRole("tab", { name: "Custom" }));
    await userEvent.type(screen.getByPlaceholderText("660"), "220");
    await userEvent.click(screen.getByRole("button", { name: /calculate/i }));

    expect(await screen.findByText(/at least one available resistor value/i)).toBeInTheDocument();
    expect(onCalculate).not.toHaveBeenCalled();
  });

  it("shows a validation error for a non-positive target", async () => {
    const onCalculate = vi.fn();
    render(<ResistorForm onCalculate={onCalculate} />);

    await userEvent.click(screen.getByRole("tab", { name: "Custom" }));
    await userEvent.type(screen.getByPlaceholderText(/100, 220, 330/), "100, 220");
    await userEvent.type(screen.getByPlaceholderText("660"), "0");
    await userEvent.click(screen.getByRole("button", { name: /calculate/i }));

    expect(await screen.findByText(/target value must be a positive number/i)).toBeInTheDocument();
    expect(onCalculate).not.toHaveBeenCalled();
  });

  it("blocks calculation and reports the invalid token", async () => {
    const onCalculate = vi.fn();
    render(<ResistorForm onCalculate={onCalculate} />);

    await userEvent.click(screen.getByRole("tab", { name: "Custom" }));
    await userEvent.type(screen.getByPlaceholderText(/100, 220, 330/), "100, abc, 220");
    await userEvent.type(screen.getByPlaceholderText("660"), "220");
    await userEvent.click(screen.getByRole("button", { name: /calculate/i }));

    expect(await screen.findByText(/invalid value\(s\): abc/i)).toBeInTheDocument();
    expect(onCalculate).not.toHaveBeenCalled();
  });

  it("calls onCalculate with parsed values and target when valid", async () => {
    const onCalculate = vi.fn();
    render(<ResistorForm onCalculate={onCalculate} />);

    await userEvent.click(screen.getByRole("tab", { name: "Custom" }));
    await userEvent.type(screen.getByPlaceholderText(/100, 220, 330/), "100, 220, 330");
    await userEvent.type(screen.getByPlaceholderText("660"), "660");
    await userEvent.click(screen.getByRole("button", { name: /calculate/i }));

    expect(onCalculate).toHaveBeenCalledWith([100, 220, 330], 660);
  });

  it("calculates using values from a predefined tab without typing", async () => {
    const onCalculate = vi.fn();
    render(<ResistorForm onCalculate={onCalculate} />);

    await userEvent.type(screen.getByPlaceholderText("660"), "660");
    await userEvent.click(screen.getByRole("button", { name: /calculate/i }));

    expect(onCalculate).toHaveBeenCalledTimes(1);
    const [values, target] = onCalculate.mock.calls[0];
    expect(values).toContain(4.7);
    expect(target).toBe(660);
  });
});
