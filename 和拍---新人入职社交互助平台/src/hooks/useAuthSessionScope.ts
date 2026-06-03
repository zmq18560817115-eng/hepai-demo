/**
 * 订阅登录用户切换（sessionEpoch），用于清空并重新加载用户私有数据
 */
import { useEffect, useState } from 'react';
import {
  AUTH_USER_CHANGED_EVENT,
  getCurrentUserId,
  getSessionEpoch,
} from '../api/sessionScope';

export function useAuthSessionScope() {
  const [sessionEpoch, setSessionEpoch] = useState(getSessionEpoch);
  const [userId, setUserId] = useState<string | null>(getCurrentUserId);

  useEffect(() => {
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ userId: string | null; epoch?: number }>)
        .detail;
      setUserId(detail?.userId ?? getCurrentUserId());
      setSessionEpoch(detail?.epoch ?? getSessionEpoch());
    };
    window.addEventListener(AUTH_USER_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(AUTH_USER_CHANGED_EVENT, onChanged);
  }, []);

  return { sessionEpoch, userId };
}
