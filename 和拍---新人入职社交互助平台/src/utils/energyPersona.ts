/** 情绪能量档位：统一头像上的表情叠加 + 鼓励语 */

export type EnergyTierId =
  | 'critical'
  | 'low'
  | 'recovering'
  | 'steady'
  | 'good'
  | 'full';

/** DiceBear avataaars 面部表情（仅改这三项，发型服装保持一致） */
export interface PersonaFaceExpression {
  eyes: string;
  mouth: string;
  eyebrows?: string;
}

export interface EnergyTier {
  id: EnergyTierId;
  min: number;
  max: number;
  label: string;
  face: PersonaFaceExpression;
  messages: string[];
}

export const ENERGY_TIERS: EnergyTier[] = [
  {
    id: 'critical',
    min: 0,
    max: 25,
    label: '需要充电',
    face: { eyes: 'cry', mouth: 'sad', eyebrows: 'angry' },
    messages: [
      '电量告急也没关系，今天先完成一件小事就好。',
      '撑住！去安全屋记一条闪光小事，给自己充点电。',
    ],
  },
  {
    id: 'low',
    min: 26,
    max: 40,
    label: '偏低',
    face: { eyes: 'squint', mouth: 'concerned', eyebrows: 'angry' },
    messages: [
      '有点累了？试试约个饭搭子，不必硬撑。',
      '状态偏低时，和导师聊 5 分钟也会轻松些。',
    ],
  },
  {
    id: 'recovering',
    min: 41,
    max: 55,
    label: '回升中',
    face: { eyes: 'side', mouth: 'serious', eyebrows: 'default' },
    messages: [
      '稳扎稳打，午餐匹配也许能帮你打开话题。',
      '一步一步来，融入本来就需要时间。',
    ],
  },
  {
    id: 'steady',
    min: 56,
    max: 70,
    label: '平稳',
    face: { eyes: 'default', mouth: 'default', eyebrows: 'default' },
    messages: [
      '节奏不错，保持自己的舒适区就好。',
      '今天可以主动跟邻座同事打个招呼。',
    ],
  },
  {
    id: 'good',
    min: 71,
    max: 85,
    label: '充沛',
    face: { eyes: 'happy', mouth: 'smile', eyebrows: 'default' },
    messages: [
      '能量不错！适合去蹭饭地图认识新朋友。',
      '状态很好，可以把一个小目标告诉导师。',
    ],
  },
  {
    id: 'full',
    min: 86,
    max: 100,
    label: '满格',
    face: { eyes: 'hearts', mouth: 'twinkle', eyebrows: 'raisedExcited' },
    messages: [
      '满格出街！你是今日职场发光体。',
      '气场拉满，去记录一条今日闪光吧！',
    ],
  },
];

export function getEnergyTier(level: number): EnergyTier {
  const clamped = Math.min(100, Math.max(0, Math.round(level)));
  return (
    ENERGY_TIERS.find((t) => clamped >= t.min && clamped <= t.max) ??
    ENERGY_TIERS[3]!
  );
}

/** 同一底图上的轻微色调变化（不替换图片 URL） */
export function getEnergyAvatarFilter(level: number): string {
  if (level <= 25) return 'saturate(0.72) brightness(0.9)';
  if (level <= 40) return 'saturate(0.85) brightness(0.94)';
  if (level <= 55) return 'saturate(0.95) brightness(0.98)';
  if (level <= 70) return 'none';
  if (level <= 85) return 'saturate(1.05) brightness(1.02)';
  return 'saturate(1.12) brightness(1.05)';
}

export function getEnergyRingClass(level: number): string {
  const tier = getEnergyTier(level);
  if (tier.id === 'critical' || tier.id === 'low') return 'ring-rose-400';
  if (tier.id === 'recovering') return 'ring-amber-400';
  if (tier.id === 'steady') return 'ring-emerald-400';
  if (tier.id === 'good') return 'ring-emerald-500';
  return 'ring-yellow-300';
}

export function pickEncouragement(
  level: number,
  previousLevel?: number,
): { message: string; tier: EnergyTier; tierChanged: boolean } {
  const tier = getEnergyTier(level);
  const prevTier =
    previousLevel !== undefined ? getEnergyTier(previousLevel) : null;
  const tierChanged = prevTier !== null && prevTier.id !== tier.id;
  const pool = tier.messages;
  const message = pool[Math.floor(Math.random() * pool.length)]!;
  return { message, tier, tierChanged };
}

export function energyBarColor(level: number): string {
  const tier = getEnergyTier(level);
  if (tier.id === 'critical' || tier.id === 'low') return 'bg-rose-400';
  if (tier.id === 'recovering') return 'bg-amber-400';
  if (tier.id === 'steady') return 'bg-emerald-400';
  if (tier.id === 'good') return 'bg-emerald-500';
  return 'bg-yellow-300';
}

/** range input accent-color（与能量档位环色一致） */
export function energyBarAccentHex(level: number): string {
  const tier = getEnergyTier(level);
  if (tier.id === 'critical' || tier.id === 'low') return '#fb7185';
  if (tier.id === 'recovering') return '#fbbf24';
  if (tier.id === 'steady') return '#34d399';
  if (tier.id === 'good') return '#10b981';
  return '#fde047';
}
