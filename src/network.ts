// ----- Types -----

type Node =
  | { kind: "leaf"; value: number; description: string; signature: string }
  | {
    kind: "series" | "parallel";
    value: number;
    left: Node;
    right: Node;
    description: string;
    signature: string;
  };

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

export interface SearchResult {
  found: boolean;     // true if within tolerance of target
  node: Node;
  count: number;      // resistors used
  value: number;      // achieved resistance
  error: number;      // |value - target|
  description: string;
}

export interface NetworkResult {
  node: Node;
  count: number;
  value: number;
  absError: number;
  deviationPct: number;
  description: string;
}

// ----- Helpers -----

// Logarithmic bucketing => relative dedup across orders of magnitude.
function bucketKey(value: number, relPrecision: number): number {
  return Math.round(Math.log(value) / relPrecision);
}

function formatChild(node: Node, parentKind: "series" | "parallel"): string {
  if (node.kind === "leaf" || node.kind === parentKind) {
    return node.description;
  }

  return `(${node.description})`;
}

function makeLeaf(value: number): Node {
  return {
    kind: "leaf",
    value,
    description: `${value}Ω`,
    signature: `leaf:${value}`,
  };
}

function makeComposite(kind: "series" | "parallel", left: Node, right: Node, value: number): Node {
  const [first, second] = left.signature <= right.signature ? [left, right] : [right, left];
  const op = kind === "series" ? " + " : " ∥ ";

  return {
    kind,
    value,
    left: first,
    right: second,
    description: `${formatChild(first, kind)}${op}${formatChild(second, kind)}`,
    signature: `${kind}:${first.signature}|${second.signature}`,
  };
}

function toNetworkResult(node: Node, target: number, count: number): NetworkResult {
  const absError = Math.abs(node.value - target);
  return {
    node,
    count,
    value: node.value,
    absError,
    deviationPct: ((node.value - target) / target) * 100,
    description: node.description,
  };
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
        description: node.description
      };
    }
    if (matches(node.value) &&
      (!best || count < best.count ||
        (count === best.count && error < best.error))) {
      best = {
        found: true, node, count, value: node.value, error,
        description: node.description
      };
    }
  };

  // Layer 1: the raw resistor values.
  for (const v of distinct.values()) {
    const key = bucketKey(v, dedupPrec);
    if (!known.has(key)) {
      known.add(key);
      const node = makeLeaf(v);
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
    const node = makeComposite(kind, a, b, value);
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

const EXPANSION_BUCKET_PRECISION = 0.02;
const MAX_LAYER_EXPANSION_NODES = 256;
const MAX_BUCKET_EXPANSION_REPRESENTATIVES = 4;

function pruneExpansionLayer(nodes: Node[], target: number): Node[] {
  const kept: Node[] = [];
  const bucketCounts = new Map<number, number>();

  const sorted = [...nodes].sort((left, right) => {
    const leftError = Math.abs(left.value - target);
    const rightError = Math.abs(right.value - target);
    return leftError - rightError || left.value - right.value || left.signature.localeCompare(right.signature);
  });

  for (const node of sorted) {
    const key = bucketKey(node.value, EXPANSION_BUCKET_PRECISION);
    const bucketCount = bucketCounts.get(key) ?? 0;
    if (bucketCount >= MAX_BUCKET_EXPANSION_REPRESENTATIVES) continue;

    bucketCounts.set(key, bucketCount + 1);
    kept.push(node);

    if (kept.length >= MAX_LAYER_EXPANSION_NODES) {
      break;
    }
  }

  return kept;
}

export function findAllResistorNetworks(
  resistors: number[],
  target: number,
  opts: Options = {}
): NetworkResult[] {
  if (resistors.length === 0 || target <= 0) return [];

  const relTol = opts.relTolerance ?? 0.05;
  const absTol = opts.absTolerance ?? 0;
  const maxK = opts.maxResistors ?? 5;
  const dedupPrec = opts.dedupPrecision ?? 1e-6;
  const tol = Math.max(absTol, relTol * target);
  const matches = (value: number) => Math.abs(value - target) <= tol;

  const distinct = new Map<number, number>();
  for (const resistor of resistors) {
    if (resistor > 0) {
      distinct.set(bucketKey(resistor, dedupPrec), resistor);
    }
  }

  const layers: Node[][] = Array.from({ length: maxK + 1 }, () => []);
  const seenResults = new Set<string>();
  const results: NetworkResult[] = [];

  const collectResult = (node: Node, count: number) => {
    if (!matches(node.value) || seenResults.has(node.description)) return;
    seenResults.add(node.description);
    results.push(toNetworkResult(node, target, count));
  };

  for (const value of distinct.values()) {
    const node = makeLeaf(value);
    collectResult(node, 1);
    layers[1].push(node);
  }

  const registerComposite = (
    value: number,
    kind: "series" | "parallel",
    left: Node,
    right: Node,
    count: number
  ) => {
    const node = makeComposite(kind, left, right, value);
    collectResult(node, count);
    layers[count].push(node);
  };

  const combine = (left: Node, right: Node, count: number) => {
    const seriesValue = left.value + right.value;
    registerComposite(seriesValue, "series", left, right, count);

    const parallelValue = (left.value * right.value) / seriesValue;
    registerComposite(parallelValue, "parallel", left, right, count);
  };

  for (let count = 2; count <= maxK; count++) {
    const nextLayer: Node[] = [];
    layers[count] = nextLayer;

    const registerCompositeForLayer = (
      value: number,
      kind: "series" | "parallel",
      left: Node,
      right: Node
    ) => {
      const node = makeComposite(kind, left, right, value);
      collectResult(node, count);
      nextLayer.push(node);
    };

    const combineForLayer = (left: Node, right: Node) => {
      const seriesValue = left.value + right.value;
      registerCompositeForLayer(seriesValue, "series", left, right);

      const parallelValue = (left.value * right.value) / seriesValue;
      registerCompositeForLayer(parallelValue, "parallel", left, right);
    };

    for (let leftCount = 1; leftCount <= count - leftCount; leftCount++) {
      const rightCount = count - leftCount;
      const leftLayer = layers[leftCount];
      const rightLayer = layers[rightCount];

      if (leftCount < rightCount) {
        for (const left of leftLayer) {
          for (const right of rightLayer) {
            combineForLayer(left, right);
          }
        }
        continue;
      }

      for (let leftIndex = 0; leftIndex < leftLayer.length; leftIndex++) {
        for (let rightIndex = leftIndex; rightIndex < leftLayer.length; rightIndex++) {
          combineForLayer(leftLayer[leftIndex], leftLayer[rightIndex]);
        }
      }
    }

    layers[count] = pruneExpansionLayer(nextLayer, target);
  }

  return results;
}