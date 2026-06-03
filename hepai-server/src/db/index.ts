import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SCHEMA_SQL } from './schema.js';
import { ensureExtendedSeed } from './ensureSeed.js';
import { seedDatabase } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db: Database.Database | null = null;

function hasTable(database: Database.Database, table: string): boolean {
  const row = database
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
    .get(table) as { name: string } | undefined;
  return Boolean(row?.name);
}

function hasColumn(
  database: Database.Database,
  table: string,
  column: string,
): boolean {
  if (!hasTable(database, table)) return false;
  const cols = database.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];
  return cols.some((c) => c.name === column);
}

function migrateInterestMatch(database: Database.Database) {
  if (!hasTable(database, 'interest_match_requests')) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS interest_match_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        venue_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'matched', 'cancelled')),
        match_code TEXT,
        meeting_point TEXT,
        meet_before TEXT,
        matched_at TEXT,
        partner_user_id TEXT,
        confirmed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }
}

function migrateEmployeeProfiles(database: Database.Database) {
  if (!hasTable(database, 'employee_profiles')) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS employee_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        employee_no TEXT NOT NULL,
        dept TEXT NOT NULL,
        display_title TEXT NOT NULL,
        work_style TEXT NOT NULL,
        social_style TEXT NOT NULL,
        lunch_preference TEXT NOT NULL,
        support_preference TEXT NOT NULL,
        dominant_type TEXT NOT NULL CHECK(dominant_type IN ('I', 'E', 'P', 'S', 'N')),
        secondary_type TEXT CHECK(secondary_type IN ('I', 'E', 'P', 'S', 'N')),
        traits TEXT NOT NULL DEFAULT '[]',
        interests TEXT NOT NULL DEFAULT '[]',
        answer_snapshot TEXT NOT NULL DEFAULT '[]',
        batch TEXT NOT NULL DEFAULT '5月一批',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }
  if (!hasColumn(database, 'employee_profiles', 'interests')) {
    database.exec(
      `ALTER TABLE employee_profiles ADD COLUMN interests TEXT NOT NULL DEFAULT '[]'`,
    );
  }
}

function migrateLunchColumns(database: Database.Database) {
  if (!hasColumn(database, 'lunch_match_requests', 'confirmed_at')) {
    database.exec(
      `ALTER TABLE lunch_match_requests ADD COLUMN confirmed_at TEXT`,
    );
  }
}

function migrateP0P1Columns(database: Database.Database) {
  // ai_hr_messages extended metadata
  if (hasTable(database, 'ai_hr_messages')) {
    if (!hasColumn(database, 'ai_hr_messages', 'reply_source')) {
      database.exec(`ALTER TABLE ai_hr_messages ADD COLUMN reply_source TEXT`);
    }
    if (!hasColumn(database, 'ai_hr_messages', 'topic')) {
      database.exec(`ALTER TABLE ai_hr_messages ADD COLUMN topic TEXT`);
    }
    if (!hasColumn(database, 'ai_hr_messages', 'policy_version')) {
      database.exec(`ALTER TABLE ai_hr_messages ADD COLUMN policy_version TEXT`);
    }
    if (!hasColumn(database, 'ai_hr_messages', 'citations_json')) {
      database.exec(`ALTER TABLE ai_hr_messages ADD COLUMN citations_json TEXT`);
    }
    if (!hasColumn(database, 'ai_hr_messages', 'integrated_sources_json')) {
      database.exec(
        `ALTER TABLE ai_hr_messages ADD COLUMN integrated_sources_json TEXT`,
      );
    }
  }

  if (hasTable(database, 'policy_documents')) {
    if (!hasColumn(database, 'policy_documents', 'updated_at')) {
      database.exec(
        `ALTER TABLE policy_documents ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))`,
      );
    }
    if (!hasColumn(database, 'policy_documents', 'integrated_with_json')) {
      database.exec(
        `ALTER TABLE policy_documents ADD COLUMN integrated_with_json TEXT NOT NULL DEFAULT '[]'`,
      );
    }
    if (!hasColumn(database, 'policy_documents', 'source_dir')) {
      database.exec(`ALTER TABLE policy_documents ADD COLUMN source_dir TEXT`);
    }
  }

  if (hasTable(database, 'policy_chunks')) {
    if (!hasColumn(database, 'policy_chunks', 'chunk_order')) {
      database.exec(
        `ALTER TABLE policy_chunks ADD COLUMN chunk_order INTEGER NOT NULL DEFAULT 0`,
      );
    }
  }

  // Some DBs may be created before index statements existed.
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_policy_chunks_document
      ON policy_chunks(document_id, category_id, chunk_order);
    CREATE INDEX IF NOT EXISTS idx_desk_rewards_user_time
      ON desk_rewards(user_id, earned_at DESC);
    CREATE INDEX IF NOT EXISTS idx_mentor_touchpoints_pair_time
      ON mentor_touchpoints(mentee_id, mentor_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
      ON auth_sessions(user_id, issued_at DESC);
  `);
}

export function getDb(): Database.Database {
  if (!db) {
    const sqlitePath =
      process.env.SQLITE_PATH ??
      path.resolve(__dirname, '../../data/hepai.sqlite');
    fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
    db = new Database(sqlitePath);
    db.pragma('foreign_keys = ON');
    db.exec(SCHEMA_SQL);
    migrateEmployeeProfiles(db);
    migrateInterestMatch(db);
    migrateLunchColumns(db);
    migrateP0P1Columns(db);
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
