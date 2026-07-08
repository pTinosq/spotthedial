import type { Price } from "./types";

/** Format a whole-unit amount as currency with no decimals (e.g. "$12,500"). */
export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "$12,000 – $45,000", or a single figure when low === high. */
export function formatPriceRange(price: Price): string {
  const currency = price.currency ?? "USD";
  if (price.low === price.high) return formatMoney(price.low, currency);
  return `${formatMoney(price.low, currency)} – ${formatMoney(price.high, currency)}`;
}

/** "~$15,000" — approximate average, prefixed with a tilde. */
export function formatPriceAverage(price: Price): string {
  return `~${formatMoney(price.average, price.currency ?? "USD")}`;
}
