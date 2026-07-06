import { describe, it, expect } from "vitest";
import {
  generateSeriesValues,
  formatSeriesAsRows,
  SERIES_BASE_VALUES,
  MIN_VALUE,
  MAX_VALUE,
  type SeriesName,
} from "../resistorSeries.js";

const SERIES: SeriesName[] = ["E3", "E6", "E12", "E24"];

describe("generateSeriesValues", () => {
  it("uses the exact hardcoded base values for each series", () => {
    expect(SERIES_BASE_VALUES.E3).toEqual([1.0, 2.2, 4.7]);
    expect(SERIES_BASE_VALUES.E6).toEqual([1.0, 1.5, 2.2, 3.3, 4.7, 6.8]);
  });

  it.each([
    ["E3", 25],
    ["E6", 49],
    ["E12", 97],
    ["E24", 193],
  ] as const)("generates the expected count of values for %s", (series, expectedCount) => {
    expect(generateSeriesValues(series)).toHaveLength(expectedCount);
  });

  it.each(SERIES)("stays within [%s min, max] range for %s", (series) => {
    const values = generateSeriesValues(series);
    expect(Math.min(...values)).toBe(MIN_VALUE);
    expect(Math.max(...values)).toBe(MAX_VALUE);
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(MIN_VALUE);
      expect(value).toBeLessThanOrEqual(MAX_VALUE);
    }
  });

  it.each(SERIES)("is sorted ascending for %s", (series) => {
    const values = generateSeriesValues(series);
    const sorted = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sorted);
  });

  it.each(SERIES)("has no duplicate values for %s", (series) => {
    const values = generateSeriesValues(series);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("formatSeriesAsRows", () => {
  it("formats E3 as decade rows with suffix tokens", () => {
    const rows = formatSeriesAsRows("E3").split("\n");
    expect(rows[0]).toBe("1, 2.2, 4.7");
    expect(rows[1]).toBe("10, 22, 47");
    expect(rows[2]).toBe("100, 220, 470");
    expect(rows[3]).toBe("1k, 2.2k, 4.7k");
    expect(rows[rows.length - 1]).toBe("100M");
  });

  it("produces one row per decade (9 rows for n=0..8)", () => {
    expect(formatSeriesAsRows("E3").split("\n")).toHaveLength(9);
  });
});
