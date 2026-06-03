export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  dingtalk_user_id TEXT UNIQUE,
  password TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK(role IN ('newcomer', 'mentor', 'hr')),
  mentor_status TEXT DEFAULT 'available' CHECK(mentor_status IN ('busy', 'available', 'syncing')),
  onboarding_date TEXT NOT NULL,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS org_departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  parent_id TEXT REFERENCES org_departments(id) ON DELETE SET NULL,
  hrbp_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_org (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dept_id TEXT NOT NULL REFERENCES org_departments(id) ON DELETE RESTRICT,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS onboarding_batches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  starts_at TEXT,
  protection_days INTEGER NOT NULL DEFAULT 30,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_batches (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL REFERENCES onboarding_batches(id) ON DELETE RESTRICT,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  options TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_answers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tags TEXT,
  motto TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

/** 盲盒答题生成的员工组织档案（部门、工号、协作偏好等） */
CREATE TABLE IF NOT EXISTS employee_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  employee_no TEXT NOT NULL,
  dept TEXT NOT NULL,
  display_title TEXT NOT NULL,
  work_style TEXT NOT NULL,
  social_style TEXT NOT NULL,
  lunch_preference TEXT NOT NULL,
  support_preference TEXT NOT NULL,
  dominant_type TEXT NOT NULL CHECK(dominant_type IN ('I', 'E', 'P', 'S', 'N')),
  secondary_type TEXT CHECK(secondary_type IN ('I', 'E', 'P', 'S', 'N')),
  traits TEXT NOT NULL DEFAULT '[]',
  interests TEXT NOT NULL DEFAULT '[]',
  answer_snapshot TEXT NOT NULL DEFAULT '[]',
  batch TEXT NOT NULL DEFAULT '5月一批',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interest_match_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'matched', 'cancelled')),
  match_code TEXT,
  meeting_point TEXT,
  meet_before TEXT,
  matched_at TEXT,
  partner_user_id TEXT,
  confirmed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mood_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  energy_level INTEGER NOT NULL,
  log_text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_energy_snapshot (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  energy_level INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mentor_assignments (
  mentee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('main', 'project')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (mentee_id, mentor_id)
);

CREATE TABLE IF NOT EXISTS lunch_match_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'matched', 'cancelled')),
  match_code TEXT,
  meeting_point TEXT,
  meet_before TEXT,
  matched_at TEXT,
  partner_user_id TEXT,
  confirmed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hr_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_alias TEXT NOT NULL,
  dept TEXT NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'yellow' CHECK(severity IN ('yellow', 'red')),
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hr_interventions (
  id TEXT PRIMARY KEY,
  alert_id TEXT REFERENCES hr_alerts(id) ON DELETE SET NULL,
  target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  operator_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'hrbp',
  action TEXT NOT NULL DEFAULT 'resolve_alert',
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_hr_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '企业 AI HR 对话',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_hr_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES ai_hr_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  reply_source TEXT,
  topic TEXT,
  policy_version TEXT,
  citations_json TEXT,
  integrated_sources_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS desk_rewards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK(source IN ('lunch_match', 'interest_match', 'mentor', 'hr', 'event')),
  ref_id TEXT,
  reward_kind TEXT NOT NULL CHECK(reward_kind IN ('meal_voucher', 'scene_perk', 'outdoor_badge', 'mentor_reward', 'honor', 'star')),
  title TEXT NOT NULL,
  detail TEXT,
  venue_id TEXT,
  earned_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_desk_rewards_user_time
  ON desk_rewards(user_id, earned_at DESC);

CREATE TABLE IF NOT EXISTS mentor_touchpoints (
  id TEXT PRIMARY KEY,
  mentee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'mentor_chat',
  touch_type TEXT NOT NULL CHECK(touch_type IN ('message', 'checkin', 'followup')),
  source_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mentor_touchpoints_pair_time
  ON mentor_touchpoints(mentee_id, mentor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS policy_documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  effective_date TEXT,
  owner TEXT,
  description TEXT,
  answer_policy TEXT,
  source_dir TEXT,
  integrated_with_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(name, version)
);

CREATE TABLE IF NOT EXISTS policy_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES policy_documents(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  category_title TEXT NOT NULL,
  section_title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_file TEXT NOT NULL,
  keywords_json TEXT NOT NULL DEFAULT '[]',
  chunk_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_policy_chunks_document
  ON policy_chunks(document_id, category_id);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issued_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  user_agent TEXT,
  ip TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
  ON auth_sessions(user_id, issued_at DESC);

CREATE TABLE IF NOT EXISTS mentor_chat_threads (
  id TEXT PRIMARY KEY,
  mentee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(mentee_id, mentor_id)
);

CREATE TABLE IF NOT EXISTS mentor_chat_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES mentor_chat_threads(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mentor_chat_messages_thread
  ON mentor_chat_messages(thread_id, created_at);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('mentor_reply', 'system', 'lunch', 'interest')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  peer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications(user_id, read, created_at DESC);
`;
