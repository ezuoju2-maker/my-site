import { CHANNELS, applyMarkup, channelStock } from "./sms-channels";

export function getPriceRange(basePrice: number): { min: number; max: number } {
  const enabled = CHANNELS.filter((c) => c.enabled);
  if (enabled.length === 0) return { min: basePrice, max: basePrice };
  const prices = enabled.map((c) => applyMarkup(basePrice, c));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function getTotalStock(
  serviceSlug: string,
  countryCode: string,
  baseStock: number,
): number {
  const enabled = CHANNELS.filter((c) => c.enabled);
  if (enabled.length === 0) return baseStock;
  return enabled.reduce(
    (sum, c) => sum + channelStock(serviceSlug, countryCode, c.id, baseStock),
    0,
  );
}
