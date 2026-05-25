/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 统一 API 入口：VITE_USE_MOCK_API=true 时走 mock，否则请求后端。
 */

import { apiRequest, setAccessToken } from './client';
import { USE_MOCK_API } from './config';
import * as mock from './mock';
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
  OnboardingStatus,
  PersonaDto,
  QuizSubmitAnswer,
  QuizSubmitResponse,
  WorkplaceResponse,
} from './types';

export const hepaiApi = {
  /** 钉钉登录；开发可用 auth_code: dev_newcomer | dev_mentor | dev_hr */
  async loginDingtalk(authCode: string): Promise<LoginResponse> {
    if (USE_MOCK_API) {
      const res = mock.mockLogin(authCode);
      setAccessToken(res.access_token);
      return res;
    }
    const res = await apiRequest<LoginResponse>('/auth/dingtalk', {
      method: 'POST',
      body: JSON.stringify({ auth_code: authCode }),
    });
    setAccessToken(res.access_token);
    return res;
  },

  async getUsersMe(): Promise<AuthUser> {
    if (USE_MOCK_API) return mock.mockGetUsersMe();
    return apiRequest<AuthUser>('/users/me');
  },

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    if (USE_MOCK_API) return mock.mockGetOnboardingStatus();
    return apiRequest<OnboardingStatus>('/onboarding/status');
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

  async getLunchVenues() {
    if (USE_MOCK_API) return mock.mockGetLunchVenues();
    return apiRequest<ReturnType<typeof mock.mockGetLunchVenues>>('/lunch/venues');
  },

  async postLunchMatch(venue_id?: string) {
    if (USE_MOCK_API) return mock.mockPostLunchMatch();
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

  async deleteLunchMatch(): Promise<void> {
    if (USE_MOCK_API) {
      mock.mockDeleteLunchMatch();
      return;
    }
    await apiRequest<void>('/lunch/match', { method: 'DELETE' });
  },

  async getMentorAssignees(): Promise<{ assignees: MentorAssigneeDto[] }> {
    if (USE_MOCK_API) return mock.mockGetMentorAssignees();
    return apiRequest<{ assignees: MentorAssigneeDto[] }>('/mentor/assignees');
  },

  async getHrDashboardStats(batch_limit = 4): Promise<HrDashboardStats> {
    if (USE_MOCK_API) return mock.mockGetHrDashboardStats();
    return apiRequest<HrDashboardStats>(
      `/hr/dashboard/stats?batch_limit=${batch_limit}`,
    );
  },

  async getHrMoodTrends(date?: string): Promise<{ points: HrMoodTrendPoint[] }> {
    if (USE_MOCK_API) return mock.mockGetHrMoodTrends();
    const q = date ? `?date=${date}` : '';
    return apiRequest<{ points: HrMoodTrendPoint[] }>(`/hr/mood/trends${q}`);
  },

  async getHrAlerts(limit = 10): Promise<{ alerts: HrAlert[] }> {
    if (USE_MOCK_API) return mock.mockGetHrAlerts();
    return apiRequest<{ alerts: HrAlert[] }>(`/hr/alerts?limit=${limit}`);
  },

  async getAiHrHistory() {
    if (USE_MOCK_API) {
      return {
        session_id: null,
        messages: [] as import('./types').AiHrMessage[],
      };
    }
    return apiRequest<import('./types').AiHrHistoryResponse>('/ai/hr/history');
  },

  async postAiHrChat(message: string) {
    if (USE_MOCK_API) {
      const m = message.toLowerCase();
      let reply =
        '（前端 Mock 模式）请确认后端已启动且 VITE_USE_MOCK_API=false，才能获得丰富回复。';
      if (/面具|盲盒|人格|测试/.test(m)) {
        reply =
          '入职人格测试共 8 题，在「入职盲盒」完成。系统会生成你的专属人格面具（名称、标签、格言），用于对外社交，真实性格受保护约 30 天。';
      } else if (/焦虑|紧张|社恐/.test(m)) {
        reply =
          '入职焦虑很常见。建议：① 先完成人格测试获得面具；② 能量低时记「闪光时刻」；③ 用蹭饭地图轻量匹配，不必强行社交。';
      } else if (/午餐|蹭饭/.test(m)) {
        reply =
          '在「蹭饭地图」可发起匹配，系统按面具标签找饭搭子，见面用暗号、不见真实花名，压力更小。';
      } else if (/导师/.test(m)) {
        reply =
          '在「带教导师」查看状态灯，绿色表示可打扰。建议先发一句 5 分钟可完成的具体小问题。';
      }
      return { reply, role: 'newcomer' };
    }
    return apiRequest<import('./types').AiHrChatResponse>('/ai/hr/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async clearAiHrHistory() {
    if (USE_MOCK_API) return { cleared: true };
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

  logout() {
    setAccessToken(null);
    if (USE_MOCK_API) mock.mockReset();
  },
};

export { personaDtoToUserPersona } from './mock';
