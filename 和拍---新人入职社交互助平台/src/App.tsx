/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import BlindBoxView from './components/BlindBoxView';
import WorkplaceView from './components/WorkplaceView';
import LunchMatchView from './components/LunchMatchView';
import InterestMatchView from './components/InterestMatchView';
import MyDeskView from './components/MyDeskView';
import FlashStarView from './components/FlashStarView';
import MentorChatView from './components/MentorChatView';
import AiHrFloatingEntry from './components/AiHrFloatingEntry';
import type { MentorDto } from './api/types';
import HRDashboard from './components/HRDashboard';
import HrOnboardingRegisterView from './components/HrOnboardingRegisterView';
import MentorsView from './components/MentorsView';
import MentorHubView from './components/MentorHubView';
import AIHRChatView from './components/AIHRChatView';
import RoleGateView from './components/RoleGateView';
import PortalLoginView from './components/PortalLoginView';
import WelcomeGiftModal from './components/dingtalk/WelcomeGiftModal';
import WelcomeTeamPanel from './components/dingtalk/WelcomeTeamPanel';
import SystemStatusBar from './components/SystemStatusBar';
import { markPluginFirstRunComplete } from './utils/firstRunStorage';
import NotificationBell from './components/NotificationBell';
import DingTalkDesktopShell from './components/dingtalk/DingTalkDesktopShell';
import DingTalkPilotBootstrap from './components/DingTalkPilotBootstrap';
import {
  DingTalkShellProvider,
  useDingTalkShell,
} from './context/DingTalkShellContext';
import { isDingTalkEmbedMode } from './utils/dingtalkRuntime';
import { hepaiApi } from './api/hepaiApi';
import {
  PrototypeProvider,
  defaultViewForRole,
  usePrototype,
} from './context/PrototypeContext';
import { useAuthSessionScope } from './hooks/useAuthSessionScope';
import { AppView, UserType } from './types';

type NewcomerNavItem = {
  id: AppView;
  label: string;
};

const NEWCOMER_NAV: NewcomerNavItem[] = [
  { id: 'blindbox', label: '入职盲盒' },
  { id: 'workplace', label: '安全屋' },
  { id: 'my_desk', label: '我的工位' },
  { id: 'lunch', label: '蹭饭地图' },
  { id: 'mentors', label: '带教导师' },
];

/** 新人登录后的接入阶段：大礼包 → 团队介绍 → 功能页 */
type NewcomerOnboardingPhase = 'login' | 'gift' | 'team' | 'portal';

function AppShell() {
  const { entryRole, setEntryRole, exitPlugin, embedded } = useDingTalkShell();
  const [newcomerAuthed, setNewcomerAuthed] = useState(false);
  const [onboardingPhase, setOnboardingPhase] =
    useState<NewcomerOnboardingPhase>('login');

  const resetNewcomerOnboarding = () => {
    setNewcomerAuthed(false);
    setOnboardingPhase('login');
  };

  const handleEntrySelect = (role: UserType) => {
    hepaiApi.logout();
    resetNewcomerOnboarding();
    setEntryRole(role);
  };

  const handleExitToGate = () => {
    hepaiApi.logout();
    resetNewcomerOnboarding();
    exitPlugin();
  };

  if (!entryRole) {
    return <RoleGateView onSelect={handleEntrySelect} />;
  }

  if (entryRole === 'mentor') {
    return <MentorPortal onExit={handleExitToGate} />;
  }

  if (entryRole === 'hr') {
    return <HRPortal onExit={handleExitToGate} />;
  }

  if (!newcomerAuthed) {
    return (
      <PortalLoginView
        portalRole="newcomer"
        onBack={() => {
          hepaiApi.logout();
          resetNewcomerOnboarding();
          setEntryRole(null);
        }}
        onSuccess={(res) => {
          setNewcomerAuthed(true);
          setOnboardingPhase(res.show_welcome_gift ? 'gift' : 'portal');
        }}
      />
    );
  }

  if (onboardingPhase === 'team') {
    return (
      <WelcomeTeamPanel
        fullScreen={embedded}
        onContinue={() => {
          markPluginFirstRunComplete();
          setOnboardingPhase('portal');
        }}
      />
    );
  }

  if (onboardingPhase === 'portal') {
    return <NewcomerPortal onExit={handleExitToGate} />;
  }

  return (
    <WelcomeGiftModal
      open={onboardingPhase === 'gift'}
      onReceive={() => setOnboardingPhase('team')}
      onDismiss={() => setOnboardingPhase('team')}
    />
  );
}

