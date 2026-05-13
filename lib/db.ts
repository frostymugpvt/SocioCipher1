import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let DB_DIR = path.join(process.cwd(), 'data');
if (process.env.NODE_ENV === 'production') {
  DB_DIR = '/tmp/data';
}
const DB_PATH = path.join(DB_DIR, 'sociocipher.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  const tables = [
    {
      name: 'users',
      sql: `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone_number TEXT UNIQUE,
        public_key TEXT UNIQUE,
        alias TEXT NOT NULL UNIQUE,
        trust_score INTEGER NOT NULL DEFAULT 50,
        account_status TEXT NOT NULL DEFAULT 'active',
        suspension_until TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:00Z', 'now')),
        last_active_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:00Z', 'now')),
        is_under_investigation INTEGER NOT NULL DEFAULT 0
      );`
    },
    {
      name: 'otp_codes',
      sql: `CREATE TABLE IF NOT EXISTS otp_codes (
        phone_number TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`
    },
    {
      name: 'sessions',
      sql: `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        alias TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`
    },
    {
      name: 'posts',
      sql: `CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        alias TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        is_sensitive INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:00Z', 'now')),
        expires_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        hide_vote_count INTEGER NOT NULL DEFAULT 0,
        report_count INTEGER NOT NULL DEFAULT 0,
        retention_hold INTEGER NOT NULL DEFAULT 0
      );`
    },
    {
      name: 'comments',
      sql: `CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
        alias TEXT NOT NULL,
        content TEXT NOT NULL,
        depth INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:00Z', 'now')),
        expires_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        hide_vote_count INTEGER NOT NULL DEFAULT 0,
        retention_hold INTEGER NOT NULL DEFAULT 0,
        report_count INTEGER NOT NULL DEFAULT 0
      );`
    },
    {
      name: 'communities',
      sql: `CREATE TABLE IF NOT EXISTS communities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        creator_alias TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:00Z', 'now')),
        status TEXT NOT NULL DEFAULT 'active',
        report_count INTEGER NOT NULL DEFAULT 0
      );`
    },
    {
      name: 'chat_rooms',
      sql: `CREATE TABLE IF NOT EXISTS chat_rooms (
        id TEXT PRIMARY KEY,
        community_id TEXT REFERENCES communities(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        creator_alias TEXT NOT NULL,
        logo_id TEXT NOT NULL DEFAULT 'default',
        visibility TEXT NOT NULL DEFAULT 'public',
        is_sensitive INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:00Z', 'now')),
        last_message_at TEXT,
        report_count INTEGER NOT NULL DEFAULT 0
      );`
    },
    {
      name: 'room_messages',
      sql: `CREATE TABLE IF NOT EXISTS room_messages (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
        alias TEXT NOT NULL,
        content TEXT,
        ciphertext TEXT,
        iv TEXT,
        reply_to_id TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:00Z', 'now')),
        expires_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        retention_hold INTEGER NOT NULL DEFAULT 0,
        report_count INTEGER NOT NULL DEFAULT 0
      );`
    },
    {
      name: 'room_memberships',
      sql: `CREATE TABLE IF NOT EXISTS room_memberships (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
        alias TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TEXT NOT NULL DEFAULT (datetime('now')),
        is_muted INTEGER NOT NULL DEFAULT 0,
        UNIQUE(room_id, alias)
      );`
    },
    {
      name: 'user_blocks',
      sql: `CREATE TABLE IF NOT EXISTS user_blocks (
        id TEXT PRIMARY KEY,
        blocker_alias TEXT NOT NULL,
        blocked_alias TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(blocker_alias, blocked_alias)
      );`
    },
    {
      name: 'muted_entities',
      sql: `CREATE TABLE IF NOT EXISTS muted_entities (
        id TEXT PRIMARY KEY,
        muter_alias TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_value TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(muter_alias, entity_type, entity_value)
      );`
    },
    {
      name: 'reports',
      sql: `CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL UNIQUE,
        reporter_alias TEXT,
        content_type TEXT NOT NULL,
        content_id TEXT NOT NULL,
        category TEXT NOT NULL,
        additional_context TEXT,
        evidence TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`
    },
    {
      name: 'trust_history',
      sql: `CREATE TABLE IF NOT EXISTS trust_history (
        id TEXT PRIMARY KEY,
        giver_alias TEXT NOT NULL,
        receiver_alias TEXT NOT NULL,
        points INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(giver_alias, receiver_alias)
      );`
    },
    {
      name: 'direct_messages',
      sql: `CREATE TABLE IF NOT EXISTS direct_messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        content TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:00Z', 'now'))
      );`
    },
    {
      name: 'moderation_logs',
      sql: `CREATE TABLE IF NOT EXISTS moderation_logs (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        alias TEXT,
        flag TEXT,
        reason TEXT,
        allowed INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:00Z', 'now'))
      );`
    },
    {
      name: 'security_audit_logs',
      sql: `CREATE TABLE IF NOT EXISTS security_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        event_type TEXT NOT NULL,
        details TEXT,
        ip_hash TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`
    },
    {
      name: 'rate_limits',
      sql: `CREATE TABLE IF NOT EXISTS rate_limits (
        id TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        first_request INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );`
    },
    {
      name: 'hide_votes',
      sql: `CREATE TABLE IF NOT EXISTS hide_votes (
        id TEXT PRIMARY KEY,
        voter_alias TEXT NOT NULL,
        content_type TEXT NOT NULL,
        content_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(voter_alias, content_type, content_id)
      );`
    }
  ];

  for (const table of tables) {
    try {
      db.exec(table.sql);
      // console.log(`[DB] Table checked: ${table.name}`);
    } catch (e) {
      console.error(`[DB] Error creating table ${table.name}:`, e);
    }
  }

  // Create Indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_posts_expires ON posts(expires_at) WHERE status = "active"',
    'CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_posts_alias ON posts(alias)',
    'CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)',
    'CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id)',
    'CREATE INDEX IF NOT EXISTS idx_room_msgs_room ON room_messages(room_id, created_at)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)',
    'CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at)',
    'CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number)'
  ];

  for (const idx of indexes) {
    try {
      db.exec(idx);
    } catch (e) {
      console.error('[DB] Error creating index:', e);
    }
  }


  // Schema Upgrades for existing DBs
  const tablesToUpgrade = ['comments', 'chat_rooms', 'room_messages', 'communities'];
  for (const table of tablesToUpgrade) {
    const columns = db.pragma(`table_info(${table})`) as any[];
    if (!columns.some(c => c.name === 'report_count')) {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN report_count INTEGER NOT NULL DEFAULT 0;`);
      } catch (e) { console.warn(`Could not add report_count to ${table}`); }
    }
  }

  // E2EE Upgrade
  const msgColumns = db.pragma(`table_info(room_messages)`) as any[];
  if (!msgColumns.some(c => c.name === 'ciphertext')) {
    db.exec(`ALTER TABLE room_messages ADD COLUMN ciphertext TEXT;`);
    db.exec(`ALTER TABLE room_messages ADD COLUMN iv TEXT;`);
    // Make content nullable
    // In SQLite, we can't easily change NOT NULL to NULL, but we can just allow it in new inserts.
  }

  // Reports Evidence Upgrade
  const reportColumns = db.pragma(`table_info(reports)`) as any[];
  if (!reportColumns.some(c => c.name === 'evidence')) {
    db.exec(`ALTER TABLE reports ADD COLUMN evidence TEXT;`);
  }

  // Anonymity Upgrade
  const userColumns = db.pragma(`table_info(users)`) as any[];
  if (!userColumns.some(c => c.name === 'public_key')) {
    db.exec(`ALTER TABLE users ADD COLUMN public_key TEXT UNIQUE;`);
  }
  if (!userColumns.some(c => c.name === 'role')) {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';`);
  }

  // Communities & Restriction Upgrade
  const roomColumns = db.pragma(`table_info(chat_rooms)`) as any[];
  if (!roomColumns.some(c => c.name === 'community_id')) {
    db.pragma('foreign_keys = OFF');
    db.exec(`ALTER TABLE chat_rooms ADD COLUMN community_id TEXT;`);
    db.pragma('foreign_keys = ON');
  }
  if (!roomColumns.some(c => c.name === 'is_restricted')) {
    db.exec(`ALTER TABLE chat_rooms ADD COLUMN is_restricted INTEGER NOT NULL DEFAULT 0;`);
  }

  // Fix trust_history: remove UNIQUE(giver_alias, receiver_alias) which blocks re-trusting
  // We do this by checking if the old unique constraint table exists and migrating
  try {
    const trustCols = db.pragma(`table_info(trust_history)`) as any[];
    if (trustCols.length > 0) {
      // Recreate without the UNIQUE pair constraint to allow re-trusting after 2 days
      db.exec(`
        CREATE TABLE IF NOT EXISTS trust_history_v2 (
          id TEXT PRIMARY KEY,
          giver_alias TEXT NOT NULL,
          receiver_alias TEXT NOT NULL,
          points INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      // Check if old table had unique constraint by checking index info
      const indexes = db.pragma(`index_list(trust_history)`) as any[];
      const hasUniqueIdx = indexes.some((idx: any) => idx.unique === 1 && idx.name !== 'sqlite_autoindex_trust_history_1');
      if (hasUniqueIdx) {
        db.exec(`
          INSERT OR IGNORE INTO trust_history_v2 SELECT * FROM trust_history;
          DROP TABLE trust_history;
          ALTER TABLE trust_history_v2 RENAME TO trust_history;
        `);
      }
    }
  } catch (e) { console.warn('trust_history migration skipped:', e); }
}

export default getDb;
