// Local SQLite database: schema, one-time seed, and a shared connection.
// Fully on-device — no server, works offline.
import * as SQLite from 'expo-sqlite';

import { DEFAULT_CATEGORIES } from '@/db/defaults';

const DB_NAME = 'expenses.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Open (once) and return the shared DB connection, initializing schema/seed. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = open();
  }
  return dbPromise;
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      color      TEXT    NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id  INTEGER NOT NULL REFERENCES categories(id),
      amount_cents INTEGER NOT NULL,          -- money as integer cents (exact sums)
      description  TEXT,
      date         TEXT    NOT NULL,          -- YYYY-MM-DD (lexicographic = chronological)
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS ix_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS ix_expenses_category ON expenses(category_id);
  `);

  // Seed default categories once (only when the table is empty).
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM categories');
  if (!row || row.n === 0) {
    for (const c of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'INSERT INTO categories (name, color, is_default) VALUES (?, ?, 1)',
        c.name,
        c.color,
      );
    }
  }

  return db;
}

/** Call once on app start so the DB is ready before any screen queries. */
export async function initDatabase(): Promise<void> {
  await getDb();
}
