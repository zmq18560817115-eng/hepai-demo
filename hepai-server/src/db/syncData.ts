/**
 * 一键同步演示数据到当前 SQLite（前后端联调用）
 * npm run db:sync
 */
import 'dotenv/config';
import { getDb } from './index.js';
import { applyFullSeed, getDatabaseStats } from './fullSeed.js';

const db = getDb();
applyFullSeed(db);
const stats = getDatabaseStats(db);

console.log('\n和拍数据库已同步（前后端统一数据源）');
console.log('路径:', process.env.SQLITE_PATH ?? './data/hepai.sqlite');
console.log('\n表记录数:');
for (const [k, v] of Object.entries(stats.tables)) {
  console.log(`  ${k.padEnd(22)} ${v}`);
}
console.log(`\n新人数: ${stats.newcomers}`);
console.log('五大部门:', stats.departments.join('、'));
console.log('\n演示账号:');
console.log('  新人入口  auth_code: dev_newcomer（未完成盲盒可 npm run db:reset-newcomer）');
console.log('  导师登录  工号 M00001 / M00002  密码 dev');
console.log('  HR 登录    工号 HR0001  密码 dev');
console.log('\n请重启后端: npm run dev\n');
