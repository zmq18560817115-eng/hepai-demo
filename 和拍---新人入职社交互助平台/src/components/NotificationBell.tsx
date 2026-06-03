/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, MessageSquare, Utensils, Info } from 'lucide-react';
import { hepaiApi } from '../api/hepaiApi';
import type { NotificationItem } from '../api/types';

export type NotificationBellHandlers = {
  onMentorReply: (peerId: string, peerName: string) => void;
  onLunchMatched?: () => void;
  onInterestMatched?: () => void;
};

function typeIcon(type: NotificationItem['type']) {
  if (type === 'mentor_reply') return <MessageSquare size={14} />;
  if (type === 'lunch') return <Utensils size={14} />;
  return <Info size={14} />;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

export default function NotificationBell({
  handlers,
  disabled,
}: {
  handlers: NotificationBellHandlers;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (disabled) return;
    try {
      const data = await hepaiApi.getNotifications(true);
      setUnreadCount(data.unread_count);
      if (open) {
        const all = await hepaiApi.getNotifications(false);
        setItems(all.items);
      }
    } catch {
      /* 静默：未登录或后端未就绪 */
    }
  }, [disabled, open]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 20000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (!open || disabled) return;
    setLoading(true);
    hepaiApi
      .getNotifications(false)
      .then((data) => {
        setItems(data.items);
        setUnreadCount(data.unread_count);
      })
      .finally(() => setLoading(false));
  }, [open, disabled]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.read) {
      await hepaiApi.markNotificationRead(item.id).catch(() => {});
    }
    setOpen(false);
    if (item.type === 'mentor_reply' && item.peer_id) {
      const name = item.title.replace(/ 回复了你$/, '');
      handlers.onMentorReply(item.peer_id, name);
    } else if (item.type === 'lunch') {
      handlers.onLunchMatched?.();
    } else if (item.title.includes('兴趣搭子')) {
      handlers.onInterestMatched?.();
    }
    void refresh();
  };

  const handleMarkAllRead = async () => {
    await hepaiApi.markAllNotificationsRead().catch(() => {});
    setUnreadCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    void refresh();
  };

  if (disabled) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="消息通知"
        onClick={() => setOpen((v) => !v)}
        className="relative text-[#8f959e] hover:text-[#1677ff] p-1 rounded transition-colors"
      >
        <Bell size={16} strokeWidth={2} />
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 border border-white"
            aria-hidden
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,22rem)] z-[100] bg-white rounded-2xl border border-outline-variant/40 shadow-neo">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-900">消息通知</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                全部标为已读
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <p className="px-4 py-6 text-xs text-slate-400 font-mono animate-pulse">
                加载中…
              </p>
            )}
            {!loading && items.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-slate-400">
                暂无消息
              </p>
            )}
            {!loading &&
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void handleItemClick(item)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-primary-container/50 transition-colors ${
                    !item.read ? 'bg-primary-container/30' : ''
                  }`}
                >
                  <div className="flex gap-2">
                    <span
                      className={`shrink-0 mt-0.5 ${
                        !item.read ? 'text-primary' : 'text-slate-400'
                      }`}
                    >
                      {typeIcon(item.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs font-medium truncate ${
                            !item.read ? 'text-slate-900' : 'text-slate-600'
                          }`}
                        >
                          {item.title}
                        </p>
                        {!item.read && (
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {item.body}
                      </p>
                      <p className="text-[9px] font-mono text-slate-400 mt-1">
                        {formatTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
