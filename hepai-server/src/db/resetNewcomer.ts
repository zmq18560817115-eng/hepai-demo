/**
 * 将演示账号 dev_newcomer 恢复为「未完成盲盒」，便于重新答 8 题。
 * 运行: npm run db:reset-newcomer
 */
import 'dotenv/config';
import { getDb } from './index.js';
import { deleteEmployeeProfile } from '../services/employeeProfiles.js';
import { DEV_USERS } from './seed.js';

const userId = DEV_USERS.dev_newcomer;
const db = getDb();
const defaultAvatar =
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4';

db.transaction(() => {
  db.prepare(`DELETE FROM personas WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM user_answers WHERE user_id = ?`).run(userId);
  deleteEmployeeProfile(db, userId);
  db.prepare(
    `UPDATE users SET onboarding_completed = 0, nickname = '程序员小智', avatar_url = ? WHERE id = ?`,
  ).run(defaultAvatar, userId);
})();

console.log('dev_newcomer 已重置为未完成盲盒，请刷新前端页面。');
