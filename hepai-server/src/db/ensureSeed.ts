import type Database from 'better-sqlite3';
import { applyFullSeed } from './fullSeed.js';

/** 在已有数据库上补全演示数据（不删用户） */
export function ensureExtendedSeed(db: Database.Database) {
  applyFullSeed(db);
}
