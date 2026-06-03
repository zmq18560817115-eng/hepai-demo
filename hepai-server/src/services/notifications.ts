import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';

export type NotificationType = 'mentor_reply' | 'system' | 'lunch';

export function formatNotification(row: Record<string, unknown>) {
  return {
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    read: Boolean(row.read),
    peer_id: row.peer_id ?? null,
    created_at: row.created_at,
  };
}

export function listNotifications(
  db: Database.Database,
  userId: string,
  unreadOnly = false,
) {
  const rows = db
    .prepare(
      `SELECT id, type, title, body, read, peer_id, created_at
       FROM notifications
       WHERE user_id = ? ${unreadOnly ? 'AND read = 0' : ''}
       ORDER BY created_at DESC
       LIMIT 50`,
    )
    .all(userId) as Record<string, unknown>[];

  const unread = db
    .prepare(
      `SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0`,
    )
    .get(userId) as { c: number };

  return {
    unread_count: unread.c,
    items: rows.map(formatNotification),
  };
}

export function createNotification(
  db: Database.Database,
  opts: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    peerId?: string | null;
  },
) {
  const id = uuid();
  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, body, peer_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    opts.userId,
    opts.type,
    opts.title,
    opts.body,
    opts.peerId ?? null,
  );
  return id;
}

export function markNotificationRead(
  db: Database.Database,
  userId: string,
  notificationId: string,
) {
  const r = db
    .prepare(
      `UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`,
    )
    .run(notificationId, userId);
  return r.changes > 0;
}

export function markAllNotificationsRead(
  db: Database.Database,
  userId: string,
) {
  db.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0`).run(
    userId,
  );
}

export function markMentorPeerNotificationsRead(
  db: Database.Database,
  userId: string,
  peerId: string,
) {
  db.prepare(
    `UPDATE notifications SET read = 1
     WHERE user_id = ? AND peer_id = ? AND type = 'mentor_reply' AND read = 0`,
  ).run(userId, peerId);
}

export function notifyMentorReply(
  db: Database.Database,
  recipientId: string,
  senderName: string,
  content: string,
  senderId: string,
) {
  const excerpt =
    content.length > 80 ? `${content.slice(0, 80)}…` : content;
  createNotification(db, {
    userId: recipientId,
    type: 'mentor_reply',
    title: `${senderName} 回复了你`,
    body: excerpt,
    peerId: senderId,
  });
}

export function notifyLunchMatched(
  db: Database.Database,
  userId: string,
  matchCode: string,
  meetingPoint: string,
) {
  createNotification(db, {
    userId,
    type: 'lunch',
    title: '午餐匹配成功',
    body: `暗号 ${matchCode}，集合点 ${meetingPoint}`,
  });
}

export function notifyInterestMatched(
  db: Database.Database,
  userId: string,
  matchCode: string,
  meetingPoint: string,
) {
  createNotification(db, {
    userId,
    type: 'system',
    title: '兴趣搭子匹配成功',
    body: `暗号 ${matchCode}，集合点 ${meetingPoint}`,
  });
}
