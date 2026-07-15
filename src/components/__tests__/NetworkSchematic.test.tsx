import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import NetworkSchematic from "../NetworkSchematic.js";
import type { Node } from "../../network.js";

function leaf(value: number): Node {
  return { kind: "leaf", value, description: `${value}`, signature: `leaf:${value}` };
}

function series(left: Node, right: Node): Node {
  return {
    kind: "series",
    value: left.value + right.value,
    left,
    right,
    description: `${left.description} + ${right.description}`,
    signature: `series:${left.signature}|${right.signature}`,
  };
}

function parallel(left: Node, right: Node): Node {
  return {
    kind: "parallel",
    value: (left.value * right.value) / (left.value + right.value),
    left,
    right,
    description: `${left.description} || ${right.description}`,
    signature: `parallel:${left.signature}|${right.signature}`,
  };
}

describe("NetworkSchematic", () => {
  it("renders an accessible svg with the two terminals", () => {
    render(<NetworkSchematic node={leaf(100)} description="100" />);

    const svg = screen.getByRole("img", { name: /schematic of 100/i });
    expect(svg).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("labels resistors using suffix tokens", () => {
    render(<NetworkSchematic node={series(leaf(4700), leaf(100))} description="4.7k + 100" />);

    expect(screen.getByText("4.7k")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders dots at connected wire intersections but not rail-end corners", () => {
    const { container } = render(
      <NetworkSchematic
        node={parallel(leaf(100), leaf(220))}
        description="100 || 220"
      />
    );

    expect(container.querySelectorAll(".network-schematic__junction")).toHaveLength(2);
  });
});
