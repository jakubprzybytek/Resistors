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
  /** Which side the label text should be anchored relative to the dot. */
  side: "start" | "end";
}

export type SchematicShape = ResistorShape | WireShape | TerminalShape;

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
const TERMINAL_LEAD = 24;
export const TERMINAL_RADIUS = 4;
const PADDING = 12;

interface Measured {
  width: number;
  height: number;
  /** Vertical offset of the horizontal through-wire from the top of the box. */
  centerY: number;
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

  const left = measure(node.left);
  const right = measure(node.right);

  if (node.kind === "series") {
    const centerY = Math.max(left.centerY, right.centerY);
    const bottom = Math.max(
      centerY - left.centerY + left.height,
      centerY - right.centerY + right.height
    );
    return {
      width: left.width + SERIES_GAP + right.width,
      height: bottom,
      centerY,
    };
  }

  // parallel: stack branches vertically between two shared rails.
  const branchWidth = Math.max(left.width, right.width);
  const height = left.height + PARALLEL_GAP + right.height;
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
    const left = measure(node.left);
    const right = measure(node.right);
    const lineY = y + box.centerY;

    place(node.left, x, lineY - left.centerY, shapes);
    const rightX = x + left.width + SERIES_GAP;
    place(node.right, rightX, lineY - right.centerY, shapes);

    // Connecting wire between the two children.
    shapes.push({
      kind: "wire",
      x1: x + left.width,
      y1: lineY,
      x2: rightX,
      y2: lineY,
    });
    return box;
  }

  // parallel
  const left = measure(node.left);
  const right = measure(node.right);
  const branchWidth = box.width - 2 * JUNCTION_LEAD;
  const leftRailX = x + JUNCTION_LEAD;
  const rightRailX = x + box.width - JUNCTION_LEAD;
  const centerLineY = y + box.centerY;

  const branches: { child: Node; measured: Measured; topY: number }[] = [
    { child: node.left, measured: left, topY: y },
    { child: node.right, measured: right, topY: y + left.height + PARALLEL_GAP },
  ];

  const lineYs: number[] = [];
  for (const branch of branches) {
    const childX = leftRailX + (branchWidth - branch.measured.width) / 2;
    const lineY = branch.topY + branch.measured.centerY;
    lineYs.push(lineY);

    place(branch.child, childX, branch.topY, shapes);

    // Horizontal stubs from the rails to the branch element.
    shapes.push({ kind: "wire", x1: leftRailX, y1: lineY, x2: childX, y2: lineY });
    shapes.push({
      kind: "wire",
      x1: childX + branch.measured.width,
      y1: lineY,
      x2: rightRailX,
      y2: lineY,
    });
  }

  const topLineY = Math.min(...lineYs);
  const bottomLineY = Math.max(...lineYs);

  // Vertical rails joining the branches.
  shapes.push({ kind: "wire", x1: leftRailX, y1: topLineY, x2: leftRailX, y2: bottomLineY });
  shapes.push({ kind: "wire", x1: rightRailX, y1: topLineY, x2: rightRailX, y2: bottomLineY });

  // Entry/exit leads into the rails, aligned to the node centre line.
  shapes.push({ kind: "wire", x1: x, y1: centerLineY, x2: leftRailX, y2: centerLineY });
  shapes.push({ kind: "wire", x1: rightRailX, y1: centerLineY, x2: x + box.width, y2: centerLineY });

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
  const originY = PADDING;
  const lineY = originY + network.centerY;

  place(node, originX, originY, shapes);

  // Left terminal + lead.
  const leftTerminalX = PADDING;
  shapes.push({ kind: "wire", x1: leftTerminalX, y1: lineY, x2: originX, y2: lineY });
  shapes.push({ kind: "terminal", x: leftTerminalX, y: lineY, label: leftLabel, side: "end" });

  // Right terminal + lead.
  const networkRightX = originX + network.width;
  const rightTerminalX = networkRightX + TERMINAL_LEAD;
  shapes.push({ kind: "wire", x1: networkRightX, y1: lineY, x2: rightTerminalX, y2: lineY });
  shapes.push({ kind: "terminal", x: rightTerminalX, y: lineY, label: rightLabel, side: "start" });

  return {
    width: rightTerminalX + PADDING,
    height: network.height + 2 * PADDING,
    shapes,
  };
}
