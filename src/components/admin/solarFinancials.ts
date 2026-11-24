/** Solar financial calculation — independent of the kWp capacity logic. */

export const BILL_COUNT = 6;
/** Initial value only for a new calculation — never used inside the formulas. */
export const DEFAULT_FIXED_CHARGES = 1000;

/** Saved value if present (including 0); older records without the field get the default. */
export const initialFixedCharges = (saved?: number | string | null): string =>
  saved === undefined || saved === null || saved === '' ? String(DEFAULT_FIXED_CHARGES) : String(saved);

export const EMPTY_BILLS: string[] = Array(BILL_COUNT).fill('');

export interface FinancialInputs {
  bills: string[];
  fixedCharges: string;
  installationCost: string;
}

export interface FinancialResult {
  annualBill: number;
  monthlyAverage: number;
  monthlySavings: number;
  annualSavings: number;
  /** Decimal years, or null when not applicable (no cost, or savings <= 0). */
  paybackYears: number | null;
  /** Whole-month payback, or null when not applicable. */
  paybackMonths: number | null;
}

/** Keep digits and a single decimal point only — blocks negatives, letters and symbols. */
export const sanitizeMoney = (v: string): string => {
  const cleaned = v.replace(/,/g, '').replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('')}` : whole;
};

/** Empty / invalid / negative → 0. */
export const moneyValue = (v: string): number => {
  const n = parseFloat(sanitizeMoney(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function calculateFinancials(i: FinancialInputs): FinancialResult {
  const annualBill = i.bills.reduce((sum, b) => sum + moneyValue(b), 0);
  const monthlyAverage = annualBill / 12;
  const monthlySavings = monthlyAverage - moneyValue(i.fixedCharges);
  const annualSavings = monthlySavings * 12;
  const cost = moneyValue(i.installationCost);

  let paybackYears: number | null = null;
  let paybackMonths: number | null = null;
  if (cost > 0 && annualSavings > 0) {
    paybackYears = cost / annualSavings;
    paybackMonths = Math.round(paybackYears * 12);
    if (!Number.isFinite(paybackYears)) { paybackYears = null; paybackMonths = null; }
  }
  return { annualBill, monthlyAverage, monthlySavings, annualSavings, paybackYears, paybackMonths };
}

/** Indian digit grouping, e.g. ₹1,60,000 — up to 2 decimals only when needed. */
export const formatRupees = (n: number): string => {
  const abs = Math.abs(n);
  const dp = Number.isInteger(Math.round(abs * 100) / 100) ? 0 : 2;
  return `${n < 0 ? '-' : ''}₹${abs.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: 2 })}`;
};

export function formatPayback(months: number | null): string {
  if (months === null) return 'Not Applicable';
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y > 0) parts.push(`${y} Year${y === 1 ? '' : 's'}`);
  if (m > 0 || y === 0) parts.push(`${m} Month${m === 1 ? '' : 's'}`);
  return parts.join(' ');
}
