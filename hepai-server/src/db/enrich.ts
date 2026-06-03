/**
 * 在不清空用户的前提下，补全 8 道题库与演示数据。
 * 已有旧库请运行: npm run db:sync 或 npm run db:enrich
 */
import 'dotenv/config';
import { getDb } from './index.js';
import { applyFullSeed, getDatabaseStats } from './fullSeed.js';
import { syncAllNewcomerPersonaAvatars } from '../services/syncPersonaAvatars.js';

const db = getDb();
applyFullSeed(db);
const avatars = syncAllNewcomerPersonaAvatars(db);
const stats = getDatabaseStats(db);
console.log(`题库 ${stats.tables.quiz_questions} 道，新人 ${stats.newcomers} 人，HR 告警 ${stats.tables.hr_alerts} 条，人格头像 ${avatars} 条`);
console.log('演示数据已补全。建议: npm run db:sync 查看明细；重启后端 npm run dev');
