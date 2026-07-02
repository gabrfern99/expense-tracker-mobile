// Per-category monthly budgets (local SQLite). A budget is a recurring monthly
// limit; "spent" is computed against the selected month's expenses.
import { getDb } from '@/db/database';
import { BudgetStatus } from '@/types';

const centsToStr = (c: number): string => (c / 100).toFixed(2);
const strToCents = (s: string): number => Math.round(parseFloat(s) * 100);

function monthRange(year: number, month: number): [string, string] {
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${year}-${pad(month)}-01`;
  const ny = month === 12 ? year + 1 : year;
  const nm = month === 12 ? 1 : month + 1;
  return [start, `${ny}-${pad(nm)}-01`];
}

export async function setBudget(categoryId: number, limit: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO budgets (category_id, limit_cents) VALUES (?, ?)
     ON CONFLICT(category_id) DO UPDATE SET limit_cents = excluded.limit_cents`,
    categoryId,
    strToCents(limit),
  );
}

export async function deleteBudget(categoryId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM budgets WHERE category_id = ?', categoryId);
}

export async function getBudgetLimit(categoryId: number): Promise<string | null> {
  const db = await getDb();
  const r = await db.getFirstAsync<{ limit_cents: number }>(
    'SELECT limit_cents FROM budgets WHERE category_id = ?',
    categoryId,
  );
  return r ? centsToStr(r.limit_cents) : null;
}

/** Budget status for every budgeted category, for the given month. */
export async function getBudgetStatuses(year: number, month: number): Promise<BudgetStatus[]> {
  const db = await getDb();
  const [start, end] = monthRange(year, month);
  const rows = await db.getAllAsync<{
    category_id: number;
    category: string;
    color: string;
    limit_cents: number;
    spent_cents: number;
  }>(
    `SELECT c.id AS category_id, c.name AS category, c.color AS color,
            b.limit_cents AS limit_cents,
            COALESCE(SUM(CASE WHEN e.date >= ? AND e.date < ? THEN e.amount_cents END), 0) AS spent_cents
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       LEFT JOIN expenses e ON e.category_id = b.category_id
      GROUP BY c.id, c.name, c.color, b.limit_cents
      ORDER BY c.name`,
    start,
    end,
  );

  return rows.map((r) => ({
    category_id: r.category_id,
    category: r.category,
    color: r.color,
    limit: centsToStr(r.limit_cents),
    spent: centsToStr(r.spent_cents),
    pct: r.limit_cents > 0 ? Math.round((r.spent_cents / r.limit_cents) * 100) : 0,
    over: r.spent_cents > r.limit_cents,
  }));
}

/** Status for one category (used for the post-save alert). Null if no budget. */
export async function getCategoryBudgetStatus(
  year: number,
  month: number,
  categoryId: number,
): Promise<BudgetStatus | null> {
  const all = await getBudgetStatuses(year, month);
  return all.find((s) => s.category_id === categoryId) ?? null;
}
