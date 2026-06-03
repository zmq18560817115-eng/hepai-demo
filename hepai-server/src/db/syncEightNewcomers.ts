/**
 * 同步内置样板新人 E00001–E00008（与 HR 录入共用 users 表，可重复执行）
 * npm run db:sync-eight-newcomers
 */
import 'dotenv/config';
import { getDb } from './index.js';
import { DEFAULT_USER_PASSWORD } from '../utils/defaultPassword.js';
import { syncAllDemoNewcomers } from '../services/demoNewcomerSeed.js';

const db = getDb();

const LEGACY_USERNAME_REMAP: Record<string, string> = {
  N00001: 'E00006',
  N00002: 'E00007',
  N00003: 'E00003',
  N00004: 'E00004',
  N00005: 'E00005',
};

for (const [legacy, next] of Object.entries(LEGACY_USERNAME_REMAP)) {
  const taken = db
    .prepare(`SELECT id FROM users WHERE username = ?`)
    .get(next);
  if (taken) continue;
  db.prepare(`UPDATE users SET username = ? WHERE username = ?`).run(next, legacy);
}

const synced = syncAllDemoNewcomers(db);

for (const legacy of ['N00001', 'N00002', 'N00003', 'N00004', 'N00005']) {
  const canonical = LEGACY_USERNAME_REMAP[legacy];
  if (!canonical) continue;
  const hasCanonical = db.prepare(`SELECT id FROM users WHERE username = ?`).get(canonical);
  if (hasCanonical) {
    db.prepare(`DELETE FROM users WHERE username = ? AND role = 'newcomer'`).run(legacy);
  }
}

console.log(`已同步 ${synced} 位内置样板新人（密码 ${DEFAULT_USER_PASSWORD}）`);
console.log('  样板首次：E00001（无人格标签，登录→礼包→8题测试→转老员工）');
console.log('  样板老员工：E00002–E00008（固定人格，登录直达功能）');
console.log('  HR 在「入职准备」录入的工号与本样板并存，均写入同一数据库。');
