import { describe, expect, it } from "vitest";
import type { Node } from "../network.js";
import {
  buildSchematic,
  type ResistorShape,
  type TerminalShape,
  type WireShape,
} from "../schematicLayout.js";

function leaf(value: number, description = `${value}`): Node {
  return { kind: "leaf", value, description, signature: `leaf:${value}` };
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
  const value = (left.value * right.value) / (left.value + right.value);
  return {
    kind: "parallel",
    value,
    left,
    right,
    description: `${left.description} || ${right.description}`,
    signature: `parallel:${left.signature}|${right.signature}`,
  };
}

const resistors = (shapes: { kind: string }[]) =>
  shapes.filter((shape): shape is ResistorShape => shape.kind === "resistor");
const terminals = (shapes: { kind: string }[]) =>
  shapes.filter((shape): shape is TerminalShape => shape.kind === "terminal");
const wires = (shapes: { kind: string }[]) =>
  shapes.filter((shape): shape is WireShape => shape.kind === "wire");

describe("buildSchematic", () => {
  it("renders a single resistor between two labelled terminals", () => {
    const schematic = buildSchematic(leaf(100, "100"));

    const drawnResistors = resistors(schematic.shapes);
    expect(drawnResistors).toHaveLength(1);
    expect(drawnResistors[0].label).toBe("100");

    const drawnTerminals = terminals(schematic.shapes);
    expect(drawnTerminals.map((terminal) => terminal.label)).toEqual(["A", "B"]);
    // Left terminal is left of the right terminal.
    expect(drawnTerminals[0].x).toBeLessThan(drawnTerminals[1].x);
  });

  it("supports custom terminal labels", () => {
    const schematic = buildSchematic(leaf(100), { leftTerminal: "+", rightTerminal: "-" });
    expect(terminals(schematic.shapes).map((terminal) => terminal.label)).toEqual(["+", "-"]);
  });

  it("places series resistors left-to-right on the same line", () => {
    const schematic = buildSchematic(series(leaf(100), leaf(220)));
    const drawn = resistors(schematic.shapes);

    expect(drawn).toHaveLength(2);
    expect(drawn[0].x).toBeLessThan(drawn[1].x);
    // Same horizontal spine.
    expect(drawn[0].y).toBe(drawn[1].y);
  });

  it("stacks parallel resistors vertically", () => {
    const schematic = buildSchematic(parallel(leaf(100), leaf(220)));
    const drawn = resistors(schematic.shapes);

    expect(drawn).toHaveLength(2);
    expect(drawn[0].y).not.toBe(drawn[1].y);
    // Share the same horizontal band (overlapping x extents).
    expect(drawn[0].x).toBe(drawn[1].x);
  });

  it("produces positive dimensions that bound every shape", () => {
    const node = series(leaf(100), parallel(leaf(220), leaf(330)));
    const schematic = buildSchematic(node);

    expect(schematic.width).toBeGreaterThan(0);
    expect(schematic.height).toBeGreaterThan(0);

    for (const shape of resistors(schematic.shapes)) {
      expect(shape.x + shape.width).toBeLessThanOrEqual(schematic.width);
      expect(shape.y + shape.height).toBeLessThanOrEqual(schematic.height);
    }
    for (const wire of wires(schematic.shapes)) {
      expect(Math.max(wire.x1, wire.x2)).toBeLessThanOrEqual(schematic.width);
      expect(Math.max(wire.y1, wire.y2)).toBeLessThanOrEqual(schematic.height);
    }
  });

  it("draws one resistor per leaf for a deep asymmetric network", () => {
    const node = series(
      leaf(100),
      series(parallel(leaf(220), leaf(330)), parallel(leaf(470), leaf(680)))
    );
    expect(resistors(buildSchematic(node).shapes)).toHaveLength(5);
  });
});
