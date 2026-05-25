/**
 * 在不清空用户的前提下，补全 8 道题库与演示数据。
 * 已有旧库请运行: npm run db:enrich
 */
import 'dotenv/config';
import { getDb } from './index.js';
import { ensureExtendedSeed } from './ensureSeed.js';

const db = getDb();
ensureExtendedSeed(db);
const count = db.prepare('SELECT COUNT(*) as c FROM quiz_questions').get() as {
  c: number;
};
console.log(`题库共 ${count.c} 道题，演示数据已补全。请重启后端 npm run dev`);
