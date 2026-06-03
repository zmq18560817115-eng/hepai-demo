/**
 * 将库内用户密码统一为演示默认密码（已有库执行一次即可）
 * npm run db:sync-passwords
 */
import 'dotenv/config';
import { getDb } from './index.js';
import { DEFAULT_USER_PASSWORD } from '../utils/defaultPassword.js';

const db = getDb();
const r = db
  .prepare(`UPDATE users SET password = ? WHERE password IS NULL OR password = '' OR password = 'dev'`)
  .run(DEFAULT_USER_PASSWORD);
console.log(`已更新 ${r.changes} 条用户密码为 ${DEFAULT_USER_PASSWORD}`);
