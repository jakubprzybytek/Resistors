// ----- Types -----

type Node =
  | { kind: "leaf"; value: number }
  | { kind: "series" | "parallel"; value: number; left: Node; right: Node };

interface Options {
  /** relative tolerance for accepting a match, e.g. 0.01 = 1% */
  relTolerance?: number;
  /** absolute tolerance (Ω); effective tol = max(absTolerance, relTolerance*target) */
  absTolerance?: number;
  /** cap on number of resistors (required since supply is unlimited; default 5) */
  maxResistors?: number;
  /** relative precision for deduplicating near-equal resistances (default 1e-6) */
  dedupPrecision?: number;
}

interface SearchResult {
  found: boolean;     // true if within tolerance of target
  node: Node;
  count: number;      // resistors used
  value: number;      // achieved resistance
  error: number;      // |value - target|
  description: string;
}

// ----- Helpers -----

// Logarithmic bucketing => relative dedup across orders of magnitude.
function bucketKey(value: number, relPrecision: number): number {
  return Math.round(Math.log(value) / relPrecision);
}

function describe(node: Node): string {
  if (node.kind === "leaf") return `${node.value}Ω`;
  const op = node.kind === "series" ? " + " : " ∥ ";
  return `(${describe(node.left)}${op}${describe(node.right)})`;
}

// ----- Main -----

export function findResistorNetworkUnlimited(
  resistors: number[],
  target: number,
  opts: Options = {}
): SearchResult | null {
  if (resistors.length === 0 || target <= 0) return null;

  const relTol = opts.relTolerance ?? 0.01;
  const absTol = opts.absTolerance ?? 0;
  const maxK = opts.maxResistors ?? 5;
  const dedupPrec = opts.dedupPrecision ?? 1e-6;

  const tol = Math.max(absTol, relTol * target);
  const matches = (v: number) => Math.abs(v - target) <= tol;

  // Distinct input values (unlimited copies of each).
  const distinct = new Map<number, number>();
  for (const r of resistors) if (r > 0) distinct.set(bucketKey(r, dedupPrec), r);

  // known: every value we've already reached (at its minimal count).
  const known = new Set<number>();
  // layers[k]: nodes whose MINIMAL resistor count is exactly k.
  const layers: Node[][] = Array.from({ length: maxK + 1 }, () => []);

  let best: SearchResult | null = null;     // within tolerance, fewest resistors
  let closest: SearchResult | null = null;  // best effort if nothing matches

  const consider = (node: Node, count: number) => {
    const error = Math.abs(node.value - target);
    if (!closest || error < closest.error ||
      (error === closest.error && count < closest.count)) {
      closest = {
        found: false, node, count, value: node.value, error,
        description: describe(node)
      };
    }
    if (matches(node.value) &&
      (!best || count < best.count ||
        (count === best.count && error < best.error))) {
      best = {
        found: true, node, count, value: node.value, error,
        description: describe(node)
      };
    }
  };

  // Layer 1: the raw resistor values.
  for (const v of distinct.values()) {
    const key = bucketKey(v, dedupPrec);
    if (!known.has(key)) {
      known.add(key);
      const node: Node = { kind: "leaf", value: v };
      layers[1].push(node);
      consider(node, 1);
    }
  }
  if (best) return best;   // a single resistor already matches

  const tryAdd = (value: number, kind: "series" | "parallel",
    a: Node, b: Node, k: number) => {
    const key = bucketKey(value, dedupPrec);
    if (known.has(key)) return;          // already reachable with <= k resistors
    known.add(key);
    const node: Node = { kind, value, left: a, right: b };
    layers[k].push(node);
    consider(node, k);
  };

  const combine = (a: Node, b: Node, k: number) => {
    const s = a.value + b.value;
    tryAdd(s, "series", a, b, k);
    tryAdd((a.value * b.value) / s, "parallel", a, b, k);
  };

  // Grow by count. k = i + j; we enumerate unordered size-pairs (i <= j).
  for (let k = 2; k <= maxK; k++) {
    for (let i = 1; i <= k - i; i++) {
      const j = k - i;
      const A = layers[i], B = layers[j];
      if (i < j) {
        for (const a of A) for (const b of B) combine(a, b, k);
      } else {
        // i === j: unordered pairs, including self-pairs (same value twice is allowed).
        for (let x = 0; x < A.length; x++)
          for (let y = x; y < A.length; y++) combine(A[x], A[y], k);
      }
    }
    if (best) return best;   // first count k with a match is guaranteed minimal
  }

  return best ?? closest;
}