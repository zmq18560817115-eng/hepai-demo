import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SCHEMA_SQL } from './schema.js';
import { ensureExtendedSeed } from './ensureSeed.js';
import { seedDatabase } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const sqlitePath =
      process.env.SQLITE_PATH ??
      path.resolve(__dirname, '../../data/hepai.sqlite');
    fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
    db = new Database(sqlitePath);
    db.pragma('foreign_keys = ON');
    db.exec(SCHEMA_SQL);
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_hr_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT '企业 AI HR 对话',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS ai_hr_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES ai_hr_sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    seedDatabase(db);
    ensureExtendedSeed(db);
  }
  return db;
}

export function daysSinceOnboarding(onboardingDate: string): number {
  const row = getDb()
    .prepare(
      `SELECT CAST(julianday('now') - julianday(?) AS INTEGER) as days`,
    )
    .get(onboardingDate) as { days: number };
  return row.days;
}

export function onboardingDaysLeft(onboardingDate: string): number {
  return Math.max(0, 30 - daysSinceOnboarding(onboardingDate));
}
