/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  DeskPlacedItem,
  DeskReward,
  DeskRewardVariant,
  FlashJarItem,
  LunchStatusResponse,
  MyDeskResponse,
  WorkplaceResponse,
} from '../api/types';

function honorFromWorkplace(wp: WorkplaceResponse): DeskPlacedItem[] {
  const items: DeskPlacedItem[] = [];
  if (wp.persona?.name) {
    items.push({
      id: 'honor-persona',
      kind: 'honor',
      title: '入职面具',
      detail: wp.persona.name,
      slot: 'honor',
      sort: 0,
    });
  }
  if (wp.employee?.dept) {
    items.push({
      id: 'honor-dept',
      kind: 'honor',
      title: '部门归属',
      detail: wp.employee.dept,
      slot: 'honor',
      sort: 1,
    });
  }
  if (wp.user.onboarding_days_left <= 30) {
    items.push({
      id: 'honor-onboard',
      kind: 'honor',
      title: '新人融入',
      detail: `D${wp.user.onboarding_days_left}`,
      slot: 'honor',
      sort: 2,
    });
  }
  return items.slice(0, 3);
}

function variantForReward(
  reward: DeskReward,
): DeskRewardVariant {
  switch (reward.reward_kind) {
    case 'meal_voucher':
      return 'ticket';
    case 'outdoor_badge':
      return 'badge';
    default:
      return 'perk';
  }
}

/** 每次午餐匹配成功对应工位上一张贴画 */
function lunchEarnedTickets(
  rewards: DeskReward[],
  lunch: LunchStatusResponse,
): DeskPlacedItem[] {
  const tickets: DeskPlacedItem[] = rewards.map((r, i) => ({
    id: r.id,
    kind: 'buddy_ticket',
    title: r.title,
    detail: r.detail ?? r.venue_name,
    slot: 'tickets',
    sort: i,
    reward_variant: variantForReward(r),
  }));

  if (lunch.status === 'pending') {
    tickets.push({
      id: 'ticket-lunch-pending',
      kind: 'buddy_ticket',
      title: '饭搭子排队中',
      detail: lunch.venue_name ?? undefined,
      slot: 'tickets',
      sort: tickets.length,
      reward_variant: 'ticket',
    });
  }

  if (tickets.length === 0) {
    tickets.push({
      id: 'ticket-empty',
      kind: 'buddy_ticket',
      title: '搭子匹配券',
      detail: '成功约到饭搭子后会自动出现',
      slot: 'tickets',
      sort: 0,
      reward_variant: 'ticket',
    });
  }

  return tickets;
}

function interestPendingTicket(
  interest: LunchStatusResponse,
): DeskPlacedItem[] {
  if (interest.status !== 'matched' && interest.status !== 'pending') {
    return [];
  }
  return [
    {
      id: 'ticket-interest',
      kind: 'buddy_ticket',
      title:
        interest.status === 'matched' ? '兴趣搭子券' : '兴趣排队中',
      detail: interest.venue_name ?? interest.match_code ?? undefined,
      slot: 'tickets',
      sort: 999,
      reward_variant: 'badge',
    },
  ];
}

function mentorRewards(wp: WorkplaceResponse): DeskPlacedItem[] {
  const main = wp.mentors.find((m) => m.type === 'main') ?? wp.mentors[0];
  if (!main) return [];
  return [
    {
      id: `mentor-reward-${main.id}`,
      kind: 'mentor_reward',
      title: '导师鼓励卡',
      detail: `${main.name} 签发`,
      slot: 'mentor',
      sort: 0,
    },
    {
      id: 'mentor-sticker',
      kind: 'mentor_reward',
      title: '带教小贴纸',
      detail: '完成首次私信可得',
      slot: 'mentor',
      sort: 1,
    },
  ];
}

function scatterStars(flash: FlashJarItem[]): DeskPlacedItem[] {
  return flash.slice(0, 4).map((f, i) => ({
    id: `star-${f.id}`,
    kind: 'star_jar',
    title: '折纸星星',
    detail:
      f.log_text.length > 12 ? `${f.log_text.slice(0, 12)}…` : f.log_text,
    slot: 'star_scatter' as const,
    sort: i,
  }));
}

export function buildDeskPayload(
  wp: WorkplaceResponse,
  flash: FlashJarItem[],
  lunch: LunchStatusResponse,
  interest: LunchStatusResponse,
  lunchRewards: DeskReward[] = [],
): MyDeskResponse {
  const jarItem: DeskPlacedItem = {
    id: 'jar-main',
    kind: 'star_jar',
    title: '高光星星瓶',
    detail: flash.length > 0 ? `${flash.length} 颗星` : '记录今日高光',
    slot: 'jar',
    sort: 0,
  };

  const earnedTickets = lunchEarnedTickets(lunchRewards, lunch);
  const interestTickets = interestPendingTicket(interest);

  const items: DeskPlacedItem[] = [
    ...honorFromWorkplace(wp),
    jarItem,
    ...earnedTickets,
    ...interestTickets,
    ...mentorRewards(wp),
    ...scatterStars(flash),
  ];

  const earnedCount = lunchRewards.length;
  const buddy_ticket_count =
    earnedCount +
    (interest.status === 'matched' || interest.status === 'pending' ? 1 : 0);

  return {
    items,
    star_count: flash.length,
    buddy_ticket_count,
    lunch_voucher_count: earnedCount,
  };
}
