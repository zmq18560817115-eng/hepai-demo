/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 首次接入 · 带教导师与团队成员介绍
 */

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, X, UserPlus, UserRound, Users } from 'lucide-react';
import { MOCK_MENTORS } from '../../types';
import MemberAvatar from './MemberAvatar';

type MemberProfile = {
  id: string;
  name: string;
  role: string;
  tag?: string;
  seed: number;
  chips: string[];
  preferences: string[];
};

const TEAM_PEERS: MemberProfile[] = [
  {
    id: 'peer-hr',
    name: '王 HR',
    role: '入职伙伴 · HR',
    tag: '流程答疑',
    seed: 0,
    chips: ['流程答疑', '新人融入', '制度指引'],
    preferences: ['更偏好用清单推进', '需要你准备：工号/设备/权限问题清单'],
  },
  {
    id: 'peer-1',
    name: '程序员小智',
    role: '同批新人',
    tag: '同期入职',
    seed: 1,
    chips: ['同期入职', '饭搭子', '一起摸鱼'],
    preferences: ['午餐偏好：轻食/快餐', '沟通偏好：先约个 15 分钟快速对齐'],
  },
  {
    id: 'peer-2',
    name: '产品小美',
    role: '同部门伙伴',
    tag: '协作搭子',
    seed: 2,
    chips: ['协作搭子', '需求拆解', '节奏把控'],
    preferences: ['偏好：提前同步需求背景', '常用方式：钉钉文档 + 评论跟踪'],
  },
  {
    id: 'peer-3',
    name: '设计阿玲',
    role: 'UX 协作伙伴',
    tag: '同项目组',
    seed: 3,
    chips: ['同项目组', '体验走查', '拼贴风'],
    preferences: ['偏好：先对齐目标用户', '交付习惯：先低保真后高保真'],
  },
  {
    id: 'peer-4',
    name: '测试老陈',
    role: '质量保障伙伴',
    tag: '联调搭子',
    seed: 4,
    chips: ['联调搭子', '质量保障', '稳定性'],
    preferences: ['偏好：提单前先自测', '输出：关键路径用例 + 风险点提醒'],
  },
];

type WelcomeTeamPanelProps = {
  onContinue: () => void;
  /** 嵌入钉钉插件卡片时全屏覆盖，避免被下层内容遮挡 */
  fullScreen?: boolean;
};

