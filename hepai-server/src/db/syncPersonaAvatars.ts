/**
 * 将库内新人 avatar_url 同步为「人格头型 + 当前能量表情」
 * 运行: npm run db:sync-avatars
 */
import 'dotenv/config';
import { getDb } from './index.js';
import { syncAllNewcomerPersonaAvatars } from '../services/syncPersonaAvatars.js';

const db = getDb();
const count = syncAllNewcomerPersonaAvatars(db);
console.log(`已同步 ${count} 位新人的人格头像 URL（Dicebear 头型 + 能量表情）`);
