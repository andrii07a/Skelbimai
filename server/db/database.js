// Turgus database: one SQLite file (server/data/app.db) through Node's built-in node:sqlite.
// Tables are created on start-up; an empty database is filled with demo data.
const fs = require('node:fs');

// node:sqlite exists since Node.js 22.13
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`Turgus needs Node.js 22.13 or newer, but this computer has ${process.version}. Get it at https://nodejs.org`);
  process.exit(1);
}

const { DatabaseSync } = require('node:sqlite');
const { DATA_DIR, DB_FILE, UPLOAD_DIR } = require('../paths');
const fillWithDemoData = require('./demoData');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(DB_FILE);

/*
  Data model
  ----------
  users           1 ── * listings        a user sells many listings
  categories      1 ── * listings        every listing is in one category
  listings        1 ── * comments        buyers ask questions under a listing
  users           1 ── * comments        a comment has one author
  users  * ── saved_listings ── *  listings   (many-to-many: the ★ list)

  "blocked_at" is empty (NULL) for normal rows and holds the date when an administrator blocked it.
  Prices are stored in cents (INTEGER), so 19.99 € is 1999 — no rounding problems with decimals.
*/
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    blocked_at    TEXT,
    joined_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id    INTEGER PRIMARY KEY,
    title TEXT NOT NULL UNIQUE COLLATE NOCASE
  );

  CREATE TABLE IF NOT EXISTS listings (
    id          INTEGER PRIMARY KEY,
    seller_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title       TEXT    NOT NULL,
    details     TEXT    NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    photo       TEXT    NOT NULL,
    blocked_at  TEXT,
    posted_at   TEXT NOT NULL DEFAULT (datetime('now')),
    edited_at   TEXT
  );

  CREATE TABLE IF NOT EXISTS comments (
    id         INTEGER PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    author_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body       TEXT    NOT NULL,
    blocked_at TEXT,
    posted_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS saved_listings (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    saved_at   TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, listing_id)
  );

  CREATE INDEX IF NOT EXISTS listings_by_category ON listings(category_id);
  CREATE INDEX IF NOT EXISTS listings_by_seller   ON listings(seller_id);
  CREATE INDEX IF NOT EXISTS comments_by_listing  ON comments(listing_id);
`);

const isEmpty = db.prepare('SELECT NOT EXISTS (SELECT 1 FROM users) AS empty').get().empty === 1;
if (isEmpty) fillWithDemoData(db);

module.exports = db;
