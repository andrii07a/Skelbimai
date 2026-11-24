// REST API used by the public React site. All answers are JSON.
// Blocked ads, blocked comments and everything from blocked users are never returned.
const express = require('express');
const db = require('../db/database');
const auth = require('../services/authService');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// Common SELECT for ad lists. "?" #1 = id of the logged-in user (0 if nobody), for the ⭐ flag.
const AD_SELECT = `
  SELECT a.id, a.title, a.description, a.price, a.image, a.created_at,
         a.category_id, c.name AS category_name, u.username AS owner,
         (SELECT COUNT(*) FROM comments m JOIN users mu ON mu.id = m.user_id
           WHERE m.ad_id = a.id AND m.is_blocked = 0 AND mu.is_blocked = 0) AS comment_count,
         EXISTS (SELECT 1 FROM favorites f WHERE f.ad_id = a.id AND f.user_id = ?) AS is_favorite
    FROM ads a
    JOIN categories c ON c.id = a.category_id
    JOIN users u      ON u.id = a.user_id
   WHERE a.is_blocked = 0 AND u.is_blocked = 0`;

const toAd = (row) => ({ ...row, is_favorite: Boolean(row.is_favorite) });
const currentUserId = (req) => (req.user ? req.user.id : 0);

function findVisibleAd(req, id) {
  const row = db.prepare(`${AD_SELECT} AND a.id = ?`).get(currentUserId(req), Number(id));
  return row ? toAd(row) : null;
}

// ---------- Categories ----------
router.get('/categories', (req, res) => {
  const categories = db
    .prepare(
      `SELECT c.id, c.name,
              (SELECT COUNT(*) FROM ads a JOIN users u ON u.id = a.user_id
                WHERE a.category_id = c.id AND a.is_blocked = 0 AND u.is_blocked = 0) AS ad_count
         FROM categories c ORDER BY c.name`
    )
    .all();
  res.json(categories);
});

// ---------- Ads: search by category and word / phrase ----------
// GET /api/ads?category=2&q=bike&sort=price_asc   (sort: newest | price_asc | price_desc)
router.get('/ads', (req, res) => {
  let sql = AD_SELECT;
  const params = [currentUserId(req)];

  const categoryId = Number(req.query.category);
  if (Number.isInteger(categoryId) && categoryId > 0) {
    sql += ' AND a.category_id = ?';
    params.push(categoryId);
  }

  const q = String(req.query.q ?? '').trim().slice(0, 100);
  if (q) {
    // % and _ typed by the user are searched literally
    const pattern = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
    sql += " AND (a.title LIKE ? ESCAPE '\\' OR a.description LIKE ? ESCAPE '\\')";
    params.push(pattern, pattern);
  }

  // Sorting: only these values are allowed (never put user text straight into SQL)
  const SORTS = {
    newest: 'a.created_at DESC, a.id DESC',
    price_asc: 'a.price ASC, a.id DESC',
    price_desc: 'a.price DESC, a.id DESC',
  };
  sql += ' ORDER BY ' + (SORTS[req.query.sort] || SORTS.newest);
  res.json(db.prepare(sql).all(...params).map(toAd));
});

// One ad with its visible comments
router.get('/ads/:id', (req, res) => {
  const ad = findVisibleAd(req, req.params.id);
  if (!ad) return res.status(404).json({ error: 'Ad not found.' });

  ad.comments = db
    .prepare(
      `SELECT m.id, m.text, m.created_at, u.username
         FROM comments m JOIN users u ON u.id = m.user_id
        WHERE m.ad_id = ? AND m.is_blocked = 0 AND u.is_blocked = 0
        ORDER BY m.created_at, m.id`
    )
    .all(ad.id);
  res.json(ad);
});

// ---------- Comments ----------
router.post('/ads/:id/comments', requireLogin, (req, res) => {
  const ad = findVisibleAd(req, req.params.id);
  if (!ad) return res.status(404).json({ error: 'Ad not found.' });

  const text = String(req.body.text ?? '').trim();
  if (text.length < 1 || text.length > 1000) {
    return res.status(400).json({ error: 'A comment must be 1-1000 characters long.' });
  }

  const { lastInsertRowid } = db
    .prepare('INSERT INTO comments (ad_id, user_id, text) VALUES (?, ?, ?)')
    .run(ad.id, req.user.id, text);
  const comment = db
    .prepare('SELECT m.id, m.text, m.created_at, u.username FROM comments m JOIN users u ON u.id = m.user_id WHERE m.id = ?')
    .get(lastInsertRowid);
  res.status(201).json(comment);
});

// ---------- Favorites (⭐), saved in the database ----------
router.get('/favorites', requireLogin, (req, res) => {
  const rows = db
    .prepare(
      `${AD_SELECT} AND a.id IN (SELECT ad_id FROM favorites WHERE user_id = ?)
       ORDER BY a.created_at DESC, a.id DESC`
    )
    .all(req.user.id, req.user.id);
  res.json(rows.map(toAd));
});

router.post('/favorites/:adId', requireLogin, (req, res) => {
  const ad = findVisibleAd(req, req.params.adId);
  if (!ad) return res.status(404).json({ error: 'Ad not found.' });
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, ad_id) VALUES (?, ?)').run(req.user.id, ad.id);
  res.json({ ad_id: ad.id, is_favorite: true });
});

router.delete('/favorites/:adId', requireLogin, (req, res) => {
  const adId = Number(req.params.adId);
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND ad_id = ?').run(req.user.id, adId);
  res.json({ ad_id: adId, is_favorite: false });
});

// ---------- Registration and login (same logic as the admin pages) ----------
router.post('/register', async (req, res) => {
  const result = await auth.register(req.body);
  if (result.errors) return res.status(400).json({ error: 'Please fix the errors.', errors: result.errors });
  await auth.startSession(req, result.user.id);
  res.status(201).json({ user: auth.publicUser(result.user) });
});

router.post('/login', async (req, res) => {
  const result = await auth.login(req.body);
  if (result.error) return res.status(401).json({ error: result.error });
  await auth.startSession(req, result.user.id);
  res.json({ user: auth.publicUser(result.user) });
});

router.post('/logout', async (req, res) => {
  await auth.endSession(req);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  res.json({ user: auth.publicUser(req.user) });
});

// Unknown API address
router.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

module.exports = router;