/** 新人模块：8 题盲盒 + 安全屋 / 蹭饭 / 导师 / AI HR */
function NewcomerPortal({ onExit }: { onExit: () => void }) {
  const {
    onboardingDone,
    resetOnboarding,
    refreshFromServer,
    apiError,
    apiLoading,
    sessionReady,
  } = usePrototype();
  const [view, setView] = useState<AppView>('blindbox');
  const [subReturnView, setSubReturnView] = useState<AppView>('workplace');
  const [booting, setBooting] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [mentorChat, setMentorChat] = useState<{
    peerId: string;
    peerName: string;
    peerAvatar: string | null;
    returnView: AppView;
  } | null>(null);
  const { sessionEpoch } = useAuthSessionScope();

  useEffect(() => {
    setMentorChat(null);
  }, [sessionEpoch]);

  const openMentorChat = (mentor: MentorDto, returnView: AppView = 'workplace') => {
    setMentorChat({
      peerId: mentor.id,
      peerName: mentor.name,
      peerAvatar: mentor.avatar_url,
      returnView,
    });
    setView('mentor_chat');
  };

  useEffect(() => {
    (async () => {
      setBooting(true);
      await refreshFromServer();
      setBooting(false);
    })();
  }, [refreshFromServer]);

  useEffect(() => {
    if (!sessionReady || booting) return;
    if (!onboardingDone) {
      setView('blindbox');
      return;
    }
    setView(defaultViewForRole('newcomer', true));
  }, [onboardingDone, sessionReady, booting]);

  const handleRetakeBlindbox = async () => {
    setResetting(true);
    try {
      await resetOnboarding();
      setView('blindbox');
    } finally {
      setResetting(false);
    }
  };

  /** 未完成盲盒时仅「入职盲盒」；完成后隐藏盲盒入口（重答在顶栏） */
  const visibleNav = NEWCOMER_NAV.filter((item) => {
    if (!onboardingDone) return item.id === 'blindbox';
    return item.id !== 'blindbox';
  });

  const renderView = () => {
    if (booting || !sessionReady) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm font-mono text-slate-500 animate-pulse">
            正在同步入职状态（SQLite）…
          </p>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">
            未完成 8 题将自动进入「入职盲盒」
          </p>
        </div>
      );
    }
    if (!onboardingDone) {
      return (
        <BlindBoxView
          onComplete={async () => {
            await refreshFromServer();
            setView('workplace');
          }}
        />
      );
    }
    switch (view) {
      case 'blindbox':
        return (
          <BlindBoxView
            onComplete={async () => {
              await refreshFromServer();
              setView('workplace');
            }}
          />
        );
      case 'workplace':
        return (
          <WorkplaceView
            onNavigateToMatch={() => {
              setSubReturnView('workplace');
              setView('lunch');
            }}
            onNavigateToMentors={() => setView('mentors')}
            onNavigateToFlashStar={() => {
              setSubReturnView('workplace');
              setView('flash_star');
            }}
            onNavigateToMyDesk={() => setView('my_desk')}
            onOpenMentorChat={(m) => openMentorChat(m, 'workplace')}
          />
        );
      case 'my_desk':
        return (
          <MyDeskView
            onOpenFlashStar={() => {
              setSubReturnView('my_desk');
              setView('flash_star');
            }}
            onOpenLunch={() => {
              setSubReturnView('my_desk');
              setView('lunch');
            }}
            onOpenMentors={() => setView('mentors')}
          />
        );
      case 'mentor_chat':
        return mentorChat ? (
          <MentorChatView
            peerId={mentorChat.peerId}
            peerName={mentorChat.peerName}
            peerAvatar={mentorChat.peerAvatar}
            viewerRole="newcomer"
            onBack={() => {
              setView(mentorChat.returnView);
              setMentorChat(null);
            }}
          />
        ) : (
          <MentorsView onOpenMentorChat={(m) => openMentorChat(m, 'mentors')} />
        );
      case 'flash_star':
        return <FlashStarView onBack={() => setView(subReturnView)} />;
      case 'lunch':
        return (
          <LunchMatchView
            onBack={() => setView(subReturnView)}
            onOpenInterest={() => setView('interest')}
            onOpenMyDesk={() => setView('my_desk')}
          />
        );
      case 'interest':
        return <InterestMatchView onBack={() => setView('lunch')} />;
      case 'mentors':
        return (
          <MentorsView onOpenMentorChat={(m) => openMentorChat(m, 'mentors')} />
        );
      case 'ai_hr':
        return <AIHRChatView userRole="newcomer" autoFocusChat />;
      default:
        return <BlindBoxView onComplete={() => setView('workplace')} />;
    }
  };

  const showAiHrFloat =
    onboardingDone &&
    sessionReady &&
    !booting &&
    view !== 'blindbox' &&
    view !== 'ai_hr' &&
    view !== 'interest' &&
    view !== 'mentor_chat';

  return (
    <>
    <PortalLayout
      title="新人入职互助"
      subtitle={
        onboardingDone ? '盲盒已完成 · 新人模块' : '待完成 8 题人格测试'
      }
      onExit={onExit}
      exitLabel="切换身份"
      topNav={
        onboardingDone ? (
          <NewcomerTopNav
            items={visibleNav}
            activeView={view}
            onSelect={setView}
            onRetake={() => void handleRetakeBlindbox()}
            retakeDisabled={resetting || apiLoading}
            retakeLabel={resetting ? '重置中…' : '重新答题'}
          />
        ) : undefined
      }
      footerTag={`新人 · ${view}`}
      apiError={apiError}
      notificationBell={
        onboardingDone && sessionReady && !booting ? (
          <NotificationBell
            handlers={{
              onMentorReply: (peerId, peerName) =>
                openMentorChat(
                  {
                    id: peerId,
                    name: peerName,
                    avatar_url: null,
                    role: 'mentor',
                    status: 'available',
                    type: 'main',
                  },
                  view === 'mentor_chat' ? 'mentors' : view,
                ),
              onLunchMatched: () => setView('lunch'),
              onInterestMatched: () => setView('interest'),
            }}
          />
        ) : undefined
      }
    >
      {renderView()}
    </PortalLayout>
    {showAiHrFloat && (
      <AiHrFloatingEntry
        onClick={() => setView('ai_hr')}
        active={view === 'ai_hr'}
      />
    )}
    </>
  );
}

