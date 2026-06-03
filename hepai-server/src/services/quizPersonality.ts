/**
 * 8 题盲盒：仅更新性格标签与偏好字段，不更换人物角色（昵称/部门/头型）
 */
import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import {
  ANSWER_TRAIT_LABELS,
  deriveInterestsFromAnswers,
  dominantAndSecondary,
  inferDominantFromPersonaName,
  tallyAnswerTypes,
  TYPE_CONFIG,
  type PersonalityLetter,
  type QuizAnswerInput,
} from '../utils/employeeProfile.js';
import { getEmployeeProfileRow, backfillEmployeeProfileFromPersona } from '../services/employeeProfiles.js';
import { buildPersonaAvatarUrl } from '../utils/personaAvatars.js';
import { getPersonaTemplateForLetter } from '../utils/persona.js';

export interface QuizPersonalityPatch {
  dominant_type: PersonalityLetter;
  secondary_type: PersonalityLetter | null;
  tags: string[];
  traits: string[];
  interests: string[];
  work_style: string;
  social_style: string;
  lunch_preference: string;
  support_preference: string;
}

export function derivePersonalityPatchFromAnswers(
  answers: QuizAnswerInput[],
): QuizPersonalityPatch {
  const values = answers.map((a) => a.answer_value);
  const counts = tallyAnswerTypes(values);
  const { dominant, secondary } = dominantAndSecondary(counts);
  const cfg = TYPE_CONFIG[dominant] ?? TYPE_CONFIG.I;
  const traits = [
    ...new Set(values.map((v) => ANSWER_TRAIT_LABELS[v]).filter(Boolean)),
  ] as string[];
  const tags =
    traits.length > 0 ? traits.slice(0, 6) : cfg.social_style.split(' · ').filter(Boolean);
  const interests = deriveInterestsFromAnswers(values);
  return {
    dominant_type: dominant,
    secondary_type: secondary,
    tags,
    traits,
    interests,
    work_style: cfg.work_style,
    social_style: cfg.social_style,
    lunch_preference: cfg.lunch_preference,
    support_preference: cfg.support_preference,
  };
}

export function applyQuizPersonalityOnly(
  db: Database.Database,
  userId: string,
  answers: QuizAnswerInput[],
): {
  persona_id: string;
  persona: { name: string; tags: string[]; motto: string };
  employee: Record<string, unknown>;
  energy_level: number;
} {
  const user = db
    .prepare(`SELECT nickname, avatar_url FROM users WHERE id = ?`)
    .get(userId) as { nickname: string; avatar_url: string | null };

  const personaRow = db
    .prepare(`SELECT id, name, motto FROM personas WHERE user_id = ?`)
    .get(userId) as { id: string; name: string; motto: string } | undefined;

  const patch = derivePersonalityPatchFromAnswers(answers);
  const isFirstQuiz = !personaRow;
  const template = getPersonaTemplateForLetter(patch.dominant_type);
  const personaName = personaRow?.name ?? template.name;
  const motto = personaRow?.motto ?? template.motto;
  const headDominant = isFirstQuiz
    ? patch.dominant_type
    : inferDominantFromPersonaName(personaName);

  const ep = getEmployeeProfileRow(db, userId);
  const energy =
    db
      .prepare(`SELECT energy_level FROM user_energy_snapshot WHERE user_id = ?`)
      .get(userId) as { energy_level: number } | undefined;
  const energyLevel = energy?.energy_level ?? ep?.dominant_type ? 72 : 75;

  let personaId = personaRow?.id ?? '';
  if (personaRow) {
    db.prepare(`UPDATE personas SET tags = ? WHERE user_id = ?`).run(
      JSON.stringify(patch.tags),
      userId,
    );
    personaId = personaRow.id;
  } else {
    personaId = uuid();
    db.prepare(
      `INSERT INTO personas (id, user_id, name, tags, motto) VALUES (?, ?, ?, ?, ?)`,
    ).run(
      personaId,
      userId,
      personaName,
      JSON.stringify(patch.tags),
      motto,
    );
  }

  if (ep) {
    const cfg = TYPE_CONFIG[patch.dominant_type] ?? TYPE_CONFIG.I;
    db.prepare(
      `UPDATE employee_profiles SET
        display_title = CASE WHEN work_style = '待完成人格测试' THEN ? ELSE display_title END,
        dominant_type = ?, secondary_type = ?,
        work_style = ?, social_style = ?, lunch_preference = ?, support_preference = ?,
        traits = ?, interests = ?, answer_snapshot = ?
       WHERE user_id = ?`,
    ).run(
      cfg.title,
      headDominant,
      patch.secondary_type,
      patch.work_style,
      patch.social_style,
      patch.lunch_preference,
      patch.support_preference,
      JSON.stringify(patch.traits),
      JSON.stringify(patch.interests),
      JSON.stringify(answers),
      userId,
    );
  } else if (personaRow) {
    backfillEmployeeProfileFromPersona(db, userId, personaName, user.nickname);
    db.prepare(
      `UPDATE employee_profiles SET
        work_style = ?, social_style = ?, lunch_preference = ?, support_preference = ?,
        traits = ?, interests = ?, answer_snapshot = ?
       WHERE user_id = ?`,
    ).run(
      patch.work_style,
      patch.social_style,
      patch.lunch_preference,
      patch.support_preference,
      JSON.stringify(patch.traits),
      JSON.stringify(patch.interests),
      JSON.stringify(answers),
      userId,
    );
  }

  const avatarUrl = buildPersonaAvatarUrl(
    energyLevel,
    headDominant,
    personaName,
    userId,
  );
  if (!user.avatar_url || user.avatar_url.includes('seed=Felix')) {
    db.prepare(`UPDATE users SET avatar_url = ? WHERE id = ?`).run(avatarUrl, userId);
  }

  const profile = getEmployeeProfileRow(db, userId);
  return {
    persona_id: personaId,
    persona: { name: personaName, tags: patch.tags, motto },
    employee: {
      employee_no: profile?.employee_no ?? '',
      dept: profile?.dept ?? '',
      display_title: profile?.display_title ?? '',
      nickname: user.nickname,
      avatar_url: avatarUrl,
      energy_level: energyLevel,
      dominant_type: headDominant,
      secondary_type: patch.secondary_type,
      work_style: patch.work_style,
      social_style: patch.social_style,
      lunch_preference: patch.lunch_preference,
      support_preference: patch.support_preference,
      traits: patch.traits,
      interests: patch.interests,
    },
    energy_level: energyLevel,
  };
}
