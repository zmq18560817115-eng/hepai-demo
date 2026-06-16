/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 钉钉电脑端工作台外壳 · 和拍作为左侧导航插件嵌入主内容区
 */

import React, { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  Calendar,
  CheckSquare,
  FileText,
  BarChart3,
  ChevronRight,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Table2,
  UserPlus,
  Video,
  Mic,
  UserRound,
  Users,
} from 'lucide-react';
import { DingTalkShellProvider } from '../../context/DingTalkShellContext';
import {
  hasCompletedPluginFirstRun,
  markPluginFirstRunComplete,
  resetPluginFirstRun,
} from '../../utils/firstRunStorage';
import OnboardingPluginIntro from './OnboardingPluginIntro';
import EntryRoleSelectView from '../EntryRoleSelectView';
import type { UserType } from '../../types';

type ShellNavId =
  | 'messages'
  | 'docs'
  | 'ai_sheet'
  | 'ai_notes'
  | 'workbench'
  | 'contacts'
  | 'meeting'
  | 'calendar'
  | 'todo'
  | 'ding'
  | 'onboarding';

/** 插件内展示阶段（大礼包与团队介绍在登录后由 AppShell 统一处理） */
type OnboardingStep =
  | 'role_select'
  | 'intro'
  | 'plugin';

type NavItem = {
  id: ShellNavId;
  label: string;
  icon: React.ReactNode;
  plugin?: boolean;
};

const RAIL_NAV: NavItem[] = [
  { id: 'messages', label: '消息', icon: <MessageSquare size={20} strokeWidth={2} /> },
  { id: 'docs', label: '文档', icon: <FileText size={20} strokeWidth={2} /> },
  { id: 'ai_sheet', label: 'AI 表格', icon: <Table2 size={20} strokeWidth={2} /> },
  { id: 'ai_notes', label: 'AI 听记', icon: <Mic size={20} strokeWidth={2} /> },
  { id: 'workbench', label: '工作台', icon: <LayoutGrid size={20} strokeWidth={2} /> },
  { id: 'contacts', label: '通讯录', icon: <UserPlus size={20} strokeWidth={2} /> },
  { id: 'meeting', label: '会议', icon: <Video size={20} strokeWidth={2} /> },
  { id: 'calendar', label: '日历', icon: <Calendar size={20} strokeWidth={2} /> },
  { id: 'todo', label: '待办', icon: <CheckSquare size={20} strokeWidth={2} /> },
  { id: 'ding', label: 'DING', icon: <Bell size={20} strokeWidth={2} /> },
  {
    id: 'onboarding',
    label: '新人入职',
    icon: <span className="text-[11px] font-black leading-none">和</span>,
    plugin: true,
  },
];

const MOCK_CHATS = [
  { name: 'AI 助理', preview: '你好，我是你的 AI 助理', active: true },
  { name: '入职欢迎群', preview: '欢迎加入团队！', active: false },
  { name: '带教导师 · 雷老师', preview: '有问题随时私信我', active: false },
];

