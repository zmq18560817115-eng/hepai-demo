/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  generatePersonaFromAnswers,
  MOCK_MENTOR_ASSIGNEES,
  MOCK_MENTORS,
  QUIZ_QUESTIONS,
  type UserPersona,
} from '../types';
import type {
  AuthUser,
  HrAlert,
  HrDashboardStats,
  HrMoodTrendPoint,
  LoginResponse,
  LunchStatusResponse,
  LunchVenue,
  MentorAssigneeDto,
  MentorDto,
  MoodLogResponse,
  OnboardingStatus,
  PersonaDto,
  QuizQuestionDto,
  QuizSubmitResponse,
  WorkplaceResponse,
} from './types';

const MOCK_QUIZ_IDS = [
  'mock-q1',
  'mock-q2',
  'mock-q3',
  'mock-q4',
  'mock-q5',
  'mock-q6',
  'mock-q7',
  'mock-q8',
];

let mockPersona: PersonaDto | null = null;
let mockOnboardingDone = false;
let mockEnergy = 75;
let mockLunchStatus: LunchStatusResponse = { status: 'idle' };
let mockLunchTimer: ReturnType<typeof setTimeout> | null = null;

export function mockReset() {
  mockPersona = null;
  mockOnboardingDone = false;
  mockEnergy = 75;
  mockLunchStatus = { status: 'idle' };
  if (mockLunchTimer) clearTimeout(mockLunchTimer);
}

export function mockLogin(authCode: string): LoginResponse {
  const role =
    authCode === 'dev_mentor'
      ? 'mentor'
      : authCode === 'dev_hr'
        ? 'hr'
        : 'newcomer';
  return {
    access_token: `mock-token-${role}`,
    expires_in: 7200,
    user: {
      id: 'mock-user-id',
      username: 'E00001',
      nickname: '程序员小智',
      avatar_url:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
      role,
      onboarding_date: '2026-05-01',
      onboarding_completed: mockOnboardingDone,
      onboarding_days_left: 22,
    },
  };
}

export function mockGetUsersMe(): AuthUser {
  return {
    id: 'mock-user-id',
    username: 'E00001',
    nickname: '程序员小智',
    avatar_url:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
    role: 'newcomer',
    onboarding_date: '2026-05-01',
    onboarding_completed: mockOnboardingDone,
    onboarding_days_left: 22,
  };
}

export function mockGetOnboardingStatus(): OnboardingStatus {
  return {
    completed: mockOnboardingDone,
    persona_id: mockPersona?.id ?? null,
  };
}

export function mockGetQuizOnboarding(): { questions: QuizQuestionDto[] } {
  return {
    questions: QUIZ_QUESTIONS.map((q, i) => ({
      id: MOCK_QUIZ_IDS[i],
      text: q.question,
      options: q.options,
    })),
  };
}

export function mockSubmitQuiz(
  answers: { question_id: string; answer_value: string }[],
): QuizSubmitResponse {
  const values = answers.map((a) => a.answer_value);
  const p = generatePersonaFromAnswers(values);
  mockPersona = {
    id: 'mock-persona-id',
    name: p.role,
    tags: p.tags,
    motto: p.motto,
  };
  mockOnboardingDone = true;
  mockEnergy = p.moodScore;
  return { onboarding_completed: true, persona: mockPersona };
}

export function mockGetPersonaMe(): PersonaDto {
  if (!mockPersona) throw new Error('面具尚未创建');
  return mockPersona;
}

export function personaDtoToUserPersona(p: PersonaDto, energy?: number): UserPersona {
  return {
    role: p.name,
    tags: p.tags,
    motto: p.motto,
    hiddenPreferences: [],
    moodScore: energy ?? mockEnergy,
  };
}

export function mockGetWorkplace(): WorkplaceResponse {
  if (!mockPersona) {
    throw new Error('请先完成入职盲盒');
  }
  const mentors: MentorDto[] = MOCK_MENTORS.map((m) => ({
    id: m.id,
    name: m.name,
    avatar_url: m.avatar,
    role: m.role,
    status: m.status,
    type: m.id === 'm1' ? 'main' : 'project',
  }));
  return {
    user: {
      nickname: '程序员小智',
      avatar_url:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
      onboarding_days_left: 22,
    },
    persona: mockPersona,
    mood: {
      energy_level: mockEnergy,
      log_text: null,
      updated_at: new Date().toISOString(),
    },
    mentors,
    lunch: {
      active_buddies_count: 24,
      current_status:
        mockLunchStatus.status === 'idle' ? 'idle' : mockLunchStatus.status,
    },
  };
}

