import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import {
  generateEmployeeProfileFromAnswers,
  HOBBY_BY_LETTER,
  inferDominantFromPersonaName,
  type GeneratedEmployeeProfile,
  type PersonalityLetter,
  type QuizAnswerInput,
} from '../utils/employeeProfile.js';
import { HR_DEPARTMENTS } from '../db/fullSeed.js';

const TYPE_DEPT: Record<PersonalityLetter, string> = {
  I: '内容创作部门',
  E: '账号运营部门',
  N: '数据分析部门',
  S: '商务市场部门',
  P: '职能部门',
};

export function getEmployeeDept(db: Database.Database, userId: string): string | null {
  const row = db
    .prepare(`SELECT dept FROM employee_profiles WHERE user_id = ?`)
    .get(userId) as { dept: string } | undefined;
  return row?.dept ?? null;
}

export function getEmployeeProfileRow(db: Database.Database, userId: string) {
  const row = db
    .prepare(
      `SELECT employee_no, dept, display_title, work_style, social_style,
              lunch_preference, support_preference, dominant_type, secondary_type,
              traits, interests, answer_snapshot
       FROM employee_profiles WHERE user_id = ?`,
    )
    .get(userId) as
    | {
        employee_no: string;
        dept: string;
        display_title: string;
        work_style: string;
        social_style: string;
        lunch_preference: string;
        support_preference: string;
        dominant_type: string;
        secondary_type: string | null;
        traits: string;
        interests: string;
        answer_snapshot: string;
      }
    | undefined;

  if (!row) return null;
  return {
    ...row,
    traits: JSON.parse(row.traits) as string[],
    interests: JSON.parse(row.interests ?? '[]') as string[],
    answer_snapshot: JSON.parse(row.answer_snapshot) as QuizAnswerInput[],
  };
}

export function upsertEmployeeProfile(
  db: Database.Database,
  userId: string,
  profile: GeneratedEmployeeProfile,
) {
  db.prepare(`DELETE FROM employee_profiles WHERE user_id = ?`).run(userId);
  db.prepare(
    `INSERT INTO employee_profiles (
      id, user_id, employee_no, dept, display_title, work_style, social_style,
      lunch_preference, support_preference, dominant_type, secondary_type,
      traits, interests, answer_snapshot, batch
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '5月一批')`,
  ).run(
    uuid(),
    userId,
    profile.employee_no,
    profile.dept,
    profile.display_title,
    profile.work_style,
    profile.social_style,
    profile.lunch_preference,
    profile.support_preference,
    profile.dominant_type,
    profile.secondary_type,
    JSON.stringify(profile.traits),
    JSON.stringify(profile.interests ?? []),
    JSON.stringify(profile.answer_snapshot),
  );

  db.prepare(
    `UPDATE users SET nickname = ?, avatar_url = ? WHERE id = ?`,
  ).run(profile.nickname, profile.avatar_url, userId);
}

export function deleteEmployeeProfile(db: Database.Database, userId: string) {
  db.prepare(`DELETE FROM employee_profiles WHERE user_id = ?`).run(userId);
}

/** 已有面具但无档案时，按面具类型补一条员工档案 */
export function backfillEmployeeProfileFromPersona(
  db: Database.Database,
  userId: string,
  personaName: string,
  nickname: string,
) {
  const existing = getEmployeeDept(db, userId);
  if (existing) return;

  const dominant = inferDominantFromPersonaName(personaName);
  const dept = TYPE_DEPT[dominant] ?? HR_DEPARTMENTS[0];
  const energy =
    dominant === 'I'
      ? 72
      : dominant === 'E'
        ? 58
        : dominant === 'N'
          ? 65
          : dominant === 'S'
            ? 55
            : 80;

  const hobbies = HOBBY_BY_LETTER[dominant as PersonalityLetter] ?? HOBBY_BY_LETTER.I;
  db.prepare(
    `INSERT INTO employee_profiles (
      id, user_id, employee_no, dept, display_title, work_style, social_style,
      lunch_preference, support_preference, dominant_type, secondary_type,
      traits, interests, answer_snapshot, batch
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, '[]', ?, '[]', '5月一批')`,
  ).run(
    uuid(),
    userId,
    `BK${userId.replace(/\D/g, '').slice(-4).padStart(4, '0')}`,
    dept,
    `${dept.replace('部门', '')}专员`,
    '历史回填',
    '历史回填',
    '历史回填',
    '历史回填',
    dominant,
    JSON.stringify(hobbies),
  );
}

export const buildEmployeeFromQuiz = generateEmployeeProfileFromAnswers;