/** 导师独立看板：工号密码登录后进入 */
function MentorPortal({ onExit }: { onExit: () => void }) {
  const { sessionEpoch } = useAuthSessionScope();
  const [menteeChat, setMenteeChat] = useState<{
    user_id: string;
    nickname: string;
  } | null>(null);

  useEffect(() => {
    setMenteeChat(null);
  }, [sessionEpoch]);

  const notificationBell = (
    <NotificationBell
      handlers={{
        onMentorReply: (peerId, peerName) =>
          setMenteeChat({ user_id: peerId, nickname: peerName }),
      }}
    />
  );

  return (
    <PortalWithLogin
      portalRole="mentor"
      title="导师工作台"
      subtitle="带教管理 · 已登录"
      footerTag={menteeChat ? '导师 · 对话' : '导师 · mentor_hub'}
      onExit={onExit}
      notificationBell={notificationBell}
    >
      {menteeChat ? (
        <MentorChatView
          peerId={menteeChat.user_id}
          peerName={menteeChat.nickname}
          viewerRole="mentor"
          onBack={() => setMenteeChat(null)}
        />
      ) : (
        <MentorHubView
          onOpenMenteeChat={(u) =>
            setMenteeChat({ user_id: u.user_id, nickname: u.nickname })
          }
        />
      )}
    </PortalWithLogin>
  );
}

