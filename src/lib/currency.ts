const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SAR: '﷼',
  EGP: 'E£',
  TRY: '₺',
  INR: '₹',
  JPY: '¥',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: 'BD',
  OMR: 'ر.ع',
  CAD: 'C$',
  AUD: 'A$',
};

export function getCurrencySymbol(currency: string = 'USD'): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

export function formatPrice(price: number, currency: string = 'USD'): string {
  const symbol = getCurrencySymbol(currency);
  const noDecimals = ['JPY', 'KWD'];
  const formatted = noDecimals.includes(currency)
    ? Math.round(price).toString()
    : price.toFixed(2);
  return `${symbol}${formatted}`;
}
