import Database from 'better-sqlite3';
import { resolve } from 'path';
import { mkdirSync } from 'fs';
import type { CycleResult } from './types.js';
import type { AgentLogger } from './logger.js';

const DB_DIR = resolve(process.cwd(), 'data');
const DB_PATH = resolve(DB_DIR, 'state.db');

export class StateManager {
  private db: Database.Database;
  private logger: AgentLogger;

  constructor(logger: AgentLogger) {
    this.logger = logger;
    mkdirSync(DB_DIR, { recursive: true });
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.migrate();
    logger.debug('State database initialised', { event: 'state_init', path: DB_PATH });
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS processed_notifications (
        id TEXT PRIMARY KEY,
        processed_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS followed_users (
        pubkey TEXT PRIMARY KEY,
        nickname TEXT,
        followed_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS voted_posts (
        post_id TEXT PRIMARY KEY,
        vote_type TEXT NOT NULL,
        voted_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS last_proactive_post (
        id INTEGER PRIMARY KEY,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cycle_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        cycle_number INTEGER NOT NULL,
        notifications_total INTEGER NOT NULL DEFAULT 0,
        notifications_new INTEGER NOT NULL DEFAULT 0,
        actions_count INTEGER NOT NULL DEFAULT 0,
        errors_count INTEGER NOT NULL DEFAULT 0,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        claude_summary TEXT
      );
    `);
  }

  // --- Notifications ---

  isNotificationProcessed(id: string): boolean {
    const row = this.db.prepare('SELECT 1 FROM processed_notifications WHERE id = ?').get(id);
    return row !== undefined;
  }

  markNotificationProcessed(id: string): void {
    this.db.prepare(
      'INSERT OR IGNORE INTO processed_notifications (id, processed_at) VALUES (?, ?)'
    ).run(id, Date.now());
    this.logger.debug('Notification marked as processed', { event: 'state_updated', id });
  }

  markNotificationsProcessed(ids: string[]): void {
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO processed_notifications (id, processed_at) VALUES (?, ?)'
    );
    const insertMany = this.db.transaction((items: string[]) => {
      for (const id of items) stmt.run(id, Date.now());
    });
    insertMany(ids);
    this.logger.debug('Notifications batch marked as processed', { event: 'state_updated', count: ids.length });
  }

  // --- Followed users ---

  isUserFollowed(pubkey: string): boolean {
    const row = this.db.prepare('SELECT 1 FROM followed_users WHERE pubkey = ?').get(pubkey);
    return row !== undefined;
  }

  markUserFollowed(pubkey: string, nickname?: string): void {
    this.db.prepare(
      'INSERT OR IGNORE INTO followed_users (pubkey, nickname, followed_at) VALUES (?, ?, ?)'
    ).run(pubkey, nickname ?? null, Date.now());
    this.logger.debug('User marked as followed', { event: 'state_updated', pubkey, nickname });
  }

  getAllFollowedPubkeys(): string[] {
    const rows = this.db.prepare('SELECT pubkey FROM followed_users').all() as { pubkey: string }[];
    return rows.map(r => r.pubkey);
  }

  // --- Voted posts ---

  isPostVoted(postId: string): boolean {
    const row = this.db.prepare('SELECT 1 FROM voted_posts WHERE post_id = ?').get(postId);
    return row !== undefined;
  }

  markPostVoted(postId: string, voteType: string): void {
    this.db.prepare(
      'INSERT OR IGNORE INTO voted_posts (post_id, vote_type, voted_at) VALUES (?, ?, ?)'
    ).run(postId, voteType, Date.now());
    this.logger.debug('Post marked as voted', { event: 'state_updated', postId, voteType });
  }

  getAllVotedPostIds(): string[] {
    const rows = this.db.prepare('SELECT post_id FROM voted_posts').all() as { post_id: string }[];
    return rows.map(r => r.post_id);
  }

  // --- Proactive posts ---

  markPostCreated(): void {
    this.db.prepare(
      'INSERT OR REPLACE INTO last_proactive_post (id, created_at) VALUES (1, ?)'
    ).run(Date.now());
  }

  getLastPostTimestamp(): number | null {
    const row = this.db.prepare(
      'SELECT created_at FROM last_proactive_post WHERE id = 1'
    ).get() as { created_at: number } | undefined;
    return row?.created_at ?? null;
  }

  // --- Cycle log ---

  saveCycleResult(result: CycleResult): void {
    this.db.prepare(`
      INSERT INTO cycle_log (
        timestamp, cycle_number, notifications_total, notifications_new,
        actions_count, errors_count, duration_ms, claude_summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      result.timestamp,
      result.cycleNumber,
      result.notificationsTotal,
      result.notificationsNew,
      result.actionsPerformed.length,
      result.errors.length,
      result.durationMs,
      result.claudeSummary,
    );
  }

  // --- Maintenance ---

  cleanup(olderThanDays: number = 90): void {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const { changes } = this.db.prepare(
      'DELETE FROM processed_notifications WHERE processed_at < ?'
    ).run(cutoff);
    if (changes > 0) {
      this.logger.info('Old notifications pruned from state', { event: 'state_cleanup', deleted: changes });
    }
  }

  close(): void {
    this.db.close();
  }
}
