import { SIZE_CHART, SIZES, type Size } from "./constants";

const HEIGHTS = [162, 167, 172, 177, Infinity];

/** Size recommendation from the shop's chart: weight decides, height can nudge one size up. */
export function recommendSize(weightKg: number, heightCm?: number | null) {
  const byWeight = SIZE_CHART.find((r) => weightKg <= r.maxWeight)?.size ?? "XL";
  let alternative: Size | null = null;
  if (heightCm && heightCm > 0) {
    const idx = HEIGHTS.findIndex((h) => heightCm <= h);
    const byHeight = SIZES[idx === -1 ? SIZES.length - 1 : idx];
    if (SIZES.indexOf(byHeight) > SIZES.indexOf(byWeight)) {
      alternative = SIZES[SIZES.indexOf(byWeight) + 1];
    }
  }
  return { size: byWeight as Size, alternative };
}