/** HR 独立看板：工号密码登录后进入 */
function HRPortal({ onExit }: { onExit: () => void }) {
  const [hrView, setHrView] = useState<'dashboard' | 'onboarding'>('dashboard');

  return (
    <PortalWithLogin
      portalRole="hr"
      title={hrView === 'dashboard' ? 'HR 数智看板' : 'HR · 入职准备'}
      subtitle={
        hrView === 'dashboard'
          ? '批次融入 · 风险干预 · 已登录'
          : '录入待入职员工 · 工号开通'
      }
      footerTag={hrView === 'dashboard' ? 'HR · dashboard' : 'HR · onboarding'}
      onExit={onExit}
      headerExtra={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setHrView('dashboard')}
            className={`text-[10px] font-medium px-3 py-1.5 rounded-lg border ${
              hrView === 'dashboard'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            运营看板
          </button>
          <button
            type="button"
            onClick={() => setHrView('onboarding')}
            className={`text-[10px] font-medium px-3 py-1.5 rounded-lg border ${
              hrView === 'onboarding'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            入职准备
          </button>
        </div>
      }
    >
      {hrView === 'dashboard' ? (
        <HRDashboard />
      ) : (
        <HrOnboardingRegisterView />
      )}
    </PortalWithLogin>
  );
}

function PortalWithLogin({
  portalRole,
  title,
  subtitle,
  footerTag,
  onExit,
  notificationBell,
  headerExtra,
  children,
}: {
  portalRole: 'mentor' | 'hr';
  title: string;
  subtitle: string;
  footerTag: string;
  onExit: () => void;
  notificationBell?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const me = await hepaiApi.getUsersMe();
        if (me.role === portalRole) {
          setAuthed(true);
          setDisplayName(me.nickname);
        } else {
          hepaiApi.logout();
        }
      } catch {
        hepaiApi.logout();
      } finally {
        setChecking(false);
      }
    })();
  }, [portalRole]);

  const handleExit = () => {
    hepaiApi.logout();
    onExit();
  };

  const { embedded } = useDingTalkShell();

  if (checking) {
    return (
      <div
        className={`flex items-center justify-center font-mono text-slate-500 animate-pulse ${
          embedded ? 'h-full min-h-[200px]' : 'min-h-screen'
        }`}
      >
        校验登录状态…
      </div>
    );
  }

  if (!authed) {
    return (
      <PortalLoginView
        portalRole={portalRole}
        onBack={handleExit}
        onSuccess={async () => {
          const me = await hepaiApi.getUsersMe();
          setDisplayName(me.nickname);
          setAuthed(true);
        }}
      />
    );
  }

  return (
    <PortalLayout
      title={title}
      subtitle={`${subtitle}${displayName ? ` · ${displayName}` : ''}`}
      onExit={handleExit}
      exitLabel="退出并切换身份"
      footerTag={footerTag}
      headerExtra={headerExtra}
      notificationBell={notificationBell}
    >
      {children}
    </PortalLayout>
  );
}