export function mockPostMood(body: {
  energy_level: number;
  log_text?: string;
}): MoodLogResponse {
  mockEnergy = body.energy_level;
  return {
    id: 'mock-mood-id',
    energy_level: body.energy_level,
    log_text: body.log_text ?? null,
    created_at: new Date().toISOString(),
  };
}

export function mockPatchMoodEnergy(energy_level: number) {
  mockEnergy = energy_level;
  return { energy_level, updated_at: new Date().toISOString() };
}

export function mockGetMentors(): { mentors: MentorDto[] } {
  return {
    mentors: MOCK_MENTORS.map((m) => ({
      id: m.id,
      name: m.name,
      avatar_url: m.avatar,
      role: m.role,
      status: m.status,
      type: m.id === 'm1' ? 'main' : 'project',
    })),
  };
}

export function mockGetLunchVenues(): {
  venues: LunchVenue[];
  default_venue_id: string;
} {
  return {
    venues: [
      {
        id: 'venue-1',
        name: '园区食堂 · 3F 休闲区',
        floor: '3F',
        active_buddies_count: 24,
      },
    ],
    default_venue_id: 'venue-1',
  };
}

export function mockPostLunchMatch(): {
  request_id: string;
  status: 'pending';
  created_at: string;
} {
  mockLunchStatus = {
    status: 'pending',
    request_id: 'mock-req-1',
    matching_tags: mockPersona?.tags ?? [],
  };
  if (mockLunchTimer) clearTimeout(mockLunchTimer);
  mockLunchTimer = setTimeout(() => {
    mockLunchStatus = {
      status: 'matched',
      request_id: 'mock-req-1',
      match_code: 'BLUE-K88',
      meeting_point: '食堂3楼休闲区 A15座',
      meet_before: new Date(Date.now() + 3600000).toISOString(),
      partner_persona: {
        name: '社交 E 人带玩型',
        tags: ['饭局发起人', '气氛组'],
      },
    };
  }, 2500);
  return {
    request_id: 'mock-req-1',
    status: 'pending',
    created_at: new Date().toISOString(),
  };
}

export function mockGetLunchStatus(): LunchStatusResponse {
  return { ...mockLunchStatus };
}

export function mockDeleteLunchMatch(): void {
  if (mockLunchTimer) clearTimeout(mockLunchTimer);
  mockLunchStatus = { status: 'cancelled' };
}

export function mockGetMentorAssignees(): { assignees: MentorAssigneeDto[] } {
  return {
    assignees: MOCK_MENTOR_ASSIGNEES.map((a) => ({
      user_id: a.id,
      nickname: a.nickname,
      persona: {
        name: a.personaRole || mockPersona?.name || '未生成',
        tags: mockPersona?.tags ?? [],
      },
      energy_level: a.id === 'u1' ? mockEnergy : a.energyLevel,
      onboarding_days_left: a.daysLeft,
      risk: a.risk,
    })),
  };
}

export function mockGetHrDashboardStats(): HrDashboardStats {
  return {
    integration_index: 84.2,
    integration_trend: '+3.4%',
    newcomers_at_risk: 12,
    newcomers_at_risk_trend: '-2',
    mentor_activity_rate: 0.96,
    mentor_activity_trend: '+1.2%',
    lunch_match_success_rate: 0.78,
    lunch_match_success_trend: '+5.0%',
    batches: [
      { name: '4月一批', active: 85, risk: 12 },
      { name: '5月一批', active: 92, risk: 5 },
    ],
  };
}

export function mockGetHrMoodTrends(): { points: HrMoodTrendPoint[] } {
  return {
    points: [
      { time: '10:00', score: 80 },
      { time: '12:00', score: 85 },
      { time: '14:00', score: 65 },
      { time: '16:00', score: 75 },
    ],
  };
}

export function mockGetHrAlerts(): { alerts: HrAlert[] } {
  return {
    alerts: [
      {
        id: 'a1',
        user_alias: '蓝色小象',
        dept: '研发中心 / 测试组',
        reason: '连续3天情绪分极低',
        severity: 'red',
      },
    ],
  };
}

export function mockPostHrInterventions(alert_ids: string[]) {
  return { sent: alert_ids.length, failed: 0 };
}