function PlaceholderPane({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-white text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-[#f0f2f5] flex items-center justify-center text-[#8f959e] mb-4">
        <LayoutGrid size={28} />
      </div>
      <h2 className="text-lg font-semibold text-[#171a1d]">{title}</h2>
      <p className="text-sm text-[#8f959e] mt-2 max-w-sm">{hint}</p>
      <p className="text-xs text-[#b5b9bd] mt-6 font-mono">
        演示占位 · 请从左侧选择「新人入职」进入和拍插件
      </p>
    </div>
  );
}

function MessagesAiPane() {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto text-center pt-8">
          <div className="w-14 h-14 rounded-full bg-[#1677ff]/10 text-[#1677ff] flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            AI
          </div>
          <h2 className="text-xl font-semibold text-[#171a1d]">
            你好，我是你的 AI 助理
          </h2>
          <p className="text-sm text-[#8f959e] mt-2">
            钉钉电脑端消息区演示 · 与和拍插件独立
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-8 text-left">
            {['深度思考', '帮我写作', 'AI 搜索', 'AI 编程', '图像创作', '更多'].map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  className="px-3 py-2.5 rounded-lg border border-[#e8eaed] bg-[#fafafa] text-xs text-[#646a73] hover:border-[#1677ff]/40"
                >
                  {t}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
      <div className="shrink-0 border-t border-[#e8eaed] p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2 rounded-xl border border-[#dde1e6] bg-[#f5f6f8] px-4 py-3">
          <span className="text-sm text-[#b5b9bd] flex-1 text-left">
            向 AI 助理提问…
          </span>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  title,
  subtitle,
  bg,
  iconBg,
  border,
  shadow,
  icon,
  onClick,
  layout = 'row',
}: {
  title: string;
  subtitle: string;
  bg: string;
  iconBg: string;
  border: string;
  shadow: string;
  icon: React.ReactNode;
  onClick: () => void;
  layout?: 'row' | 'column';
}) {
  if (layout === 'column') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group flex flex-col items-center text-center px-4 py-5 rounded-xl border ${border} ${bg} ${shadow} hover:border-[#91caff] hover:bg-[#f9fbff] hover:shadow-sm transition-all`}
      >
        <div
          className={`w-11 h-11 rounded-lg border border-[#d9d9d9] ${iconBg} flex items-center justify-center`}
          aria-hidden
        >
          {icon}
        </div>
        <p className="text-[15px] leading-snug font-medium text-[#171a1d] mt-3">
          {title}
        </p>
        <p className="text-xs text-[#8f959e] mt-1 leading-relaxed">{subtitle}</p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full text-left px-3.5 py-3 rounded-xl border ${border} ${bg} ${shadow} hover:border-[#91caff] hover:bg-[#f9fbff] hover:shadow-sm transition-all`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 shrink-0 rounded-lg border border-[#d9d9d9] ${iconBg} flex items-center justify-center`}
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-snug font-medium text-[#171a1d] truncate">
            {title}
          </p>
          <p className="text-xs text-[#8f959e] mt-0.5 truncate">{subtitle}</p>
        </div>
        <ChevronRight
          size={16}
          className="shrink-0 text-[#c9cdd4] group-hover:text-[#1677ff] transition-colors"
          aria-hidden
        />
      </div>
    </button>
  );
}

type DingTalkDesktopShellProps = {
  children: React.ReactNode;
};

export default function DingTalkDesktopShell({
  children,
}: DingTalkDesktopShellProps) {
  const [activeNav, setActiveNav] = useState<ShellNavId>(() => {
    if (import.meta.env.VITE_USE_MOCK_API === 'true') return 'onboarding';
    const p = new URLSearchParams(window.location.search);
    if (p.get('start') === 'onboarding') return 'onboarding';
    return 'messages';
  });
  const [firstRunDone, setFirstRunDone] = useState(hasCompletedPluginFirstRun);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(
    'role_select',
  );
  const [entryRole, setEntryRole] = useState<UserType | null>(null);

  const showMessageList = activeNav === 'messages';
  const isOnboarding = activeNav === 'onboarding';
  const pluginEntered = isOnboarding && onboardingStep === 'plugin';

  const handleNavClick = (id: ShellNavId) => {
    setActiveNav(id);
    if (id === 'onboarding') {
      setOnboardingStep('role_select');
    }
  };

  const handleIntroEnter = () => {
    markPluginFirstRunComplete();
    setFirstRunDone(true);
    setOnboardingStep('plugin');
  };

  const exitPlugin = () => {
    setEntryRole(null);
    setOnboardingStep('role_select');
  };

  const replayFirstRun = useCallback(() => {
    resetPluginFirstRun();
    setFirstRunDone(false);
    setOnboardingStep('role_select');
    setActiveNav('onboarding');
    setEntryRole(null);
  }, []);

  const pluginFrameKey = useMemo(() => {
    if (!isOnboarding) return `nav:${activeNav}`;
    return `onboarding:${onboardingStep}`;
  }, [activeNav, isOnboarding, onboardingStep]);

  const renderMain = () => {
    if (isOnboarding) {
      if (onboardingStep === 'role_select') {
        return (
          <EntryRoleSelectView
            embedded
            onSelect={(role) => {
              setEntryRole(role);
              if (role === 'newcomer' && !firstRunDone) {
                setOnboardingStep('intro');
              } else {
                setOnboardingStep('plugin');
              }
            }}
          />
        );
      }

      if (onboardingStep === 'plugin') {
        return (
          <DingTalkShellProvider
            embedded
            exitPlugin={exitPlugin}
            entryRole={entryRole}
            setEntryRole={setEntryRole}
          >
            <div className="h-full min-h-0 overflow-hidden bg-[#f5f6f8] p-4 lg:p-6">
              <div className="h-full min-h-0 rounded-2xl border border-[#dde1e6] bg-white shadow-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-[#ff5e4d] via-[#ffd666] to-[#1677ff]" />
                <div className="h-[calc(100%-0.5rem)] min-h-0 overflow-hidden">
                  {children}
                </div>
              </div>
            </div>
          </DingTalkShellProvider>
        );
      }
      if (onboardingStep === 'intro') {
        return (
          <OnboardingPluginIntro
            onEnter={handleIntroEnter}
            onReplayFirstRun={firstRunDone ? replayFirstRun : undefined}
          />
        );
      }
    }

    if (activeNav === 'messages') {
      return <MessagesAiPane />;
    }

    const labels: Record<ShellNavId, { title: string; hint: string }> = {
      messages: { title: '消息', hint: '' },
      docs: { title: '文档', hint: '团队文档与知识库（演示占位）' },
      ai_sheet: { title: 'AI 表格', hint: '智能表格协作（演示占位）' },
      ai_notes: { title: 'AI 听记', hint: '会议听记与摘要（演示占位）' },
      workbench: { title: '工作台', hint: '企业应用入口聚合（演示占位）' },
      contacts: { title: '通讯录', hint: '组织架构与联系人（演示占位）' },
      meeting: { title: '会议', hint: '视频会议与预约（演示占位）' },
      calendar: { title: '日历', hint: '日程安排（演示占位）' },
      todo: { title: '待办', hint: '任务与待办清单（演示占位）' },
      ding: { title: 'DING', hint: '强提醒消息（演示占位）' },
      onboarding: { title: '', hint: '' },
    };
    const meta = labels[activeNav];
    return <PlaceholderPane title={meta.title} hint={meta.hint} />;
  };

  const showOnboardingSidebar =
    isOnboarding && onboardingStep !== 'plugin';

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#e8eaed] font-sans">
      <header className="h-12 shrink-0 bg-[#f5f6f8] border-b border-[#dde1e6] flex items-center px-4 gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#1677ff] flex items-center justify-center text-white text-xs font-bold">
            钉
          </div>
          <span className="text-sm font-semibold text-[#171a1d] hidden sm:inline">
            钉钉
          </span>
        </div>
        <div className="flex-1 max-w-xl mx-auto">
          <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-white border border-[#dde1e6] text-[#8f959e]">
            <Search size={14} />
            <span className="text-xs">搜索或提问</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#8f959e] shrink-0">
          <button
            type="button"
            className="p-1.5 hover:bg-[#e8eaed] rounded"
            aria-label="更多"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside
          className="w-[56px] shrink-0 bg-[#1e2433] flex flex-col items-center py-2 gap-0.5"
          aria-label="钉钉主导航"
        >
          {RAIL_NAV.map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => handleNavClick(item.id)}
                className={`w-[44px] flex flex-col items-center justify-center py-2 rounded-lg transition-colors ${
                  active
                    ? item.plugin
                      ? 'bg-[#ff5e4d] text-white'
                      : 'bg-[#1677ff] text-white'
                    : 'text-[#8b95a8] hover:bg-[#2a3142] hover:text-white'
                }`}
              >
                <span className="mb-0.5">{item.icon}</span>
                <span className="text-[9px] font-medium leading-tight text-center px-0.5">
                  {item.label}
                </span>
              </button>
            );
          })}
          <div className="flex-1" />
          <button
            type="button"
            className="w-[44px] py-2 text-[#8b95a8] hover:text-white"
            title="添加"
          >
            <Plus size={20} />
          </button>
          <button
            type="button"
            className="w-[44px] py-2 mb-1 text-[#8b95a8] hover:text-white"
            title="更多"
          >
            <MoreHorizontal size={20} />
          </button>
        </aside>

        {showMessageList && (
          <aside className="w-[280px] shrink-0 bg-[#f5f6f8] border-r border-[#dde1e6] flex flex-col min-h-0">
            <div className="h-11 px-4 flex items-center border-b border-[#e8eaed]">
              <span className="text-sm font-semibold text-[#171a1d]">消息</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {MOCK_CHATS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`w-full text-left px-4 py-3 border-b border-[#e8eaed]/80 hover:bg-white transition-colors ${
                    c.active ? 'bg-white' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-[#171a1d] truncate">
                    {c.name}
                  </p>
                  <p className="text-xs text-[#8f959e] truncate mt-0.5">
                    {c.preview}
                  </p>
                </button>
              ))}
            </div>
          </aside>
        )}

        {showOnboardingSidebar && (
          <aside className="w-[240px] shrink-0 bg-[#f5f6f8] border-r border-[#dde1e6] flex flex-col min-h-0 hidden lg:flex">
            <div className="h-11 px-4 flex items-center border-b border-[#e8eaed] gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1677ff] to-[#4096ff] text-white text-xs font-bold flex items-center justify-center">
                和
              </div>
              <span className="text-sm font-semibold text-[#171a1d]">
                新人入职平台
              </span>
            </div>
            <div className="p-4 text-xs text-[#646a73] leading-relaxed space-y-3">
              {onboardingStep === 'role_select' && (
                <p className="text-[#1677ff] font-bold">
                  先选身份，再进入对应闭环
                </p>
              )}
              {onboardingStep === 'intro' && (
                <p className="text-[#1677ff] font-bold">
                  了解平台能力后，登录并完成大礼包与团队介绍
                </p>
              )}
              <p>
                <span className="font-semibold text-[#171a1d]">应用简介</span>
                <br />
                和拍是面向新员工的入职融入与社交互助插件。
              </p>
              <p>
                <span className="font-semibold text-[#171a1d]">首次接入</span>
                <br />
                登录 → 大礼包 → 导师团队 → 入职盲盒
              </p>
              {firstRunDone && (
                <button
                  type="button"
                  onClick={replayFirstRun}
                  className="text-[#1677ff] hover:underline font-medium"
                >
                  重新体验首次接入
                </button>
              )}
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-white">
          {pluginEntered && (
            <div className="shrink-0 h-9 px-4 flex items-center justify-between bg-[#e6f4ff] border-b border-[#91caff] text-xs">
              <span className="text-[#0958d9] font-medium">
                钉钉插件 · 和拍新人入职互助平台
              </span>
              <button
                type="button"
                onClick={exitPlugin}
                className="text-[#1677ff] hover:underline font-medium"
              >
                返回插件说明
              </button>
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={pluginFrameKey}
                className="h-full"
                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.22 }}
              >
                {renderMain()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
