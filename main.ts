import { findResistorNetworkUnlimited } from "./src/network.js";

const set = [
  1,
  4.7,
  10,
  22,
  30,
  49.9,
  68,
  100,
  180,
  200,
  220,
  680,
  1100, // 1k1
  1500, // 1k5
  2000, // 2k
  2200, // 2k2
  2400, // 2k4
  3300, // 3k3
  3900, // 3k9
  4700, // 4k7
  4870, // 4k87
  7680, // 7k68
  10000, // 10k
  11000, // 11k
  15400, // 15k4
  20000, // 20k
  22000, // 22k
  30000, // 30k
  47000, // 47k
  68000, // 68k
  73200, // 73k2
  100000, // 100k
  120000, // 120k
  220000, // 220k
  300000, // 300k
  1000000 // 1M
];

const target = parseFloat((globalThis as any).process?.argv?.[2] || "660");

const result = findResistorNetworkUnlimited(set, target, { relTolerance: 0.01 });

if (result) {
    console.log(result.found ? "Exact (within tolerance):" : "Closest possible:");
    const deviation = ((result.value - target) / target) * 100;
    const deviationStr = (deviation >= 0 ? "+" : "") + deviation.toFixed(2) + "%";
    console.log(`Target ${target}Ω -> ${result.value.toFixed(2)}Ω, ${result.count} resistors (deviation: ${deviationStr})`);
    console.log(result.description);
}