function PortalLayout({
  title,
  subtitle,
  onExit,
  exitLabel,
  headerExtra,
  notificationBell,
  topNav,
  footerTag,
  apiError,
  children,
}: {
  title: string;
  subtitle: string;
  onExit: () => void;
  exitLabel: string;
  headerExtra?: React.ReactNode;
  notificationBell?: React.ReactNode;
  topNav?: React.ReactNode;
  footerTag: string;
  apiError?: string | null;
  children: React.ReactNode;
}) {
  const { embedded } = useDingTalkShell();

  return (
    <div
      className={`font-sans flex flex-col ${
        embedded ? 'h-full min-h-0' : 'min-h-screen'
      }`}
    >
      <header className="ding-app-header relative z-50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 shrink-0 bg-primary rounded-md flex items-center justify-center font-semibold text-on-primary text-xs">
            和
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-medium text-on-surface truncate leading-tight">
              和拍 · {title}
            </h1>
            <p className="text-[11px] text-on-surface-variant truncate leading-tight mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onExit}
            className="px-2 py-1 text-xs text-[#1677ff] hover:bg-[#e6f4ff] rounded transition-colors flex items-center gap-0.5"
          >
            <ArrowLeft size={12} />
            {exitLabel}
          </button>
          {headerExtra}
          {notificationBell}
        </div>
      </header>

      {topNav && (
        <div className="shrink-0 bg-surface">{topNav}</div>
      )}

      <main
        className={`flex-1 overflow-y-auto p-4 lg:px-6 min-h-0 max-w-[1600px] w-full mx-auto ${
          embedded ? '' : 'min-h-0'
        }`}
      >
        {apiError && (
          <p className="mb-4 max-w-6xl mx-auto px-4 py-3 bg-error-container text-error rounded-xl text-sm border border-rose-200">
            {apiError.includes('未登录')
              ? `同步失败：${apiError}。请重新进入「我是新人」完成登录，或运行 npm run dev:stack 启动后端。`
              : `API: ${apiError} — 请确认后端已在 http://localhost:8080 运行（npm run dev:stack）`}
          </p>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={footerTag}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="max-w-6xl mx-auto w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="h-8 shrink-0 bg-surface text-on-surface-variant flex flex-row items-center justify-center gap-2 px-3 border-t border-outline text-[11px]">
        <span className="text-[11px] text-on-surface-variant shrink-0">{footerTag}</span>
        <SystemStatusBar />
      </footer>
    </div>
  );
}

function DingTalkEmbedRoot() {
  const [entryRole, setEntryRole] = useState<UserType | null>(null);
  return (
    <DingTalkShellProvider
      embedded
      exitPlugin={() => setEntryRole(null)}
      entryRole={entryRole}
      setEntryRole={setEntryRole}
    >
      <DingTalkPilotBootstrap>
        <AppShell />
      </DingTalkPilotBootstrap>
    </DingTalkShellProvider>
  );
}

export default function App() {
  const dingtalkEmbed = isDingTalkEmbedMode();

  return (
    <PrototypeProvider>
      {dingtalkEmbed ? (
        <DingTalkEmbedRoot />
      ) : (
        <DingTalkDesktopShell>
          <AppShell />
        </DingTalkDesktopShell>
      )}
    </PrototypeProvider>
  );
}

const NewcomerTopNav: React.FC<{
  items: NewcomerNavItem[];
  activeView: AppView;
  onSelect: (view: AppView) => void;
  onRetake: () => void;
  retakeDisabled?: boolean;
  retakeLabel: string;
}> = ({
  items,
  activeView,
  onSelect,
  onRetake,
  retakeDisabled,
  retakeLabel,
}) => (
  <div className="flex items-stretch border-b border-outline bg-surface">
    <nav
      className="ding-tab-bar flex-1 overflow-x-auto border-b-0 px-2"
      aria-label="功能导航"
    >
      {items.map((item) => {
        const active = activeView === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`ding-tab ${active ? 'ding-tab-active' : ''}`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
    <button
      type="button"
      disabled={retakeDisabled}
      onClick={onRetake}
      className="shrink-0 self-center mr-2 px-2 py-1 text-[11px] text-[#8f959e] hover:text-[#1677ff] disabled:opacity-40 transition-colors"
    >
      {retakeLabel}
    </button>
  </div>
);
