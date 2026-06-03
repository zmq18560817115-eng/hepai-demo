/**
 * 盲盒人格字母 → 头型配置（与后端 personaAvatars.ts 保持一致）
 * 同一人格所有能量档位必须共用 seed + 肤色/服装，仅改眼嘴眉。
 */
import type { PersonaFaceExpression } from './energyPersona';

export type PersonalityLetter = 'I' | 'E' | 'N' | 'S' | 'P';

export interface PersonalityHeadProfile {
  label: string;
  seed: string;
  backgroundColor: string;
  top: string;
  hairColor: string;
  skinColor: string;
  clothing: string;
  clothesColor: string;
  facialHair?: string;
  accessories?: string;
}

export const PERSONALITY_HEAD: Record<PersonalityLetter, PersonalityHeadProfile> = {
  I: {
    label: '静谧 I 人',
    seed: 'hepai-head-i',
    backgroundColor: 'b6e3f4',
    top: 'straight01',
    hairColor: '2c1b18',
    skinColor: 'ffdbb4',
    clothing: 'shirtCrewNeck',
    clothesColor: '3c4f5c',
  },
  E: {
    label: '社交 E 人',
    seed: 'hepai-head-e',
    backgroundColor: 'ffd5dc',
    top: 'shortCurly',
    hairColor: 'e6b800',
    skinColor: 'f8d25c',
    clothing: 'shirtCrewNeck',
    clothesColor: '5199e4',
  },
  N: {
    label: '观察 N 人',
    seed: 'hepai-head-n',
    backgroundColor: 'c0aede',
    top: 'hat',
    hairColor: '4a3728',
    skinColor: 'edb98a',
    clothing: 'shirtCrewNeck',
    clothesColor: '262e33',
    accessories: 'round',
  },
  S: {
    label: '踏实 S 人',
    seed: 'hepai-head-s',
    backgroundColor: 'd1f4d1',
    top: 'theCaesar',
    hairColor: '724133',
    skinColor: 'd08b5b',
    clothing: 'collarAndSweater',
    clothesColor: '25557c',
    facialHair: 'beardLight',
  },
  P: {
    label: '玩梗 P 人',
    seed: 'hepai-head-p',
    backgroundColor: 'ffdfbf',
    top: 'fro',
    hairColor: 'f59797',
    skinColor: 'ae5d29',
    clothing: 'hoodie',
    clothesColor: '65c9ff',
    accessories: 'sunglasses',
  },
};

/** 构建 Dicebear 查询串：锁定外形，仅表情可变 */
export function buildDicebearPersonaParams(
  head: PersonalityHeadProfile,
  face: PersonaFaceExpression,
  seedOverride?: string,
): URLSearchParams {
  const params = new URLSearchParams({
    seed: seedOverride ?? head.seed,
    backgroundColor: head.backgroundColor,
    top: head.top,
    hairColor: head.hairColor,
    skinColor: head.skinColor,
    clothing: head.clothing,
    clothesColor: head.clothesColor,
    eyes: face.eyes,
    mouth: face.mouth,
    eyebrows: face.eyebrows ?? 'default',
    facialHairProbability: head.facialHair ? '100' : '0',
    accessoriesProbability: head.accessories ? '100' : '0',
  });
  if (head.facialHair) params.set('facialHair', head.facialHair);
  if (head.accessories) params.set('accessories', head.accessories);
  return params;
}

export function normalizePersonalityLetter(
  raw?: string | null,
): PersonalityLetter {
  const t = String(raw ?? '')
    .trim()
    .toUpperCase();
  if (t === 'E' || t === 'N' || t === 'S' || t === 'P') return t;
  return 'I';
}

export function inferDominantFromPersonaName(name: string): PersonalityLetter {
  if (/社交\s*E|E\s*人/.test(name)) return 'E';
  if (/玩梗\s*P|P\s*人/.test(name)) return 'P';
  if (/踏实\s*S|S\s*人/.test(name)) return 'S';
  if (/观察\s*N|N\s*人/.test(name)) return 'N';
  if (/静谧\s*I|I\s*人/.test(name)) return 'I';
  return 'I';
}
