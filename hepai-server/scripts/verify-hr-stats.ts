import 'dotenv/config';
import { getDb } from '../src/db/index.js';
import { computeHrDashboardStats } from '../src/services/hrDashboard.js';

const db = getDb();
for (const d of [
  '',
  '内容创作部门',
  '账号运营部门',
  '数据分析部门',
  '商务市场部门',
  '职能部门',
]) {
  const s = computeHrDashboardStats(db, { dept: d || undefined, batchLimit: 4 });
  console.log(
    d || '全公司',
    '融入',
    s.integration_index,
    '风险',
    s.newcomers_at_risk,
    '午餐',
    `${Math.round(s.lunch_match_success_rate * 100)}%`,
    '新人',
    s.newcomer_count,
  );
}
