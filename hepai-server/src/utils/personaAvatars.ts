/**
 * 与前端 src/utils/personalityHead.ts 保持一致的盲盒头型 + 能量表情 URL
 */
import type { EnergyTierId } from './energyTiers.js';

export type PersonalityLetter = 'I' | 'E' | 'N' | 'S' | 'P';

export interface PersonaFaceExpression {
  eyes: string;
  mouth: string;
  eyebrows?: string;
}

export interface PersonalityHeadProfile {
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
    seed: 'hepai-head-i',
    backgroundColor: 'b6e3f4',
    top: 'straight01',
    hairColor: '2c1b18',
    skinColor: 'ffdbb4',
    clothing: 'shirtCrewNeck',
    clothesColor: '3c4f5c',
  },
  E: {
    seed: 'hepai-head-e',
    backgroundColor: 'ffd5dc',
    top: 'shortCurly',
    hairColor: 'e6b800',
    skinColor: 'f8d25c',
    clothing: 'shirtCrewNeck',
    clothesColor: '5199e4',
  },
  N: {
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

const ENERGY_FACES: Record<EnergyTierId, PersonaFaceExpression> = {
  critical: { eyes: 'cry', mouth: 'sad', eyebrows: 'angry' },
  low: { eyes: 'squint', mouth: 'concerned', eyebrows: 'angry' },
  recovering: { eyes: 'side', mouth: 'serious', eyebrows: 'default' },
  steady: { eyes: 'default', mouth: 'default', eyebrows: 'default' },
  good: { eyes: 'happy', mouth: 'smile', eyebrows: 'default' },
  full: { eyes: 'hearts', mouth: 'twinkle', eyebrows: 'raisedExcited' },
};

const TIER_RANGES: { id: EnergyTierId; min: number; max: number }[] = [
  { id: 'critical', min: 0, max: 25 },
  { id: 'low', min: 26, max: 40 },
  { id: 'recovering', min: 41, max: 55 },
  { id: 'steady', min: 56, max: 70 },
  { id: 'good', min: 71, max: 85 },
  { id: 'full', min: 86, max: 100 },
];

function buildDicebearPersonaParams(
  head: PersonalityHeadProfile,
  face: PersonaFaceExpression,
  seed: string,
): URLSearchParams {
  const params = new URLSearchParams({
    seed,
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

export function energyTierId(level: number): EnergyTierId {
  const clamped = Math.min(100, Math.max(0, Math.round(level)));
  return (
    TIER_RANGES.find((t) => clamped >= t.min && clamped <= t.max)?.id ?? 'steady'
  );
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

export function buildPersonaAvatarUrl(
  energyLevel: number,
  dominantRaw?: string | null,
  personaName?: string | null,
  userId?: string,
): string {
  const dominant = dominantRaw
    ? normalizePersonalityLetter(dominantRaw)
    : personaName
      ? inferDominantFromPersonaName(personaName)
      : 'I';
  const tierId = energyTierId(energyLevel);
  const head = PERSONALITY_HEAD[dominant];
  const face = ENERGY_FACES[tierId];
  const tail = userId?.replace(/\D/g, '').slice(-6) || '';
  const seed = tail ? `${head.seed}-${tail}` : head.seed;
  const params = buildDicebearPersonaParams(head, face, seed);
  return `https://api.dicebear.com/7.x/avataaars/svg?${params.toString()}`;
}
