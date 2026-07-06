const TOKEN_PATTERN = /^(\d+(?:\.\d+)?)\s*([kKmM])?$/;

const SUFFIX_MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  K: 1_000,
  m: 1_000_000,
  M: 1_000_000,
};

/**
 * Parses a single resistor value token, e.g. "4.7k", "1 M", "100".
 * Suffixes are case-insensitive: k/K = kilo (x1000), m/M = mega (x1000000).
 * Returns null if the token is not a valid positive number (with optional suffix).
 */
export function parseToken(token: string): number | null {
  const trimmed = token.trim();
  const match = TOKEN_PATTERN.exec(trimmed);
  if (!match) return null;

  const [, numberPart, suffix] = match;
  const base = Number(numberPart);
  if (!Number.isFinite(base) || base <= 0) return null;

  const multiplier = suffix ? SUFFIX_MULTIPLIERS[suffix] : 1;
  return base * multiplier;
}

/** Strips floating-point artifacts, e.g. 1.0 -> "1", 4.7 -> "4.7". */
function trimNumber(value: number): string {
  return parseFloat(value.toFixed(10)).toString();
}

/** Formats a resistance value using the shortest suffix token, e.g. 4700 -> "4.7k". */
export function formatValue(value: number): string {
  if (value >= 1_000_000) return `${trimNumber(value / 1_000_000)}M`;
  if (value >= 1_000) return `${trimNumber(value / 1_000)}k`;
  return trimNumber(value);
}

export interface ParsedResistorValues {
  values: number[];
  invalidTokens: string[];
}

/**
 * Parses comma/newline separated resistor values, supporting k/M suffixes.
 * Blank entries are ignored. Tokens that fail to parse are collected in invalidTokens.
 */
export function parseResistorValues(input: string): ParsedResistorValues {
  const tokens = input
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const values: number[] = [];
  const invalidTokens: string[] = [];

  for (const token of tokens) {
    const value = parseToken(token);
    if (value === null) {
      invalidTokens.push(token);
    } else {
      values.push(value);
    }
  }

  return { values, invalidTokens };
}
