import type { Node } from "./network.js";
import { formatValue } from "./resistorValueTokens.js";

// ----- Drawing primitives (absolute SVG user-space coordinates) -----

export interface ResistorShape {
  kind: "resistor";
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface WireShape {
  kind: "wire";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TerminalShape {
  kind: "terminal";
  x: number;
  y: number;
  label: string;
}

export interface JunctionShape {
  kind: "junction";
  x: number;
  y: number;
}

export type SchematicShape = ResistorShape | WireShape | TerminalShape | JunctionShape;

export interface Schematic {
  width: number;
  height: number;
  shapes: SchematicShape[];
}

// ----- Layout constants (SVG user units) -----

export const RESISTOR_WIDTH = 56;
export const RESISTOR_HEIGHT = 18;
export const LABEL_HEIGHT = 16;
const SERIES_GAP = 18;
const PARALLEL_GAP = 22;
const JUNCTION_LEAD = 16;
/** Minimum stub length between a parallel rail and its branch element, even for the widest branch. */
export const BRANCH_TAIL = 14;
const TERMINAL_LEAD = 24;
export const TERMINAL_RADIUS = 4;
/** Vertical space reserved above a terminal dot for its label. */
export const TERMINAL_LABEL_HEIGHT = 14;
const PADDING = 12;

interface Measured {
  width: number;
  height: number;
  /** Vertical offset of the horizontal through-wire from the top of the box. */
  centerY: number;
}

/**
 * Flattens a chain of same-kind series/parallel nodes into an ordered list of
 * children, so e.g. `A || (B || C)` is treated as a single 3-way parallel
 * group rather than two nested groups. This keeps the schematic consistent
 * with the flattened textual description (see network.ts).
 */
function flattenGroup(node: Node, kind: "series" | "parallel"): Node[] {
  if (node.kind !== kind) {
    return [node];
  }

  return [...flattenGroup(node.left, kind), ...flattenGroup(node.right, kind)];
}

function measure(node: Node): Measured {
  if (node.kind === "leaf") {
    const height = LABEL_HEIGHT + RESISTOR_HEIGHT;
    return {
      width: RESISTOR_WIDTH,
      height,
      centerY: LABEL_HEIGHT + RESISTOR_HEIGHT / 2,
    };
  }

  if (node.kind === "series") {
    const children = flattenGroup(node, "series").map(measure);
    const centerY = Math.max(...children.map((child) => child.centerY));
    const height = Math.max(
      ...children.map((child) => centerY - child.centerY + child.height)
    );
    const width =
      children.reduce((sum, child) => sum + child.width, 0) +
      SERIES_GAP * (children.length - 1);
    return { width, height, centerY };
  }

  // parallel: stack branches vertically between two shared rails.
  const children = flattenGroup(node, "parallel").map(measure);
  const branchWidth = Math.max(...children.map((child) => child.width)) + 2 * BRANCH_TAIL;
  const height =
    children.reduce((sum, child) => sum + child.height, 0) +
    PARALLEL_GAP * (children.length - 1);
  return {
    width: branchWidth + 2 * JUNCTION_LEAD,
    height,
    centerY: height / 2,
  };
}

/**
 * Recursively places a node so that its through-wire enters at (x, y + centerY)
 * on the left edge and exits at (x + width, y + centerY) on the right edge.
 */
function place(node: Node, x: number, y: number, shapes: SchematicShape[]): Measured {
  const box = measure(node);

  if (node.kind === "leaf") {
    shapes.push({
      kind: "resistor",
      x,
      y: y + LABEL_HEIGHT,
      width: RESISTOR_WIDTH,
      height: RESISTOR_HEIGHT,
      label: formatValue(node.value),
    });
    return box;
  }

  if (node.kind === "series") {
    const children = flattenGroup(node, "series");
    const measured = children.map(measure);
    const lineY = y + box.centerY;

    let cursorX = x;
    let previousChildRightX: number | null = null;
    for (let i = 0; i < children.length; i++) {
      const childBox = measured[i];
      place(children[i], cursorX, lineY - childBox.centerY, shapes);

      if (previousChildRightX !== null) {
        // Connecting wire between adjacent children.
        shapes.push({ kind: "wire", x1: previousChildRightX, y1: lineY, x2: cursorX, y2: lineY });
      }

      previousChildRightX = cursorX + childBox.width;
      cursorX = previousChildRightX + SERIES_GAP;
    }
    return box;
  }

  // parallel
  const children = flattenGroup(node, "parallel");
  const measured = children.map(measure);
  const branchWidth = box.width - 2 * JUNCTION_LEAD;
  const leftRailX = x + JUNCTION_LEAD;
  const rightRailX = x + box.width - JUNCTION_LEAD;
  const centerLineY = y + box.centerY;

  const lineYs: number[] = [];
  let topY = y;
  for (let i = 0; i < children.length; i++) {
    const childBox = measured[i];
    const childX = leftRailX + (branchWidth - childBox.width) / 2;
    const lineY = topY + childBox.centerY;
    lineYs.push(lineY);

    place(children[i], childX, topY, shapes);

    // Horizontal tails from the rails to the branch element (always at least BRANCH_TAIL long).
    shapes.push({ kind: "wire", x1: leftRailX, y1: lineY, x2: childX, y2: lineY });
    shapes.push({
      kind: "wire",
      x1: childX + childBox.width,
      y1: lineY,
      x2: rightRailX,
      y2: lineY,
    });
    if (i > 0 && i < children.length - 1) {
      shapes.push({ kind: "junction", x: leftRailX, y: lineY });
      shapes.push({ kind: "junction", x: rightRailX, y: lineY });
    }

    topY += childBox.height + PARALLEL_GAP;
  }

  const topLineY = Math.min(...lineYs);
  const bottomLineY = Math.max(...lineYs);

  // Vertical rails joining the branches.
  shapes.push({ kind: "wire", x1: leftRailX, y1: topLineY, x2: leftRailX, y2: bottomLineY });
  shapes.push({ kind: "wire", x1: rightRailX, y1: topLineY, x2: rightRailX, y2: bottomLineY });

  // Entry/exit leads into the rails, aligned to the node centre line.
  shapes.push({ kind: "wire", x1: x, y1: centerLineY, x2: leftRailX, y2: centerLineY });
  shapes.push({ kind: "wire", x1: rightRailX, y1: centerLineY, x2: x + box.width, y2: centerLineY });

  // A lead that meets the interior of a rail forms a T junction. When it
  // aligns with a branch row, that row has already supplied the marker.
  if (
    centerLineY > topLineY &&
    centerLineY < bottomLineY &&
    !lineYs.includes(centerLineY)
  ) {
    shapes.push({ kind: "junction", x: leftRailX, y: centerLineY });
    shapes.push({ kind: "junction", x: rightRailX, y: centerLineY });
  }

  return box;
}

export interface BuildSchematicOptions {
  /** Label for the left terminal (default "A"). */
  leftTerminal?: string;
  /** Label for the right terminal (default "B"). */
  rightTerminal?: string;
}

/**
 * Builds a full schematic for a resistor network node: the network itself,
 * lead wires, and the two labelled terminals at the far left and right.
 */
export function buildSchematic(node: Node, options: BuildSchematicOptions = {}): Schematic {
  const leftLabel = options.leftTerminal ?? "A";
  const rightLabel = options.rightTerminal ?? "B";

  const network = measure(node);
  const shapes: SchematicShape[] = [];

  const originX = PADDING + TERMINAL_LEAD;
  const originY = PADDING + TERMINAL_LABEL_HEIGHT;
  const lineY = originY + network.centerY;

  place(node, originX, originY, shapes);

  // Left terminal + lead.
  const leftTerminalX = PADDING;
  shapes.push({ kind: "wire", x1: leftTerminalX, y1: lineY, x2: originX, y2: lineY });
  shapes.push({ kind: "terminal", x: leftTerminalX, y: lineY, label: leftLabel });

  // Right terminal + lead.
  const networkRightX = originX + network.width;
  const rightTerminalX = networkRightX + TERMINAL_LEAD;
  shapes.push({ kind: "wire", x1: networkRightX, y1: lineY, x2: rightTerminalX, y2: lineY });
  shapes.push({ kind: "terminal", x: rightTerminalX, y: lineY, label: rightLabel });

  return {
    width: rightTerminalX + PADDING,
    height: network.height + 2 * PADDING + TERMINAL_LABEL_HEIGHT,
    shapes,
  };
}
