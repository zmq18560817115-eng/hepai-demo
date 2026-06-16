/**
 * 设计展示页 → 内嵌演示 iframe 的一键跳转
 */
import type { AppView, UserType } from '../types';

const KEY = 'hepai_showcase_jump_v1';

export interface ShowcaseJump {
  role: UserType;
  /** 新人演示工号，如 E00001 / E00008 */
  employeeId?: string;
  /** 新人登录后进入的功能页 */
  newcomerView?: AppView;
  /** 是否走首次接入（礼包→团队→盲盒） */
  firstTimeFlow?: boolean;
}

export function setShowcaseJump(jump: ShowcaseJump) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(jump));
  } catch {
    /* ignore */
  }
}

export function consumeShowcaseJump(): ShowcaseJump | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as ShowcaseJump;
  } catch {
    return null;
  }
}
