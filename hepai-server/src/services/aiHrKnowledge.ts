import { getDb } from '../db/index.js';
import { resolveUserDept } from '../db/fullSeed.js';
import type { ExtendedUserContext } from './skillReplyEngine.js';
import type { UserContext } from './userContext.js';

export interface OrgContext {
  my_dept: string;
  dept_newcomer_count: number;
  company_newcomer_count: number;
  dept_peer_labels: string[];
}

export function loadOrgContext(userId: string): OrgContext {
  const db = getDb();
  const myDept = resolveUserDept(userId, 0, db);
  const newcomers = db
    .prepare(`SELECT id FROM users WHERE role = 'newcomer'`)
    .all() as { id: string }[];

  const inDept = newcomers.filter(
    (u) => resolveUserDept(u.id, 0, db) === myDept,
  );
  const peerLabels = inDept
    .filter((u) => u.id !== userId)
    .map((u) => {
      const p = db
        .prepare(`SELECT name FROM personas WHERE user_id = ?`)
        .get(u.id) as { name: string } | undefined;
      const nick = db
        .prepare(`SELECT nickname FROM users WHERE id = ?`)
        .get(u.id) as { nickname: string } | undefined;
      return p?.name ? `${p.name}` : (nick?.nickname ?? '新人同事');
    });

  return {
    my_dept: myDept,
    dept_newcomer_count: inDept.length,
    company_newcomer_count: newcomers.length,
    dept_peer_labels: peerLabels,
  };
}

/** 写入 Gemini / Skill 的实时数据块 */
export function buildLiveDataBlock(
  ctx: UserContext,
  ext: ExtendedUserContext,
  org: OrgContext,
): string {
  const peers =
    org.dept_peer_labels.length > 0
      ? org.dept_peer_labels.slice(0, 6).join('、')
      : '（暂无其他已登记新人）';
  return [
    `昵称：${ctx.nickname}`,
    `部门：${org.my_dept}`,
    `本部门在和拍已登记新人：${org.dept_newcomer_count} 人（含本人）`,
    `同部门其他新人面具：${peers}`,
    `全平台新人数：${org.company_newcomer_count}`,
    `面具：${ctx.persona_name ?? '未完成盲盒'}`,
    `能量：${ctx.energy_level}%`,
    `入职保护剩余：约 ${ctx.days_left} 天`,
    `午餐状态：${ext.lunch_status ?? 'idle'}`,
    `导师：${ext.mentor_names.join('、') || '待分配'}`,
  ].join('\n');
}

type DirectAnswer = { reply: string; source: string; topic: string };

/** 优先用数据库 + Skill 手册直接回答，避免答非所问 */
export function tryDirectAnswer(
  message: string,
  userId: string,
  ctx: UserContext,
  ext: ExtendedUserContext,
): DirectAnswer | null {
  const org = loadOrgContext(userId);
  const n = ctx.nickname;
  const m = message.trim();

  if (
    /部门.*(几|多少|几个|几位|几人)|多少人|有几个|有几位|有几人|几个人|团队.*(几|多少)|同事.*(多少|几个)|咱们.*(几|多少)|多少人/.test(
      m,
    )
  ) {
    const peers =
      org.dept_peer_labels.length > 0
        ? `同部门其他已登记新人面具：${org.dept_peer_labels.join('、')}。`
        : '目前和拍里你是本部门唯一已登记的新人（演示数据）。';
    return {
      reply: `【部门人数 · 和拍数据】${n}，你属于「${org.my_dept}」。在本平台（和拍融入侧）已登记的本部门新人为 ${org.dept_newcomer_count} 人（含你在内）；全公司演示库共 ${org.company_newcomer_count} 名新人。${peers}\n\n说明：这是融入平台的登记统计，不是公司完整编制；编制与组织架构请以 HR / 钉钉通讯录为准。需要找饭搭子可看「蹭饭地图」，找带教可看「带教导师」。`,
      source: 'skill-dept-data',
      topic: 'dept_size',
    };
  }

  if (/哪个部门|什么部门|我.*部门|所属部门/.test(m)) {
    return {
      reply: `【你的部门】${n}，在和拍里登记为「${org.my_dept}」。本部门同期新人 ${org.dept_newcomer_count} 人。`,
      source: 'skill-dept-data',
      topic: 'dept_info',
    };
  }

  if (/隐私|泄露|匿名|真实.*(名字|姓名|花名)|会看到.*答案/.test(m)) {
    return {
      reply: `【隐私说明】${n}，和拍遵循「面具社交」：同事默认只见虚拟称号与标签，不见盲盒原始答案；真实花名需线下投缘后申请解锁。你的情绪日志也不对全员公开。`,
      source: 'skill-privacy',
      topic: 'privacy',
    };
  }

  if (/怎么用|如何使用|和拍.*(是什么|能干)|功能|入口|在哪里/.test(m)) {
    return {
      reply: `【和拍怎么用】${n}：① 入职盲盒 8 题 → 面具 ② 安全屋看能量/闪光 ③ 蹭饭地图匹配饭搭子 ④ 带教导师私信 ⑤ 本对话问政策类问题。你当前面具「${ctx.persona_name ?? '待完成'}」，能量 ${ctx.energy_level}%。`,
      source: 'skill-platform',
      topic: 'platform',
    };
  }

  if (/保护期|30天|三十天|新人期/.test(m)) {
    return {
      reply: `【新人保护期】${n}，和拍默认约 30 天「慢一点融入」保护期，你还剩约 ${ctx.days_left} 天。期间鼓励轻量社交，面具降低曝光压力。`,
      source: 'skill-policy',
      topic: 'protection',
    };
  }

  return null;
}
