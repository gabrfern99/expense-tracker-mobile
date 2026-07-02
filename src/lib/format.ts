// Money + date-only helpers. Dates are handled as local `YYYY-MM-DD` strings to
// avoid timezone off-by-one bugs (plan.md §6).

export function formatMoney(amount: string | number): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return (Number.isFinite(n) ? n : 0).toFixed(2);
}

/** Validate/normalize a user-typed amount to a positive 2-dp string, or null. */
export function normalizeAmountInput(raw: string): string | null {
  const n = Number(raw.trim().replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse `YYYY-MM-DD` to a local-midnight Date (no UTC shift). */
export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function formatDateDisplay(s: string): string {
  return fromISODate(s).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function currentPeriod(): { year: number; month: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
