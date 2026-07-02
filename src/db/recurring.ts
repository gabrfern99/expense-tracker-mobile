// Recurring expense rules + materialization into real expense rows.
// Offline design: no background jobs — occurrences are generated on app launch
// and when a month is viewed (back-filled from the rule's start month).
import { getDb } from '@/db/database';
import { RecurringItem } from '@/types';

const strToCents = (s: string): number => Math.round(parseFloat(s) * 100);
const pad = (n: number) => String(n).padStart(2, '0');

function monthRange(year: number, month: number): [string, string] {
  const start = `${year}-${pad(month)}-01`;
  const ny = month === 12 ? year + 1 : year;
  const nm = month === 12 ? 1 : month + 1;
  return [start, `${ny}-${pad(nm)}-01`];
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface RecurringInput {
  category_id: number;
  amount: string;
  description: string | null;
  day_of_month: number; // 1..31 (clamped to 28 when posting)
  start_date: string; // YYYY-MM-DD
}

export async function createRecurring(input: RecurringInput): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    `INSERT INTO recurring_expenses (category_id, amount_cents, description, day_of_month, start_date, active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    input.category_id,
    strToCents(input.amount),
    input.description,
    input.day_of_month,
    input.start_date,
  );
  return res.lastInsertRowId;
}

export async function listRecurring(): Promise<RecurringItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    category_id: number;
    category: string;
    color: string;
    amount_cents: number;
    description: string | null;
    day_of_month: number;
    start_date: string;
  }>(
    `SELECT r.id, r.category_id, c.name AS category, c.color AS color,
            r.amount_cents, r.description, r.day_of_month, r.start_date
       FROM recurring_expenses r
       JOIN categories c ON c.id = r.category_id
      WHERE r.active = 1
      ORDER BY c.name`,
  );
  return rows.map((r) => ({
    id: r.id,
    category_id: r.category_id,
    category: r.category,
    color: r.color,
    amount: (r.amount_cents / 100).toFixed(2),
    description: r.description,
    day_of_month: r.day_of_month,
    start_date: r.start_date,
  }));
}

/** Stop a rule. Keeps past/current generated expenses; removes not-yet-occurred ones. */
export async function deleteRecurring(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM expenses WHERE recurring_id = ? AND date > ?', id, todayISO());
  await db.runAsync('DELETE FROM recurring_expenses WHERE id = ?', id);
}

/**
 * Generate any missing occurrences for all active rules, from each rule's start
 * month up to and including (upToYear, upToMonth). Idempotent.
 */
export async function materializeRecurring(upToYear: number, upToMonth: number): Promise<void> {
  const db = await getDb();
  const rules = await db.getAllAsync<{
    id: number;
    category_id: number;
    amount_cents: number;
    description: string | null;
    day_of_month: number;
    start_date: string;
  }>('SELECT id, category_id, amount_cents, description, day_of_month, start_date FROM recurring_expenses WHERE active = 1');

  for (const rule of rules) {
    const [sy, sm] = rule.start_date.split('-').map(Number);
    let y = sy;
    let m = sm;
    let guard = 0; // safety against bad data (max ~50 years)
    while ((y < upToYear || (y === upToYear && m <= upToMonth)) && guard < 600) {
      guard++;
      const day = Math.min(rule.day_of_month, 28);
      const [start, end] = monthRange(y, m);
      const exists = await db.getFirstAsync<{ x: number }>(
        'SELECT 1 AS x FROM expenses WHERE recurring_id = ? AND date >= ? AND date < ? LIMIT 1',
        rule.id,
        start,
        end,
      );
      if (!exists) {
        await db.runAsync(
          `INSERT INTO expenses (category_id, amount_cents, description, date, recurring_id)
           VALUES (?, ?, ?, ?, ?)`,
          rule.category_id,
          rule.amount_cents,
          rule.description,
          `${y}-${pad(m)}-${pad(day)}`,
          rule.id,
        );
      }
      if (m === 12) {
        m = 1;
        y++;
      } else {
        m++;
      }
    }
  }
}
