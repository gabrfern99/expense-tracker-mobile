// Category data access (local SQLite).
import { getDb } from '@/db/database';
import { Category } from '@/types';

interface Row {
  id: number;
  name: string;
  color: string;
  is_default: number;
}

// user_id is retained on the type for UI compatibility: null = default/system.
function toCategory(r: Row): Category {
  return { id: r.id, user_id: r.is_default ? null : r.id, name: r.name, color: r.color };
}

export async function listCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    'SELECT id, name, color, is_default FROM categories ORDER BY name',
  );
  return rows.map(toCategory);
}

export async function createCategory(name: string, color: string): Promise<Category> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO categories (name, color, is_default) VALUES (?, ?, 0)',
    name,
    color,
  );
  return { id: res.lastInsertRowId, user_id: res.lastInsertRowId, name, color };
}
