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
  /** 首次接入新人：登录后展示入职大礼包 */
  show_welcome_gift?: boolean;
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

export interface EmployeeProfileDto {
  employee_no: string;
  dept: string;
  display_title: string;
  nickname?: string;
  avatar_url?: string;
  energy_level?: number;
  dominant_type: string;
  secondary_type?: string | null;
  work_style: string;
  social_style: string;
  lunch_preference: string;
  support_preference: string;
  traits?: string[];
  interests?: string[];
}

export interface QuizSubmitResponse {
  onboarding_completed: boolean;
  persona: PersonaDto;
  employee?: EmployeeProfileDto;
}

export interface WorkplaceResponse {
  user: {
    nickname: string;
    avatar_url: string | null;
    onboarding_days_left: number;
  };
  employee?: EmployeeProfileDto | null;
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

export interface MentorChatPeer {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  mentor_status?: string | null;
}

export interface MentorChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  created_at: string;
  is_mine: boolean;
}

export interface MentorChatThreadResponse {
  thread_id: string;
  peer: MentorChatPeer;
  messages: MentorChatMessage[];
}

export interface MentorChatInboxItem {
  thread_id: string;
  peer: MentorChatPeer;
  updated_at: string;
  last_message: {
    content: string;
    sender_id: string;
    sender_name: string;
    created_at: string;
    is_mine: boolean;
  } | null;
  message_count: number;
}

export type NotificationType = 'mentor_reply' | 'system' | 'lunch';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  peer_id: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  unread_count: number;
  items: NotificationItem[];
}

export interface FlashJarItem {
  id: string;
  log_text: string;
  energy_level: number;
  created_at: string;
}

export interface FlashJarResponse {
  items: FlashJarItem[];
  total: number;
}

export type DeskItemKind =
  | 'honor'
  | 'star_jar'
  | 'buddy_ticket'
  | 'mentor_reward';

/** 餐券贴画样式（由场景类型决定） */
export type DeskRewardVariant = 'ticket' | 'perk' | 'badge';

export interface DeskReward {
  id: string;
  source: 'lunch_match';
  request_id: string;
  reward_kind: 'meal_voucher' | 'scene_perk' | 'outdoor_badge';
  title: string;
  detail?: string;
  venue_name?: string;
  earned_at?: string;
}

export interface DeskRewardsResponse {
  rewards: DeskReward[];
  lunch_voucher_count: number;
  total_count: number;
}

export interface DeskPlacedItem {
  id: string;
  kind: DeskItemKind;
  title: string;
  detail?: string;
  /** 桌面俯视布局槽位 */
  slot: 'honor' | 'jar' | 'tickets' | 'mentor' | 'star_scatter';
  sort: number;
  reward_variant?: DeskRewardVariant;
}

export interface MyDeskResponse {
  items: DeskPlacedItem[];
  star_count: number;
  buddy_ticket_count: number;
  lunch_voucher_count: number;
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
  building?: string;
  scene_tag?: string;
  waiting_count?: number;
  active_buddies_count: number;
}

export interface LunchRoadmapStep {
  step: number;
  title: string;
  detail: string;
}

export interface LunchMerchant {
  id: string;
  name: string;
  category: string;
  distance_m: number;
  perk: string;
}

export interface LunchPartnerPersona {
  name: string;
  tags: string[];
  common_tags?: string[];
  affinity_label?: string;
}

export interface LunchStatusResponse {
  status: 'idle' | 'pending' | 'matched' | 'cancelled';
  request_id?: string;
  matching_tags?: string[];
  venue_name?: string;
  match_code?: string;
  meeting_point?: string;
  meet_before?: string;
  venue_id?: string;
  confirmed?: boolean;
  partner_persona?: LunchPartnerPersona;
  roadmap?: LunchRoadmapStep[];
  nearby_merchants?: LunchMerchant[];
}

export interface MentorAssigneeDto {
  user_id: string;
  nickname: string;
  persona: { name: string; tags: string[] };
  energy_level: number;
  latest_mood_note?: string | null;
  onboarding_days_left: number;
  risk: 'normal' | 'watch' | 'alert';
}

export interface HrDashboardStats {
  scope_dept?: string | null;
  newcomer_count?: number;
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

export interface HrAlertsResponse {
  alerts: HrAlert[];
  total?: number;
  query?: string | null;
  departments?: string[];
}

export interface HrNewcomerSearchItem {
  id: string;
  alias_name: string;
  dept: string;
  batch: string;
  persona_name: string;
  energy_level: number;
  risk: 'normal' | 'watch' | 'alert';
}

export interface HrSearchResponse {
  items: HrNewcomerSearchItem[];
  total: number;
  page: number;
  page_size: number;
  departments: string[];
  query: string | null;
}

export interface HrPendingNewcomerItem {
  id: string;
  username: string;
  nickname: string;
  dept: string;
  onboarding_completed: boolean;
  has_persona: boolean;
  dominant_type: string | null;
  status_label: string;
  created_at?: string;
}

export interface HrRegisterNewcomerResponse {
  user_id: string;
  username: string;
  nickname: string;
  dept: string;
  default_password: string;
  onboarding_completed: false;
  message?: string;
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

export interface AiHrCitation {
  id: string;
  title: string;
  section: string;
  excerpt: string;
  source: string;
  policy_version: string;
}

export interface AiHrChatResponse {
  reply: string;
  role: string;
  reply_source?: string;
  topic?: string;
  citations?: AiHrCitation[];
  policy_version?: string | null;
  integrated_sources?: string[];
}

export interface AiHrGuidelineSection {
  id: string;
  section: string;
  excerpt: string;
}

export interface AiHrGuidelineCategory {
  id: string;
  title: string;
  file: string;
  sections: AiHrGuidelineSection[];
}

export interface AiHrGuidelineSearchResult {
  score: number;
  citation: AiHrCitation;
  chunk_id: string;
}

export interface AiHrGuidelineSearchResponse {
  query: string;
  policy_version: string;
  results: AiHrGuidelineSearchResult[];
}

export interface AiHrGuidelinesCatalog {
  name: string;
  display_name: string;
  version: string;
  effective_date: string;
  owner: string;
  description: string;
  integrated_with: string[];
  chunk_count: number;
  categories: AiHrGuidelineCategory[];
}

export interface SystemStatusResponse {
  database: {
    engine: string;
    path: string;
    connected: boolean;
    tables: Record<string, number>;
  };
  skill: {
    name: string;
    loaded: boolean;
    reply_mode: string;
    enterprise_guidelines?: {
      name: string;
      version: string;
      chunk_count: number;
      loaded: boolean;
    };
  };
  user: {
    id: string;
    nickname: string;
    role: string;
    onboarding_completed: boolean;
    persona_name: string | null;
    energy_level: number;
    days_left: number;
  };
  user_data: {
    mood_log_count: number;
    latest_mood_text: string | null;
    lunch_status: string | null;
    lunch_code: string | null;
    mentor_names: string[];
    ai_message_count: number;
    quiz_question_count: number;
  };
  ai_history_count: number;
}

export interface AiHrSkillMeta {
  name: string;
  display_name: string;
  version: string;
  source_desktop: string;
  philosophy: string[];
  welcome: string;
  suggestions: string[];
  first_week_roadmap: { phase: string; tasks: string[] }[];
  reference_files: string[];
  skill_dir?: string;
  enterprise_guidelines?: {
    name: string;
    version: string;
    chunk_count: number;
  } | null;
  integrated_skills?: string[];
}
