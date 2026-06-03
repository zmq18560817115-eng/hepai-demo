/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 统一 API 入口：VITE_USE_MOCK_API=true 时走 mock，否则请求后端。
 */

import { apiRequest, setAccessToken } from './client';
import { USE_MOCK_API } from './config';
import { bindAuthUser, clearAuthSession } from './sessionScope';
import * as mock from './mock';
import { buildDeskPayload } from '../utils/buildDeskItems';
import type {
  AuthUser,
  HrAlert,
  HrDashboardStats,
  HrMoodTrendPoint,
  LoginResponse,
  LunchStatusResponse,
  MentorAssigneeDto,
  MentorDto,
  MoodLogResponse,
  MyDeskResponse,
  OnboardingStatus,
  PersonaDto,
  QuizSubmitAnswer,
  QuizSubmitResponse,
  WorkplaceResponse,
} from './types';

export const hepaiApi = {
  /** 钉钉登录；开发可用 auth_code: dev_newcomer | dev_mentor | dev_hr */
  /** 导师 / HR 工号密码登录 */
  async loginPortal(
    username: string,
    password: string,
    role: 'mentor' | 'hr' | 'newcomer',
  ): Promise<LoginResponse> {
    if (USE_MOCK_API) {
      const res = mock.mockLoginPortal(username, password, role);
      setAccessToken(res.access_token);
      bindAuthUser(res.user.id);
      return res;
    }
    const res = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    });
    setAccessToken(res.access_token);
    bindAuthUser(res.user.id);
    return res;
  },

  async loginDingtalk(authCode: string): Promise<LoginResponse> {
    if (USE_MOCK_API) {
      const res = mock.mockLogin(authCode);
      setAccessToken(res.access_token);
      bindAuthUser(res.user.id);
      return res;
    }
    const res = await apiRequest<LoginResponse>('/auth/dingtalk', {
      method: 'POST',
      body: JSON.stringify({ auth_code: authCode }),
    });
    setAccessToken(res.access_token);
    bindAuthUser(res.user.id);
    return res;
  },

  async getUsersMe(): Promise<AuthUser> {
    if (USE_MOCK_API) {
      const u = mock.mockGetUsersMe();
      bindAuthUser(u.id);
      return u;
    }
    const u = await apiRequest<AuthUser>('/users/me');
    bindAuthUser(u.id);
    return u;
  },

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    if (USE_MOCK_API) return mock.mockGetOnboardingStatus();
    return apiRequest<OnboardingStatus>('/onboarding/status');
  },

  async resetOnboarding(): Promise<{ reset: boolean; message?: string }> {
    if (USE_MOCK_API) {
      mock.mockReset();
      return { reset: true, message: 'Mock 已重置盲盒' };
    }
    return apiRequest<{ reset: boolean; message?: string }>(
      '/onboarding/reset',
      { method: 'POST' },
    );
  },

  async getQuizOnboarding() {
    if (USE_MOCK_API) return mock.mockGetQuizOnboarding();
    return apiRequest<{ questions: import('./types').QuizQuestionDto[] }>(
      '/quiz/onboarding',
    );
  },

  async submitQuiz(answers: QuizSubmitAnswer[]): Promise<QuizSubmitResponse> {
    if (USE_MOCK_API) return mock.mockSubmitQuiz(answers);
    return apiRequest<QuizSubmitResponse>('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  async getPersonaMe(): Promise<PersonaDto> {
    if (USE_MOCK_API) return mock.mockGetPersonaMe();
    return apiRequest<PersonaDto>('/personas/me');
  },

  async getWorkplace(): Promise<WorkplaceResponse> {
    if (USE_MOCK_API) return mock.mockGetWorkplace();
    return apiRequest<WorkplaceResponse>('/workplace');
  },

  async getFlashJar(): Promise<import('./types').FlashJarResponse> {
    if (USE_MOCK_API) return mock.mockGetFlashJar();
    return apiRequest<import('./types').FlashJarResponse>('/mood/flash-jar');
  },

  async getDeskRewards(): Promise<import('./types').DeskRewardsResponse> {
    if (USE_MOCK_API) return mock.mockGetDeskRewards();
    return apiRequest<import('./types').DeskRewardsResponse>('/desk/rewards');
  },

  async getMyDesk(): Promise<MyDeskResponse> {
    if (USE_MOCK_API) return mock.mockGetMyDesk();
    const [wp, flash, lunch, interest, deskRewards] = await Promise.all([
      this.getWorkplace(),
      this.getFlashJar(),
      this.getLunchStatus(),
      this.getInterestStatus(),
      this.getDeskRewards(),
    ]);
    return buildDeskPayload(
      wp,
      flash.items,
      lunch,
      interest,
      deskRewards.rewards,
    );
  },

  async postMood(body: {
    energy_level: number;
    log_text?: string;
  }): Promise<MoodLogResponse> {
    if (USE_MOCK_API) return mock.mockPostMood(body);
    return apiRequest<MoodLogResponse>('/mood', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async patchMoodEnergy(energy_level: number) {
    if (USE_MOCK_API) return mock.mockPatchMoodEnergy(energy_level);
    return apiRequest<{ energy_level: number; updated_at: string }>(
      '/mood/energy',
      {
        method: 'PATCH',
        body: JSON.stringify({ energy_level }),
      },
    );
  },

  async getMentors(): Promise<{ mentors: MentorDto[] }> {
    if (USE_MOCK_API) return mock.mockGetMentors();
    return apiRequest<{ mentors: MentorDto[] }>('/mentors');
  },

  async getMentorChatInbox(): Promise<{ items: import('./types').MentorChatInboxItem[] }> {
    if (USE_MOCK_API) return mock.mockGetMentorChatInbox();
    return apiRequest<{ items: import('./types').MentorChatInboxItem[] }>(
      '/mentor-chat/inbox',
    );
  },

  async getMentorChat(peerId: string): Promise<import('./types').MentorChatThreadResponse> {
    if (USE_MOCK_API) return mock.mockGetMentorChat(peerId);
    return apiRequest<import('./types').MentorChatThreadResponse>(
      `/mentor-chat/with/${encodeURIComponent(peerId)}`,
    );
  },

  async getNotifications(unreadOnly = false) {
    const q = unreadOnly ? '?unread_only=true' : '';
    if (USE_MOCK_API) return mock.mockGetNotifications(unreadOnly);
    return apiRequest<import('./types').NotificationsResponse>(
      `/notifications${q}`,
    );
  },

  async markNotificationRead(id: string) {
    if (USE_MOCK_API) return mock.mockMarkNotificationRead(id);
    return apiRequest<{ read: boolean }>(
      `/notifications/${encodeURIComponent(id)}/read`,
      { method: 'PATCH' },
    );
  },

  async markAllNotificationsRead() {
    if (USE_MOCK_API) return mock.mockMarkAllNotificationsRead();
    return apiRequest<{ read: boolean }>('/notifications/read-all', {
      method: 'POST',
    });
  },

  async postMentorChatMessage(
    peerId: string,
    content: string,
  ): Promise<{ message: import('./types').MentorChatMessage }> {
    if (USE_MOCK_API) return mock.mockPostMentorChatMessage(peerId, content);
    return apiRequest<{ message: import('./types').MentorChatMessage }>(
      `/mentor-chat/with/${encodeURIComponent(peerId)}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
    );
  },

  async getLunchVenues() {
    if (USE_MOCK_API) return mock.mockGetLunchVenues();
    return apiRequest<ReturnType<typeof mock.mockGetLunchVenues>>('/lunch/venues');
  },

  async postLunchMatch(venue_id?: string) {
    if (USE_MOCK_API) return mock.mockPostLunchMatch(venue_id);
    return apiRequest<{ request_id: string; status: string; created_at: string }>(
      '/lunch/match',
      {
        method: 'POST',
        body: JSON.stringify({ venue_id }),
      },
    );
  },

  async getLunchStatus(): Promise<LunchStatusResponse> {
    if (USE_MOCK_API) return mock.mockGetLunchStatus();
    return apiRequest<LunchStatusResponse>('/lunch/status');
  },

  async confirmLunchMatch(): Promise<LunchStatusResponse> {
    if (USE_MOCK_API) return mock.mockConfirmLunchMatch();
    return apiRequest<LunchStatusResponse>('/lunch/match/confirm', {
      method: 'POST',
    });
  },

  /** 从路线图页返回「匹配成功」卡片（保留当前搭子） */
  async backLunchMatch(): Promise<LunchStatusResponse> {
    if (USE_MOCK_API) return mock.mockBackLunchMatch();
    return apiRequest<LunchStatusResponse>('/lunch/match/back', {
      method: 'POST',
    });
  },

  async deleteLunchMatch(): Promise<void> {
    if (USE_MOCK_API) {
      mock.mockDeleteLunchMatch();
      return;
    }
    await apiRequest<void>('/lunch/match', { method: 'DELETE' });
  },

  async getInterestVenues() {
    if (USE_MOCK_API) return mock.mockGetInterestVenues();
    return apiRequest<ReturnType<typeof mock.mockGetInterestVenues>>(
      '/interest/venues',
    );
  },

  async postInterestMatch(venue_id?: string) {
    if (USE_MOCK_API) return mock.mockPostInterestMatch(venue_id);
    return apiRequest<{ request_id: string; status: string; created_at: string }>(
      '/interest/match',
      {
        method: 'POST',
        body: JSON.stringify({ venue_id }),
      },
    );
  },

  async getInterestStatus(): Promise<LunchStatusResponse> {
    if (USE_MOCK_API) return mock.mockGetInterestStatus();
    return apiRequest<LunchStatusResponse>('/interest/status');
  },

  async confirmInterestMatch(): Promise<LunchStatusResponse> {
    if (USE_MOCK_API) return mock.mockConfirmInterestMatch();
    return apiRequest<LunchStatusResponse>('/interest/match/confirm', {
      method: 'POST',
    });
  },

  async backInterestMatch(): Promise<LunchStatusResponse> {
    if (USE_MOCK_API) return mock.mockBackInterestMatch();
    return apiRequest<LunchStatusResponse>('/interest/match/back', {
      method: 'POST',
    });
  },

  async deleteInterestMatch(): Promise<void> {
    if (USE_MOCK_API) {
      mock.mockDeleteInterestMatch();
      return;
    }
    await apiRequest<void>('/interest/match', { method: 'DELETE' });
  },

  async getMentorAssignees(): Promise<{ assignees: MentorAssigneeDto[] }> {
    if (USE_MOCK_API) return mock.mockGetMentorAssignees();
    return apiRequest<{ assignees: MentorAssigneeDto[] }>('/mentor/assignees');
  },

  async getHrDashboardStats(
    batch_limit = 4,
    dept?: string,
  ): Promise<HrDashboardStats> {
    if (USE_MOCK_API) return mock.mockGetHrDashboardStats(dept);
    const deptQ = dept?.trim()
      ? `&dept=${encodeURIComponent(dept.trim())}`
      : '';
    return apiRequest<HrDashboardStats>(
      `/hr/dashboard/stats?batch_limit=${batch_limit}${deptQ}`,
    );
  },

  async getHrMoodTrends(
    opts?: { date?: string; dept?: string },
  ): Promise<{ points: HrMoodTrendPoint[] }> {
    if (USE_MOCK_API) return mock.mockGetHrMoodTrends(opts?.dept);
    const params = new URLSearchParams();
    if (opts?.date) params.set('date', opts.date);
    if (opts?.dept?.trim()) params.set('dept', opts.dept.trim());
    const q = params.toString() ? `?${params}` : '';
    return apiRequest<{ points: HrMoodTrendPoint[] }>(`/hr/mood/trends${q}`);
  },

  async getHrAlerts(
    limit = 20,
    query?: string,
  ): Promise<import('./types').HrAlertsResponse> {
    if (USE_MOCK_API) return mock.mockGetHrAlerts(query);
    const q = query?.trim() ? `&q=${encodeURIComponent(query.trim())}` : '';
    return apiRequest<import('./types').HrAlertsResponse>(
      `/hr/alerts?limit=${limit}${q}`,
    );
  },

  async searchHrNewcomers(
    query: string,
    page = 1,
    pageSize = 20,
  ): Promise<import('./types').HrSearchResponse> {
    if (USE_MOCK_API) return mock.mockSearchHrNewcomers(query, page, pageSize);
    const q = encodeURIComponent(query.trim());
    return apiRequest<import('./types').HrSearchResponse>(
      `/hr/newcomers/search?q=${q}&page=${page}&page_size=${pageSize}`,
    );
  },

  async getSystemStatus(): Promise<import('./types').SystemStatusResponse> {
    if (USE_MOCK_API) return mock.mockGetSystemStatus();
    return apiRequest<import('./types').SystemStatusResponse>('/system/status');
  },

  async getAiHrSkill(
    role: import('../types').UserType = 'newcomer',
  ): Promise<import('./types').AiHrSkillMeta> {
    if (USE_MOCK_API) return mock.mockGetAiHrSkill(role);
    return apiRequest<import('./types').AiHrSkillMeta>('/ai/hr/skill');
  },

  async getAiHrHistory() {
    if (USE_MOCK_API) return mock.mockGetAiHrHistory();
    return apiRequest<import('./types').AiHrHistoryResponse>('/ai/hr/history');
  },

  async getAiHrGuidelines(query?: string) {
    if (USE_MOCK_API) return mock.mockGetAiHrGuidelines(query);
    const path = query
      ? `/ai/hr/guidelines?q=${encodeURIComponent(query)}`
      : '/ai/hr/guidelines';
    return apiRequest<import('./types').AiHrGuidelinesCatalog | import('./types').AiHrGuidelineSearchResponse>(path);
  },

  async postAiHrChat(message: string) {
    if (USE_MOCK_API) {
      return mock.mockPostAiHrChat(message);
    }
    return apiRequest<import('./types').AiHrChatResponse>('/ai/hr/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async clearAiHrHistory() {
    if (USE_MOCK_API) return mock.mockClearAiHrHistory();
    return apiRequest<{ cleared: boolean }>('/ai/hr/history', {
      method: 'DELETE',
    });
  },

  async postHrInterventions(alert_ids: string[], channel = 'hrbp') {
    if (USE_MOCK_API) return mock.mockPostHrInterventions(alert_ids);
    return apiRequest<{ sent: number; failed: number }>('/hr/interventions', {
      method: 'POST',
      body: JSON.stringify({ alert_ids, channel }),
    });
  },

  async getHrPendingNewcomers(): Promise<{
    items: import('./types').HrPendingNewcomerItem[];
    total: number;
  }> {
    if (USE_MOCK_API) return mock.mockGetHrPendingNewcomers();
    return apiRequest('/hr/onboarding/pending');
  },

  async registerHrNewcomer(body: {
    username: string;
    nickname: string;
    dept: string;
  }): Promise<import('./types').HrRegisterNewcomerResponse> {
    if (USE_MOCK_API) return mock.mockRegisterHrNewcomer(body);
    return apiRequest('/hr/onboarding/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  logout() {
    setAccessToken(null);
    clearAuthSession();
    if (USE_MOCK_API) mock.mockLogout();
  },
};

export { personaDtoToUserPersona } from './mock';
