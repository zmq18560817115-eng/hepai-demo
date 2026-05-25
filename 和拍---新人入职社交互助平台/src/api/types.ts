/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** 与 docs/08-api-spec-for-frontend.md 对齐 */

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

export interface AuthUser {
  id: string;
  username: string;
  nickname: string;
  avatar_url: string | null;
  role: 'newcomer' | 'mentor' | 'hr';
  onboarding_date: string;
  onboarding_completed: boolean;
  onboarding_days_left?: number;
}

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  user: AuthUser;
}

export interface OnboardingStatus {
  completed: boolean;
  persona_id: string | null;
}

export interface QuizQuestionDto {
  id: string;
  text: string;
  options: { text: string; value: string }[];
}

export interface PersonaDto {
  id?: string;
  name: string;
  tags: string[];
  motto: string;
  created_at?: string;
}

export interface QuizSubmitAnswer {
  question_id: string;
  answer_value: string;
}

export interface QuizSubmitResponse {
  onboarding_completed: boolean;
  persona: PersonaDto;
}

export interface WorkplaceResponse {
  user: {
    nickname: string;
    avatar_url: string | null;
    onboarding_days_left: number;
  };
  persona: PersonaDto;
  mood: {
    energy_level: number;
    log_text: string | null;
    updated_at: string;
  };
  mentors: MentorDto[];
  lunch: {
    active_buddies_count: number;
    current_status: 'idle' | 'pending' | 'matched' | 'cancelled';
  };
}

export interface MentorDto {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  status: 'busy' | 'available' | 'syncing';
  type: 'main' | 'project';
}

export interface MoodLogResponse {
  id: string;
  energy_level: number;
  log_text: string | null;
  created_at: string;
}

export interface LunchVenue {
  id: string;
  name: string;
  floor: string;
  active_buddies_count: number;
}

export interface LunchStatusResponse {
  status: 'idle' | 'pending' | 'matched' | 'cancelled';
  request_id?: string;
  matching_tags?: string[];
  match_code?: string;
  meeting_point?: string;
  meet_before?: string;
  partner_persona?: { name: string; tags: string[] };
}

export interface MentorAssigneeDto {
  user_id: string;
  nickname: string;
  persona: { name: string; tags: string[] };
  energy_level: number;
  onboarding_days_left: number;
  risk: 'normal' | 'watch' | 'alert';
}

export interface HrDashboardStats {
  integration_index: number;
  integration_trend: string;
  newcomers_at_risk: number;
  newcomers_at_risk_trend: string;
  mentor_activity_rate: number;
  mentor_activity_trend: string;
  lunch_match_success_rate: number;
  lunch_match_success_trend: string;
  batches: { name: string; active: number; risk: number }[];
}

export interface HrMoodTrendPoint {
  time: string;
  score: number;
}

export interface HrAlert {
  id: string;
  user_alias: string;
  dept: string;
  reason: string;
  severity: 'yellow' | 'red';
}

export interface AiHrMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

export interface AiHrHistoryResponse {
  session_id: string | null;
  title?: string;
  messages: AiHrMessage[];
}

export interface AiHrChatResponse {
  reply: string;
  role: string;
}
