// Local SQLite database: versioned migrations, one-time seed, shared connection.
// Fully on-device — no server, works offline.
//
// Data survives app updates as long as the APK keeps the same applicationId and
// signing key. Schema changes across releases MUST be added as new migrations
// below (never edit an old one) so existing users' data is preserved.
import * as SQLite from 'expo-sqlite';

import { DEFAULT_CATEGORIES } from '@/db/defaults';

const DB_NAME = 'expenses.db';

/**
 * Ordered migrations. Index + 1 == schema version. To evolve the schema in a
 * future release, APPEND a new function here — do not modify existing ones.
 * On launch, only migrations newer than the device's current version run, so
 * existing data is never dropped.
 */
const MIGRATIONS: ((db: SQLite.SQLiteDatabase) => Promise<void>)[] = [
  // v1 — initial schema + default categories
  async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL,
        color      TEXT    NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id  INTEGER NOT NULL REFERENCES categories(id),
        amount_cents INTEGER NOT NULL,
        description  TEXT,
        date         TEXT    NOT NULL,
        created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS ix_expenses_date ON expenses(date);
      CREATE INDEX IF NOT EXISTS ix_expenses_category ON expenses(category_id);
    `);

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
  },

  // v2 — per-category monthly budgets (recurring limit per category)
  async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS budgets (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL UNIQUE REFERENCES categories(id) ON DELETE CASCADE,
        limit_cents INTEGER NOT NULL
      );
    `);
  },

  // v3 — reconcile default categories (adds new defaults, skips existing by name)
  async (db) => {
    for (const c of DEFAULT_CATEGORIES) {
      await db.runAsync(
        `INSERT INTO categories (name, color, is_default)
         SELECT ?, ?, 1
         WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = ?)`,
        c.name,
        c.color,
        c.name,
      );
    }
  },

  // v4 — recurring expense rules + link generated expenses back to their rule
  async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recurring_expenses (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id  INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        amount_cents INTEGER NOT NULL,
        description  TEXT,
        day_of_month INTEGER NOT NULL,
        start_date   TEXT    NOT NULL,
        active       INTEGER NOT NULL DEFAULT 1,
        created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
      );
    `);
    await db.execAsync('ALTER TABLE expenses ADD COLUMN recurring_id INTEGER');
    await db.execAsync('CREATE INDEX IF NOT EXISTS ix_expenses_recurring ON expenses(recurring_id)');
  },
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Open (once) and return the shared DB connection, running any pending migrations.
 * Self-heals a stale/closed native handle (e.g. after a dev Fast Refresh, or if the
 * OS reclaimed the connection) by reopening. */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = open();
  try {
    const db = await dbPromise;
    await db.getFirstAsync('SELECT 1'); // liveness probe
    return db;
  } catch {
    dbPromise = open(); // connection was invalidated — reopen fresh
    return dbPromise;
  }
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = result?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version++) {
    await db.withTransactionAsync(async () => {
      await MIGRATIONS[version](db);
    });
  }

  if (current < MIGRATIONS.length) {
    // PRAGMA can't be parameterized; MIGRATIONS.length is a trusted integer.
    await db.execAsync(`PRAGMA user_version = ${MIGRATIONS.length}`);
  }
}

/** Call once on app start so the DB is ready (and migrated) before any query. */
export async function initDatabase(): Promise<void> {
  await getDb();
}