function PersonCard({
  id,
  name,
  role,
  tag,
  highlight,
  active,
  delay,
  seed,
  onOpen,
}: {
  id: string;
  name: string;
  role: string;
  tag?: string;
  highlight?: boolean;
  active?: boolean;
  delay: number;
  seed: number;
  onOpen: (id: string) => void;
}) {
  const emphasized = Boolean(active || highlight);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 280 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985, y: 0 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
        emphasized
          ? 'border-[#ff5e4d] bg-[#fff6ec] shadow-[4px_4px_0_#ff5e4d]'
          : 'border-[#d0d5dd] bg-white shadow-[0_6px_16px_rgb(15_23_42/0.06)] hover:border-[#1677ff]/50'
      } focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1677ff]/25`}
      role="button"
      tabIndex={0}
      aria-label={`查看 ${name} 的标签偏好`}
      onClick={() => onOpen(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(id);
        }
      }}
    >
      <MemberAvatar name={name} seed={seed} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#171a1d] truncate">{name}</p>
        <p className="text-xs text-[#646a73] mt-0.5">{role}</p>
        {tag && (
          <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6f4ff] text-[#1677ff]">
            {tag}
          </span>
        )}
      </div>
      <span
        className={`text-[10px] font-bold shrink-0 ${
          emphasized ? 'text-[#ff5e4d]' : 'text-[#1677ff]'
        }`}
      >
        查看偏好
      </span>
    </motion.div>
  );
}

export default function WelcomeTeamPanel({
  onContinue,
  fullScreen = false,
}: WelcomeTeamPanelProps) {
  const mentorProfiles: MemberProfile[] = useMemo(
    () =>
      MOCK_MENTORS.map((m, i) => ({
        id: `mentor-${m.id}`,
        name: m.name,
        role: m.role,
        tag: m.status === 'busy' ? '主导师' : '项目导师',
        seed: 10 + i,
        chips:
          m.status === 'busy'
            ? ['主导师', '架构带教', '融入护航']
            : ['项目导师', '任务拆解', '落地陪跑'],
        preferences:
          m.status === 'busy'
            ? ['偏好：先给路线图再给细节', '沟通：每天 10 分钟对齐阻塞点']
            : ['偏好：以 demo 驱动推进', '协作：问题直接丢到线程里快速闭环'],
      })),
    [],
  );

  const byId = useMemo(() => {
    const map = new Map<string, MemberProfile>();
    for (const m of mentorProfiles) map.set(m.id, m);
    for (const p of TEAM_PEERS) map.set(p.id, p);
    return map;
  }, [mentorProfiles]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId ? byId.get(activeId) : null;
  const [orgOpen, setOrgOpen] = useState(false);

  const allMembers = [
    ...mentorProfiles.map((m) => ({ name: m.name, seed: m.seed })),
    ...TEAM_PEERS.map((p) => ({ name: p.name, seed: p.seed })),
  ];
  const teamSize = allMembers.length + 1;

  const openMember = (id: string) => {
    setActiveId(id);
  };

  const closeMember = () => setActiveId(null);
  const closeOrg = () => setOrgOpen(false);

  const orgNodes = useMemo(() => {
    const mentors = mentorProfiles.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.tag ?? m.role,
      seed: m.seed,
      group: 'mentor' as const,
    }));
    const peers = TEAM_PEERS.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.tag ?? p.role,
      seed: p.seed,
      group: 'peer' as const,
    }));
    return { mentors, peers };
  }, [mentorProfiles]);

  return (
    <div
      className={`overflow-y-auto bg-gradient-to-b from-[#f5f6f8] to-white ${
        fullScreen
          ? 'fixed inset-0 z-[90]'
          : 'h-full min-h-[480px]'
      }`}
    >
      <div className="max-w-2xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffe8e4] text-[#ff5e4d] text-xs font-bold mb-4">
            <Users size={14} />
            礼包已到账 · 认识你的团队
          </div>
          <h1 className="text-2xl font-bold text-[#171a1d]">你的带教与伙伴</h1>
          <p className="text-sm text-[#646a73] mt-2 leading-relaxed">
            加入团队后，可在和拍中与导师私信、与同期结对饭搭子，并在工位收集融入奖励。
          </p>
        </motion.div>

        <section className="mb-6">
          <h2 className="text-xs font-bold text-[#8f959e] uppercase tracking-wider mb-3 flex items-center gap-2">
            <UserRound size={14} />
            带教导师
          </h2>
          <div className="space-y-3">
            {mentorProfiles.map((m, i) => (
              <div key={m.id}>
                <PersonCard
                  id={m.id}
                  name={m.name}
                  role={m.role}
                  tag={m.tag}
                  highlight={i === 0}
                  active={activeId === m.id}
                  delay={0.1 + i * 0.08}
                  seed={m.seed}
                  onOpen={openMember}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-bold text-[#8f959e] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users size={14} />
            团队与同期
          </h2>
          <div className="space-y-3">
            {TEAM_PEERS.map((p, i) => (
              <div key={p.id}>
                <PersonCard
                  id={p.id}
                  name={p.name}
                  role={p.role}
                  tag={p.tag}
                  active={activeId === p.id}
                  delay={0.28 + i * 0.06}
                  seed={p.seed}
                  onOpen={openMember}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 团队头像叠放条 */}
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99, y: 0 }}
          onClick={() => setOrgOpen(true)}
          className="mb-8 w-full p-5 rounded-2xl border-2 border-[#e8eaed] bg-white text-center cursor-pointer hover:border-[#1677ff]/40 transition-colors"
          aria-label="查看组织架构"
        >
          <p className="text-xs font-bold text-[#646a73] mb-4 flex items-center justify-center gap-1.5">
            <UserPlus size={14} className="text-[#1677ff]" />
            即将加入 · 产品技术新人融入小队
            <span className="ml-2 text-[10px] font-black text-[#1677ff]">
              点击查看组织架构
            </span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1 max-w-md mx-auto">
            {allMembers.slice(0, 8).map((m, i) => (
              <motion.div
                key={`${m.name}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.04 }}
                className={i > 0 ? '-ml-2' : ''}
                style={{ zIndex: 10 - i }}
              >
                <MemberAvatar name={m.name} seed={m.seed} size="sm" ring />
              </motion.div>
            ))}
            <div
              className="-ml-2 w-10 h-10 rounded-lg border-2 border-[#1b2838] bg-[#1677ff] text-white text-[10px] font-bold flex items-center justify-center shrink-0 ring-2 ring-white"
              style={{ zIndex: 0 }}
              title="还有你"
            >
              +{teamSize - Math.min(8, allMembers.length)}
            </div>
          </div>
          <p className="text-[11px] text-[#8f959e] mt-3 font-mono">
            共 {teamSize} 位同事已在和拍等你
          </p>
        </motion.button>

        <motion.button
          type="button"
          onClick={onContinue}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#1677ff] hover:bg-[#4096ff] text-white text-base font-bold shadow-[0_4px_14px_rgb(22_119_255/0.35)] border-2 border-[#0958d9] min-h-[52px]"
        >
          继续，加入团队
          <ArrowRight size={20} strokeWidth={2.5} />
        </motion.button>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={`${active.name} 的标签偏好`}
          >
            <motion.div
              className="absolute inset-0 bg-[#1e2433]/55 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMember}
            />
            <motion.div
              className="relative w-full max-w-lg rounded-3xl border-2 border-[#1b2838] bg-white shadow-[8px_8px_0_#1b2838] overflow-hidden"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <div className="h-2 bg-gradient-to-r from-[#ff5e4d] via-[#ffd666] to-[#1677ff]" />
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <MemberAvatar name={active.name} seed={active.seed} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-black text-[#171a1d] truncate">
                      {active.name}
                    </p>
                    <p className="text-sm text-[#646a73] mt-1">{active.role}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {active.chips.map((c) => (
                        <span
                          key={c}
                          className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeMember}
                    className="p-2 rounded-xl hover:bg-[#f5f6f8] text-[#8f959e]"
                    aria-label="关闭"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-[#e8eaed] bg-[#f5f6f8] p-4">
                  <p className="text-xs font-black text-[#171a1d] mb-2">
                    标签偏好
                  </p>
                  <ul className="space-y-2 text-sm text-[#646a73]">
                    {active.preferences.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#1677ff] shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {orgOpen && (
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="组织架构"
          >
            <motion.div
              className="absolute inset-0 bg-[#1e2433]/55 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeOrg}
            />
            <motion.div
              className="relative w-full max-w-3xl rounded-3xl border-2 border-[#1b2838] bg-white shadow-[10px_10px_0_#1b2838] overflow-hidden"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <div className="h-2 bg-gradient-to-r from-[#ff5e4d] via-[#ffd666] to-[#1677ff]" />
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-black text-[#171a1d]">
                      组织架构图（示意）
                    </p>
                    <p className="text-sm text-[#646a73] mt-1">
                      展示带教导师与团队/同期的协作关系。点击空白处关闭。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeOrg}
                    className="p-2 rounded-xl hover:bg-[#f5f6f8] text-[#8f959e]"
                    aria-label="关闭"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="mt-4 rounded-2xl border border-[#e8eaed] bg-white overflow-hidden">
                  <OrgChart
                    mentors={orgNodes.mentors}
                    peers={orgNodes.peers}
                    activeId={null}
                    onPick={() => {}}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OrgChart({
  mentors,
  peers,
  activeId,
  onPick,
}: {
  mentors: { id: string; name: string; role: string; seed: number; group: 'mentor' }[];
  peers: { id: string; name: string; role: string; seed: number; group: 'peer' }[];
  activeId: string | null;
  onPick: (id: string) => void;
}) {
  // 简单的两层结构：导师（上）→ 团队/同期（下）
  const top = mentors.slice(0, 2);
  const bottom = peers.slice(0, 6);
  const width = 560;
  const height = 220;
  const topY = 52;
  const bottomY = 160;
  const topXs = top.length === 1 ? [width / 2] : [width * 0.35, width * 0.65];
  const bottomXs = bottom.map((_, i) => {
    const n = Math.max(3, bottom.length);
    const gap = width / (n + 1);
    return gap * (i + 1);
  });

  const node = (
    id: string,
    name: string,
    role: string,
    x: number,
    y: number,
    seed: number,
  ) => {
    const active = id === activeId;
    const fill = active ? '#fff6ec' : '#f5f6f8';
    const stroke = active ? '#ff5e4d' : '#1b2838';
    const shadow = active ? '#ff5e4d' : '#1b2838';
    const initials = name.replace(/\s+/g, '').slice(0, 2);
    return (
      <g
        key={id}
        transform={`translate(${x},${y})`}
        style={{ cursor: onPick ? 'pointer' : 'default' }}
        onClick={() => onPick?.(id)}
        role="button"
        tabIndex={-1}
      >
        <rect
          x={-78}
          y={-22}
          rx={14}
          width={156}
          height={62}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
        />
        <rect
          x={-74}
          y={-18}
          rx={12}
          width={156}
          height={62}
          fill="transparent"
          stroke={shadow}
          strokeOpacity={0.18}
          strokeWidth={6}
        />
        <rect
          x={-66}
          y={-10}
          rx={10}
          width={40}
          height={40}
          fill={active ? '#ff5e4d' : '#1677ff'}
          stroke="#1b2838"
          strokeWidth={2}
        />
        <text
          x={-46}
          y={16}
          textAnchor="middle"
          fill="white"
          style={{ fontSize: 14, fontWeight: 900 }}
        >
          {initials}
        </text>
        <text
          x={-18}
          y={6}
          fill="#171a1d"
          style={{ fontSize: 12, fontWeight: 800 }}
        >
          {name}
        </text>
        <text
          x={-18}
          y={24}
          fill="#8f959e"
          style={{ fontSize: 10, fontWeight: 700 }}
        >
          {role}
        </text>
        <circle cx={68} cy={8} r={4} fill={active ? '#ff5e4d' : '#1677ff'} />
        <circle cx={68} cy={22} r={2} fill="#cbd5e1" />
        <circle cx={68} cy={32} r={2} fill="#cbd5e1" />
        <desc>{seed}</desc>
      </g>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[520px] h-[220px] block"
        role="img"
        aria-label="组织架构图"
      >
        <defs>
          <pattern id="org-grid" width="18" height="18" patternUnits="userSpaceOnUse">
            <path
              d="M 18 0 L 0 0 0 18"
              fill="none"
              stroke="#e8eaed"
              strokeWidth="0.8"
            />
          </pattern>
        </defs>
        <rect x="0" y="0" width={width} height={height} fill="url(#org-grid)" />

        {/* 连线：导师 → 团队 */}
        {topXs.map((tx, ti) =>
          bottomXs.map((bx, bi) => (
            <path
              key={`l-${ti}-${bi}`}
              d={`M ${tx} ${topY + 20} C ${tx} ${(topY + bottomY) / 2} ${bx} ${(topY + bottomY) / 2} ${bx} ${bottomY - 26}`}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth={1.6}
              strokeDasharray="4 6"
            />
          )),
        )}

        {top.map((m, i) => node(m.id, m.name, m.role, topXs[i]!, topY, m.seed))}
        {bottom.map((p, i) =>
          node(p.id, p.name, p.role, bottomXs[i]!, bottomY, p.seed),
        )}

        {/* 组标题 */}
        <text
          x={18}
          y={26}
          fill="#8f959e"
          style={{ fontSize: 11, fontWeight: 800 }}
        >
          带教导师
        </text>
        <text
          x={18}
          y={134}
          fill="#8f959e"
          style={{ fontSize: 11, fontWeight: 800 }}
        >
          团队与同期
        </text>
      </svg>
    </div>
  );
}
