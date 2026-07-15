import { describe, expect, it } from "vitest";
import type { Node } from "../network.js";
import {
  buildSchematic,
  BRANCH_TAIL,
  type JunctionShape,
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
const junctions = (shapes: { kind: string }[]) =>
  shapes.filter((shape): shape is JunctionShape => shape.kind === "junction");

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

  it("marks three-way parallel wire intersections, but not rail-end corners", () => {
    const twoBranchSchematic = buildSchematic(parallel(leaf(100), leaf(220)));
    const threeBranchSchematic = buildSchematic(
      parallel(leaf(100), parallel(leaf(220), leaf(330)))
    );

    // Central leads meet the continuous rails as T junctions.
    expect(junctions(twoBranchSchematic.shapes)).toHaveLength(2);
    // The interior branch and central leads each meet both continuous rails.
    expect(junctions(threeBranchSchematic.shapes)).toHaveLength(4);
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

  it("draws a non-zero tail between the rails and each parallel branch", () => {
    const schematic = buildSchematic(parallel(leaf(100), leaf(220)));
    const drawnWires = wires(schematic.shapes);

    // Every horizontal stub connecting a rail to a resistor must be at least BRANCH_TAIL long.
    const stubs = drawnWires.filter((wire) => wire.y1 === wire.y2 && wire.x1 !== wire.x2);
    expect(stubs.length).toBeGreaterThan(0);
    for (const stub of stubs) {
      expect(Math.abs(stub.x2 - stub.x1)).toBeGreaterThanOrEqual(BRANCH_TAIL);
    }
  });

  it("draws a non-zero tail even for the widest parallel branch", () => {
    // The series branch is wider than the single-resistor branch, so the
    // series branch previously touched the rails directly.
    const schematic = buildSchematic(parallel(leaf(100), series(leaf(220), leaf(330))));
    const drawnWires = wires(schematic.shapes);
    const stubs = drawnWires.filter((wire) => wire.y1 === wire.y2 && wire.x1 !== wire.x2);

    expect(stubs.length).toBeGreaterThan(0);
    for (const stub of stubs) {
      expect(Math.abs(stub.x2 - stub.x1)).toBeGreaterThanOrEqual(BRANCH_TAIL);
    }
  });

  it("flattens nested same-kind parallel groups into a single set of rails", () => {
    // A || (B || C) should render as one 3-way parallel group, matching the
    // flattened "A || B || C" textual description, rather than nested rails.
    const nested = parallel(leaf(100), parallel(leaf(220), leaf(330)));
    const schematic = buildSchematic(nested);
    const drawnWires = wires(schematic.shapes);

    // Exactly two vertical rails (one pair), not two nested pairs.
    const verticalRails = drawnWires.filter((wire) => wire.x1 === wire.x2 && wire.y1 !== wire.y2);
    const railXs = new Set(verticalRails.map((wire) => wire.x1));
    expect(railXs.size).toBe(2);
    expect(resistors(schematic.shapes)).toHaveLength(3);
  });

  it("draws terminal labels without a side property, positioned above the dot", () => {
    const schematic = buildSchematic(leaf(100));
    const drawnTerminals = terminals(schematic.shapes);

    for (const terminal of drawnTerminals) {
      expect(terminal).not.toHaveProperty("side");
    }
  });
});
