import { describe, it, expect } from "vitest";
import { parseToken, formatValue, parseResistorValues } from "../resistorValueTokens.js";

describe("parseToken", () => {
  it("parses plain integers", () => {
    expect(parseToken("100")).toBe(100);
  });

  it("parses plain decimals", () => {
    expect(parseToken("4.7")).toBe(4.7);
  });

  it("parses lowercase k suffix", () => {
    expect(parseToken("4.7k")).toBe(4700);
  });

  it("parses uppercase K suffix", () => {
    expect(parseToken("4.7K")).toBe(4700);
  });

  it("parses uppercase M suffix", () => {
    expect(parseToken("2.2M")).toBe(2_200_000);
  });

  it("parses lowercase m suffix as mega (case-insensitive)", () => {
    expect(parseToken("2.2m")).toBe(2_200_000);
  });

  it("supports a space between value and suffix", () => {
    expect(parseToken("1 k")).toBe(1000);
  });

  it("supports no space between value and suffix", () => {
    expect(parseToken("1k")).toBe(1000);
  });

  it("trims surrounding whitespace", () => {
    expect(parseToken("  100  ")).toBe(100);
  });

  it("returns null for non-numeric text", () => {
    expect(parseToken("abc")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseToken("")).toBeNull();
  });

  it("returns null for zero", () => {
    expect(parseToken("0")).toBeNull();
  });

  it("returns null for negative numbers", () => {
    expect(parseToken("-100")).toBeNull();
  });

  it("returns null for multiple suffixes", () => {
    expect(parseToken("1kk")).toBeNull();
  });

  it("returns null for an invalid suffix letter", () => {
    expect(parseToken("100x")).toBeNull();
  });
});

describe("formatValue", () => {
  it("formats sub-1000 values without suffix", () => {
    expect(formatValue(1)).toBe("1");
    expect(formatValue(2.2)).toBe("2.2");
    expect(formatValue(100)).toBe("100");
  });

  it("formats thousands with k suffix", () => {
    expect(formatValue(1000)).toBe("1k");
    expect(formatValue(4700)).toBe("4.7k");
  });

  it("formats millions with M suffix", () => {
    expect(formatValue(1_000_000)).toBe("1M");
    expect(formatValue(100_000_000)).toBe("100M");
  });

  it("round-trips through parseToken", () => {
    for (const value of [1, 2.2, 100, 1000, 4700, 1_000_000, 100_000_000]) {
      expect(parseToken(formatValue(value))).toBe(value);
    }
  });
});

describe("parseResistorValues", () => {
  it("parses comma-separated values", () => {
    expect(parseResistorValues("100, 220, 330")).toEqual({
      values: [100, 220, 330],
      invalidTokens: [],
    });
  });

  it("parses newline-separated values", () => {
    expect(parseResistorValues("100\n220\n330")).toEqual({
      values: [100, 220, 330],
      invalidTokens: [],
    });
  });

  it("parses mixed comma and newline separators", () => {
    expect(parseResistorValues("100, 220\n330")).toEqual({
      values: [100, 220, 330],
      invalidTokens: [],
    });
  });

  it("ignores blank entries", () => {
    expect(parseResistorValues("100,,220\n\n330")).toEqual({
      values: [100, 220, 330],
      invalidTokens: [],
    });
  });

  it("parses values with suffixes mixed with plain values", () => {
    expect(parseResistorValues("100, 4.7k, 2.2M")).toEqual({
      values: [100, 4700, 2_200_000],
      invalidTokens: [],
    });
  });

  it("collects invalid tokens separately from valid values", () => {
    expect(parseResistorValues("100, abc, 220")).toEqual({
      values: [100, 220],
      invalidTokens: ["abc"],
    });
  });
});
