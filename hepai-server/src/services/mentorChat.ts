import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';

export function isAssignedPair(
  db: Database.Database,
  userA: string,
  userB: string,
): boolean {
  const row = db
    .prepare(
      `SELECT 1 FROM mentor_assignments
       WHERE (mentee_id = ? AND mentor_id = ?) OR (mentee_id = ? AND mentor_id = ?)`,
    )
    .get(userA, userB, userB, userA);
  return !!row;
}

export function resolveMenteeMentor(
  db: Database.Database,
  userId: string,
  peerId: string,
): { menteeId: string; mentorId: string } | null {
  const row = db
    .prepare(
      `SELECT mentee_id, mentor_id FROM mentor_assignments
       WHERE (mentee_id = ? AND mentor_id = ?) OR (mentee_id = ? AND mentor_id = ?)
       LIMIT 1`,
    )
    .get(userId, peerId, peerId, userId) as
    | { mentee_id: string; mentor_id: string }
    | undefined;
  if (!row) return null;
  return { menteeId: row.mentee_id, mentorId: row.mentor_id };
}

export function getOrCreateThread(
  db: Database.Database,
  menteeId: string,
  mentorId: string,
): string {
  const existing = db
    .prepare(
      `SELECT id FROM mentor_chat_threads WHERE mentee_id = ? AND mentor_id = ?`,
    )
    .get(menteeId, mentorId) as { id: string } | undefined;
  if (existing) return existing.id;

  const id = uuid();
  db.prepare(
    `INSERT INTO mentor_chat_threads (id, mentee_id, mentor_id) VALUES (?, ?, ?)`,
  ).run(id, menteeId, mentorId);
  return id;
}

export function listThreadMessages(
  db: Database.Database,
  threadId: string,
  limit = 100,
) {
  return db
    .prepare(
      `SELECT m.id, m.sender_id, m.content, m.created_at, u.nickname as sender_name, u.role as sender_role
       FROM mentor_chat_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.thread_id = ?
       ORDER BY m.created_at ASC
       LIMIT ?`,
    )
    .all(threadId, limit) as {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender_name: string;
    sender_role: string;
  }[];
}

export function sendThreadMessage(
  db: Database.Database,
  threadId: string,
  senderId: string,
  content: string,
) {
  const id = uuid();
  const trimmed = content.trim();
  db.prepare(
    `INSERT INTO mentor_chat_messages (id, thread_id, sender_id, content) VALUES (?, ?, ?, ?)`,
  ).run(id, threadId, senderId, trimmed);
  db.prepare(
    `UPDATE mentor_chat_threads SET updated_at = datetime('now') WHERE id = ?`,
  ).run(threadId);
  try {
    const pair = db
      .prepare(`SELECT mentee_id, mentor_id FROM mentor_chat_threads WHERE id = ?`)
      .get(threadId) as { mentee_id: string; mentor_id: string } | undefined;
    if (pair) {
      db.prepare(
        `INSERT INTO mentor_touchpoints
         (id, mentee_id, mentor_id, channel, touch_type, source_id)
         VALUES (?, ?, ?, 'mentor_chat', 'message', ?)`,
      ).run(uuid(), pair.mentee_id, pair.mentor_id, id);
    }
  } catch {
    // ignore on legacy DB
  }
  const row = db
    .prepare(
      `SELECT m.id, m.sender_id, m.content, m.created_at, u.nickname as sender_name, u.role as sender_role
       FROM mentor_chat_messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?`,
    )
    .get(id) as {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender_name: string;
    sender_role: string;
  };
  return row;
}

export function listInboxForUser(db: Database.Database, userId: string) {
  const user = db
    .prepare(`SELECT role FROM users WHERE id = ?`)
    .get(userId) as { role: string };

  const threads = db
    .prepare(
      user.role === 'mentor'
        ? `SELECT t.id, t.mentee_id, t.mentor_id, t.updated_at,
                  u.id as peer_id, u.nickname as peer_name, u.avatar_url as peer_avatar, u.role as peer_role
           FROM mentor_chat_threads t
           JOIN users u ON u.id = t.mentee_id
           WHERE t.mentor_id = ?
           ORDER BY t.updated_at DESC`
        : `SELECT t.id, t.mentee_id, t.mentor_id, t.updated_at,
                  u.id as peer_id, u.nickname as peer_name, u.avatar_url as peer_avatar, u.role as peer_role
           FROM mentor_chat_threads t
           JOIN users u ON u.id = t.mentor_id
           WHERE t.mentee_id = ?
           ORDER BY t.updated_at DESC`,
    )
    .all(userId) as Record<string, string>[];

  return threads.map((t) => {
    const last = db
      .prepare(
        `SELECT m.content, m.sender_id, m.created_at, u.nickname as sender_name
         FROM mentor_chat_messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.thread_id = ?
         ORDER BY m.created_at DESC LIMIT 1`,
      )
      .get(t.id) as
      | {
          content: string;
          sender_id: string;
          created_at: string;
          sender_name: string;
        }
      | undefined;

    const unread = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM mentor_chat_messages
           WHERE thread_id = ? AND sender_id != ?`,
        )
        .get(t.id, userId) as { c: number }
    ).c;

    return {
      thread_id: t.id,
      peer: {
        id: t.peer_id,
        name: t.peer_name,
        avatar_url: t.peer_avatar,
        role: t.peer_role,
      },
      updated_at: t.updated_at,
      last_message: last
        ? {
            content: last.content,
            sender_id: last.sender_id,
            sender_name: last.sender_name,
            created_at: last.created_at,
            is_mine: last.sender_id === userId,
          }
        : null,
      message_count: unread,
    };
  });
}
