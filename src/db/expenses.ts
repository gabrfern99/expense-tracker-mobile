// Expense data access (local SQLite). Money stored as integer cents; exposed to
// the UI as fixed 2-dp strings so the rest of the app is unchanged.
import { getDb } from '@/db/database';
import { Expense, ExpenseSummary } from '@/types';

export interface ExpenseInput {
  amount: string; // "12.50"
  category_id: number;
  description: string | null;
  date: string; // YYYY-MM-DD
}

interface ExpRow {
  id: number;
  category_id: number;
  amount_cents: number;
  description: string | null;
  date: string;
  created_at: string;
}

const centsToStr = (cents: number): string => (cents / 100).toFixed(2);
const strToCents = (s: string): number => Math.round(parseFloat(s) * 100);

function toExpense(r: ExpRow): Expense {
  return {
    id: r.id,
    user_id: 1,
    category_id: r.category_id,
    amount: centsToStr(r.amount_cents),
    description: r.description,
    date: r.date,
    created_at: r.created_at,
  };
}

// [start, end) date strings for the given month.
function monthRange(year: number, month: number): [string, string] {
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${year}-${pad(month)}-01`;
  const ny = month === 12 ? year + 1 : year;
  const nm = month === 12 ? 1 : month + 1;
  const end = `${ny}-${pad(nm)}-01`;
  return [start, end];
}

export async function listExpenses(year: number, month: number): Promise<Expense[]> {
  const db = await getDb();
  const [start, end] = monthRange(year, month);
  const rows = await db.getAllAsync<ExpRow>(
    'SELECT * FROM expenses WHERE date >= ? AND date < ? ORDER BY date DESC, id DESC',
    start,
    end,
  );
  return rows.map(toExpense);
}

export async function getExpense(id: number): Promise<Expense> {
  const db = await getDb();
  const r = await db.getFirstAsync<ExpRow>('SELECT * FROM expenses WHERE id = ?', id);
  if (!r) throw new Error('Expense not found');
  return toExpense(r);
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO expenses (category_id, amount_cents, description, date) VALUES (?, ?, ?, ?)',
    input.category_id,
    strToCents(input.amount),
    input.description,
    input.date,
  );
  return getExpense(res.lastInsertRowId);
}

export async function updateExpense(id: number, input: ExpenseInput): Promise<Expense> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE expenses SET category_id = ?, amount_cents = ?, description = ?, date = ? WHERE id = ?',
    input.category_id,
    strToCents(input.amount),
    input.description,
    input.date,
    id,
  );
  return getExpense(id);
}

export async function deleteExpense(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
}

export async function clearAllExpenses(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM expenses');
}

export async function getSummary(year: number, month: number): Promise<ExpenseSummary> {
  const db = await getDb();
  const [start, end] = monthRange(year, month);
  const rows = await db.getAllAsync<{
    category_id: number;
    category: string;
    color: string;
    total_cents: number;
  }>(
    `SELECT c.id AS category_id, c.name AS category, c.color AS color,
            SUM(e.amount_cents) AS total_cents
       FROM expenses e
       JOIN categories c ON c.id = e.category_id
      WHERE e.date >= ? AND e.date < ?
      GROUP BY c.id, c.name, c.color
      ORDER BY total_cents DESC`,
    start,
    end,
  );

  const by_category = rows.map((r) => ({
    category_id: r.category_id,
    category: r.category,
    color: r.color,
    total: centsToStr(r.total_cents),
  }));
  const totalCents = rows.reduce((sum, r) => sum + r.total_cents, 0);

  return { year, month, total: centsToStr(totalCents), by_category };
}
