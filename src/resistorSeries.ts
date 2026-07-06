import { formatValue } from "./resistorValueTokens.js";

export type SeriesName = "E3" | "E6" | "E12" | "E24";

export const MIN_VALUE = 1;
export const MAX_VALUE = 100_000_000;
const MAX_DECADE_EXPONENT = 8; // 10^8 keeps values within [1, 1e8]

export const SERIES_BASE_VALUES: Record<SeriesName, number[]> = {
  E3: [1.0, 2.2, 4.7],
  E6: [1.0, 1.5, 2.2, 3.3, 4.7, 6.8],
  E12: [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2],
  E24: [
    1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9,
    4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
  ],
};

/**
 * Generates all decade values for a series (base * 10^n, n=0..8), clamped to
 * [MIN_VALUE, MAX_VALUE], sorted ascending and deduplicated.
 */
export function generateSeriesValues(series: SeriesName): number[] {
  const bases = SERIES_BASE_VALUES[series];
  const seen = new Set<number>();
  const values: number[] = [];

  for (let n = 0; n <= MAX_DECADE_EXPONENT; n++) {
    const multiplier = 10 ** n;
    for (const base of bases) {
      const value = Math.round((base * multiplier) * 1e6) / 1e6;
      if (value < MIN_VALUE || value > MAX_VALUE) continue;
      if (seen.has(value)) continue;
      seen.add(value);
      values.push(value);
    }
  }

  return values.sort((a, b) => a - b);
}

/**
 * Formats a series as decade rows (one row per power-of-ten decade),
 * using suffix tokens, matching the story's textarea presentation.
 */
export function formatSeriesAsRows(series: SeriesName): string {
  const bases = SERIES_BASE_VALUES[series];
  const rows: string[] = [];

  for (let n = 0; n <= MAX_DECADE_EXPONENT; n++) {
    const multiplier = 10 ** n;
    const rowValues = bases
      .map((base) => Math.round((base * multiplier) * 1e6) / 1e6)
      .filter((value) => value >= MIN_VALUE && value <= MAX_VALUE);

    if (rowValues.length === 0) continue;
    rows.push(rowValues.map(formatValue).join(", "));
  }

  return rows.join("\n");
}
