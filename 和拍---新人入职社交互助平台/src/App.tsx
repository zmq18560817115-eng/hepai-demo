/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  LayoutDashboard,
  Utensils,
  MessageSquare,
  Bot,
  BarChart3,
  Users,
  Sparkles,
} from 'lucide-react';
import BlindBoxView from './components/BlindBoxView';
import WorkplaceView from './components/WorkplaceView';
import LunchMatchView from './components/LunchMatchView';
import HRDashboard from './components/HRDashboard';
import MentorsView from './components/MentorsView';
import MentorHubView from './components/MentorHubView';
import AIHRChatView from './components/AIHRChatView';
import { hepaiApi } from './api/hepaiApi';
import {
  PrototypeProvider,
  defaultViewForRole,
  usePrototype,
} from './context/PrototypeContext';
import { AppView, UserType } from './types';

const ROLE_AUTH_CODE: Record<UserType, string> = {
  newcomer: 'dev_newcomer',
  mentor: 'dev_mentor',
  hr: 'dev_hr',
};

type NavItem = {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  roles: UserType[];
  requiresOnboarding?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: 'workplace',
    label: '安全屋',
    icon: <LayoutDashboard size={18} />,
    roles: ['newcomer'],
    requiresOnboarding: true,
  },
  {
    id: 'lunch',
    label: '蹭饭地图',
    icon: <Utensils size={18} />,
    roles: ['newcomer'],
    requiresOnboarding: true,
  },
  {
    id: 'mentors',
    label: '带教导师',
    icon: <MessageSquare size={18} />,
    roles: ['newcomer'],
    requiresOnboarding: true,
  },
  {
    id: 'ai_hr',
    label: 'AI HR 助手',
    icon: <Bot size={18} />,
    roles: ['newcomer', 'mentor', 'hr'],
    requiresOnboarding: false,
  },
  {
    id: 'mentor_hub',
    label: '导师工作台',
    icon: <Users size={18} />,
    roles: ['mentor'],
  },
  {
    id: 'hr',
    label: 'HR 数智看板',
    icon: <BarChart3 size={18} />,
    roles: ['hr'],
  },
];

function AppShell() {
  const { onboardingDone, resetOnboarding, refreshFromServer } = usePrototype();
  const [userRole, setUserRole] = useState<UserType>('newcomer');
  const [view, setView] = useState<AppView>(() =>
    defaultViewForRole('newcomer', onboardingDone),
  );
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    hepaiApi.loginDingtalk(ROLE_AUTH_CODE.newcomer).then(() => refreshFromServer());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setView(defaultViewForRole(userRole, onboardingDone));
  }, [userRole, onboardingDone]);

  const handleRoleChange = async (role: UserType) => {
    setAuthLoading(true);
    try {
      await hepaiApi.loginDingtalk(ROLE_AUTH_CODE[role]);
      setUserRole(role);
      await refreshFromServer();
    } catch (e) {
      console.error('角色切换登录失败', e);
    } finally {
      setAuthLoading(false);
    }
  };

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (!item.roles.includes(userRole)) return false;
    if (item.requiresOnboarding && userRole === 'newcomer' && !onboardingDone) {
      return false;
    }
    return true;
  });

  const showSidebar =
    !(userRole === 'newcomer' && !onboardingDone) || view === 'ai_hr';

  const renderView = () => {
    if (userRole === 'newcomer' && !onboardingDone && view !== 'ai_hr') {
      return <BlindBoxView onComplete={() => setView('workplace')} />;
    }

    switch (view) {
      case 'blindbox':
        return <BlindBoxView onComplete={() => setView('workplace')} />;
      case 'workplace':
        return (
          <WorkplaceView
            onNavigateToMatch={() => setView('lunch')}
            onNavigateToMentors={() => setView('mentors')}
            onNavigateToAiHr={() => setView('ai_hr')}
          />
        );
      case 'lunch':
        return <LunchMatchView onBack={() => setView('workplace')} />;
      case 'mentors':
        return <MentorsView />;
      case 'mentor_hub':
        return <MentorHubView />;
      case 'hr':
        return <HRDashboard />;
      case 'ai_hr':
        return <AIHRChatView userRole={userRole} />;
      default:
        return <BlindBoxView onComplete={() => setView('workplace')} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      <header className="h-16 shrink-0 border-b-2 border-slate-900 bg-white flex items-center justify-between px-6 lg:px-10 z-50">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-indigo-600 flex items-center justify-center font-black text-white text-lg border-2 border-slate-900 shadow-neo">
            和
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              和拍 · 新人入职社交互助平台
            </h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} className="text-indigo-500" />
              电脑端工作台 · 企业版
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 border-2 border-slate-900 p-1 bg-slate-50">
            <RoleTab
              label="新人"
              active={userRole === 'newcomer'}
              disabled={authLoading}
              onClick={() => handleRoleChange('newcomer')}
            />
            <RoleTab
              label="导师"
              active={userRole === 'mentor'}
              disabled={authLoading}
              onClick={() => handleRoleChange('mentor')}
            />
            <RoleTab
              label="HR"
              active={userRole === 'hr'}
              disabled={authLoading}
              onClick={() => handleRoleChange('hr')}
            />
          </div>
          <button type="button" className="text-slate-400 hover:text-indigo-600 p-2">
            <Bell size={20} strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 max-w-[1600px] w-full mx-auto">
        {showSidebar && (
          <aside className="w-56 shrink-0 border-r-2 border-slate-900 bg-white hidden md:flex flex-col">
            <p className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
              功能导航
            </p>
            <nav className="flex-1 p-3 space-y-1">
              {visibleNav.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={view === item.id}
                  highlight={item.id === 'ai_hr'}
                  onClick={() => setView(item.id)}
                />
              ))}
            </nav>
            {userRole === 'newcomer' && onboardingDone && (
              <button
                type="button"
                onClick={resetOnboarding}
                className="m-3 text-[10px] font-mono text-slate-400 underline text-left"
              >
                重置盲盒演示
              </button>
            )}
          </aside>
        )}

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-slate-50/50 min-h-[calc(100vh-4rem)]">
          {showSidebar && (
            <div className="md:hidden flex gap-2 mb-4 overflow-x-auto pb-2">
              {visibleNav.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={`shrink-0 px-3 py-2 text-xs font-black border-2 border-slate-900 ${
                    view === item.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${userRole}-${view}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="max-w-6xl mx-auto w-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <footer className="h-8 shrink-0 border-t border-slate-200 bg-slate-900 text-white flex items-center justify-center font-mono text-[10px] uppercase tracking-widest">
        和拍 desktop · {view} · {userRole}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <PrototypeProvider>
      <AppShell />
    </PrototypeProvider>
  );
}

function RoleTab({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 text-xs font-black transition-all disabled:opacity-40 ${
        active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-white'
      }`}
    >
      {label}
    </button>
  );
}

const SidebarNavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  highlight?: boolean;
  onClick: () => void;
}> = ({ icon, label, active, highlight, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 text-left text-sm font-bold border-2 transition-all ${
        active
          ? 'bg-indigo-600 text-white border-slate-900 shadow-neo'
          : highlight
            ? 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:border-slate-900'
            : 'bg-white text-slate-700 border-transparent hover:border-slate-900 hover:shadow-neo'
      }`}
    >
      {icon}
      <span>{label}</span>
      {highlight && !active && (
        <span className="ml-auto text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 font-black">
          AI
        </span>
      )}
    </button>
);
