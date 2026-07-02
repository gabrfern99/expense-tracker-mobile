// Money + date-only helpers. Dates are handled as local `YYYY-MM-DD` strings to
// avoid timezone off-by-one bugs (plan.md §6).

// Brazilian Real, pt-BR style: R$ 1.234,56
export function formatMoney(amount: string | number): string {
  const raw = typeof amount === 'string' ? Number(amount) : amount;
  const n = Number.isFinite(raw) ? raw : 0;
  const neg = n < 0;
  const [intPart, dec] = Math.abs(n).toFixed(2).split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${neg ? '-' : ''}R$ ${withThousands},${dec}`;
}

/**
 * Validate/normalize a user-typed amount to a positive 2-dp string, or null.
 * Accepts comma or dot as the decimal separator and ignores "R$"/spaces.
 */
export function normalizeAmountInput(raw: string): string | null {
  const cleaned = raw.trim().replace(/[R$\s]/g, '').replace(',', '.');
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

/** Convert a stored amount ("12.50") to pt-BR input text ("12,50"). */
export function toAmountInput(stored: string): string {
  return stored.replace('.', ',');
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
