export interface PriceHikeResult {
  isHike: boolean;
  previousAmountMinor: number | null;
  deltaMinor: number;
  percentChange: number | null;
}

/**
 * Compares a newly billed amount against the most recent historical charge
 * in the same currency to detect silent subscription/insurance price hikes.
 */
export function detectPriceHike(
  newAmountMinor: number | null,
  newCurrency: string | null,
  previousCharges: Array<{ amount_minor: number; currency: string; billed_on: string }>
): PriceHikeResult {
  if (newAmountMinor === null || !newCurrency || previousCharges.length === 0) {
    return {
      isHike: false,
      previousAmountMinor: null,
      deltaMinor: 0,
      percentChange: null,
    };
  }

  const sameCurrency = previousCharges
    .filter((c) => c.currency.toUpperCase() === newCurrency.toUpperCase())
    .sort((a, b) => b.billed_on.localeCompare(a.billed_on));

  const latest = sameCurrency[0];
  if (!latest || latest.amount_minor <= 0) {
    return {
      isHike: false,
      previousAmountMinor: latest?.amount_minor ?? null,
      deltaMinor: 0,
      percentChange: null,
    };
  }

  const deltaMinor = newAmountMinor - latest.amount_minor;
  const percentChange = Math.round((deltaMinor / latest.amount_minor) * 1000) / 10;

  return {
    isHike: deltaMinor > 0,
    previousAmountMinor: latest.amount_minor,
    deltaMinor,
    percentChange,
  };
}
