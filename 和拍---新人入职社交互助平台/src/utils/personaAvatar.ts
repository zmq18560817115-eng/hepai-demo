/**
 * 人格头型（I/E/N/S/P）+ 情绪档位表情（能量条）组合头像
 */
import {
  ENERGY_TIERS,
  getEnergyTier,
  type EnergyTierId,
} from './energyPersona';
import {
  buildDicebearPersonaParams,
  inferDominantFromPersonaName,
  normalizePersonalityLetter,
  PERSONALITY_HEAD,
  type PersonalityLetter,
} from './personalityHead';

/** 仅表情变化时的本地兜底（Felix 长发底图） */
export const LOCAL_PERSONA_FACES: Record<EnergyTierId, string> = {
  critical: '/persona/critical.svg',
  low: '/persona/low.svg',
  recovering: '/persona/recovering.svg',
  steady: '/persona/steady.svg',
  good: '/persona/good.svg',
  full: '/persona/full.svg',
};

export const PERSONA_FACE_FALLBACK = LOCAL_PERSONA_FACES.steady;

/** 预生成：人格 × 默认表情（steady），无网时可用 */
export const LOCAL_PERSONA_BY_TYPE: Record<PersonalityLetter, string> = {
  I: '/persona/heads/I.svg',
  E: '/persona/heads/E.svg',
  N: '/persona/heads/N.svg',
  S: '/persona/heads/S.svg',
  P: '/persona/heads/P.svg',
};

/** 离线：人格 × 能量档位 合成图（共 30 张，npm run personas:fetch-composites） */
export function buildLocalCompositeUrl(
  dominant: PersonalityLetter,
  tierId: EnergyTierId,
): string {
  return `/persona/composite/${dominant}-${tierId}.svg`;
}

export function buildLocalCompositeUrlForLevel(
  energyLevel: number,
  dominantRaw?: string | null,
  personaName?: string | null,
): string {
  const dominant = dominantRaw
    ? normalizePersonalityLetter(dominantRaw)
    : personaName
      ? inferDominantFromPersonaName(personaName)
      : 'I';
  const tier = getEnergyTier(energyLevel);
  return buildLocalCompositeUrl(dominant, tier.id);
}

export function buildPersonaFaceUrl(tierId: EnergyTierId): string {
  return LOCAL_PERSONA_FACES[tierId] ?? PERSONA_FACE_FALLBACK;
}

export function buildPersonaFaceUrlForLevel(level: number): string {
  return buildPersonaFaceUrl(getEnergyTier(level).id);
}

/** Dicebear：头型 + 表情参数（与后端一致） */
export function buildDicebearPersonaUrl(
  dominant: PersonalityLetter,
  tierId: EnergyTierId,
  userSeed?: string,
): string {
  const head = PERSONALITY_HEAD[dominant];
  const tier = ENERGY_TIERS.find((t) => t.id === tierId) ?? ENERGY_TIERS[3]!;
  const seed = userSeed ? `${head.seed}-${userSeed}` : head.seed;
  const params = buildDicebearPersonaParams(head, tier.face, seed);
  return `https://api.dicebear.com/7.x/avataaars/svg?${params.toString()}`;
}

/**
 * 完整头像 URL：优先在线 Dicebear（头型+表情），失败由组件回退本地 SVG
 */
export function buildPersonaAvatarUrl(
  energyLevel: number,
  dominantRaw?: string | null,
  personaName?: string | null,
  userSeed?: string,
): string {
  const dominant = dominantRaw
    ? normalizePersonalityLetter(dominantRaw)
    : personaName
      ? inferDominantFromPersonaName(personaName)
      : 'I';
  const tier = getEnergyTier(energyLevel);
  return buildDicebearPersonaUrl(dominant, tier.id, userSeed);
}

export function buildPersonaAvatarUrlForEmployee(
  energyLevel: number,
  dominantType?: string | null,
  personaName?: string | null,
  userId?: string,
): string {
  return buildPersonaAvatarUrl(
    energyLevel,
    dominantType,
    personaName,
    userId?.slice(-8),
  );
}

export function preloadPersonaFaces(
  dominantRaw?: string | null,
  personaName?: string | null,
): void {
  const dominant = dominantRaw
    ? normalizePersonalityLetter(dominantRaw)
    : personaName
      ? inferDominantFromPersonaName(personaName)
      : 'I';
  for (const tier of ENERGY_TIERS) {
    const img = new Image();
    img.src = buildLocalCompositeUrl(dominant, tier.id);
  }
  for (const letter of Object.keys(PERSONALITY_HEAD) as PersonalityLetter[]) {
    const img = new Image();
    img.src = LOCAL_PERSONA_BY_TYPE[letter];
  }
}
