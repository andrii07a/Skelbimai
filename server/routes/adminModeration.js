// Admin-only pages: categories, users, blocking ads and comments.
const express = require('express');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
const ADMIN_PATHS = ['/categories', '/users', '/moderation'];
router.use(ADMIN_PATHS, requireAdmin); // ordinary users get "Access denied"

// ---------- Categories ----------
function renderCategories(res, { error = null, value = '', status = 200 } = {}) {
  const categories = db
    .prepare(
      `SELECT c.id, c.name, COUNT(a.id) AS ad_count
         FROM categories c LEFT JOIN ads a ON a.category_id = c.id
        GROUP BY c.id ORDER BY c.name`
    )
    .all();
  res.status(status).render('admin/categories', { title: 'Categories', categories, error, value });
}

router.get('/categories', (req, res) => renderCategories(res));

router.post('/categories', (req, res) => {
  const name = String(req.body.name ?? '').trim();
  if (name.length < 2 || name.length > 50) {
    return renderCategories(res, { error: 'Category name must be 2-50 characters long.', value: name, status: 400 });
  }
  if (db.prepare('SELECT 1 FROM categories WHERE name = ?').get(name)) {
    return renderCategories(res, { error: 'This category already exists.', value: name, status: 400 });
  }
  db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
  req.flash('success', `Category "${name}" was created.`);
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', (req, res) => {
  const id = Number(req.params.id);
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM ads WHERE category_id = ?').get(id);
  if (n > 0) {
    req.flash('danger', `This category has ${n} ad(s), so it cannot be deleted. Move or delete those ads first.`);
  } else {
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    req.flash('success', 'The category was deleted.');
  }
  res.redirect('/admin/categories');
});

// ---------- Users ----------
router.get('/users', (req, res) => {
  const users = db
    .prepare(
      `SELECT u.id, u.username, u.email, u.role, u.is_blocked, u.created_at,
              (SELECT COUNT(*) FROM ads a WHERE a.user_id = u.id) AS ad_count
         FROM users u ORDER BY u.id`
    )
    .all();
  res.render('admin/users', { title: 'Users', users });
});

router.post('/users/:id/toggle-block', (req, res) => {
  const user = db.prepare('SELECT id, username, is_blocked FROM users WHERE id = ?').get(Number(req.params.id));
  if (!user) {
    req.flash('danger', 'User not found.');
  } else if (user.id === req.user.id) {
    req.flash('danger', 'You cannot block yourself.');
  } else {
    db.prepare('UPDATE users SET is_blocked = ? WHERE id = ?').run(user.is_blocked ? 0 : 1, user.id);
    req.flash('success', `User "${user.username}" was ${user.is_blocked ? 'unblocked' : 'blocked'}.`);
  }
  res.redirect('/admin/users');
});

// ---------- All ads ----------
router.get('/moderation/ads', (req, res) => {
  const allAds = db
    .prepare(
      `SELECT a.id, a.title, a.price, a.image, a.is_blocked, c.name AS category_name,
              u.username AS owner, u.is_blocked AS owner_blocked
         FROM ads a
         JOIN categories c ON c.id = a.category_id
         JOIN users u      ON u.id = a.user_id
        ORDER BY a.created_at DESC, a.id DESC`
    )
    .all();
  res.render('admin/ads', { title: 'All ads', ads: allAds });
});

router.post('/moderation/ads/:id/toggle-block', (req, res) => {
  const ad = db.prepare('SELECT id, title, is_blocked FROM ads WHERE id = ?').get(Number(req.params.id));
  if (ad) {
    db.prepare('UPDATE ads SET is_blocked = ? WHERE id = ?').run(ad.is_blocked ? 0 : 1, ad.id);
    req.flash('success', `Ad "${ad.title}" was ${ad.is_blocked ? 'unblocked' : 'blocked'}.`);
  }
  res.redirect('/admin/moderation/ads');
});

// ---------- All comments ----------
router.get('/moderation/comments', (req, res) => {
  const comments = db
    .prepare(
      `SELECT m.id, m.text, m.is_blocked, m.created_at, m.ad_id,
              a.title AS ad_title, u.username AS author
         FROM comments m
         JOIN ads a   ON a.id = m.ad_id
         JOIN users u ON u.id = m.user_id
        ORDER BY m.created_at DESC, m.id DESC`
    )
    .all();
  res.render('admin/comments', { title: 'All comments', comments });
});

router.post('/moderation/comments/:id/toggle-block', (req, res) => {
  const comment = db.prepare('SELECT id, is_blocked FROM comments WHERE id = ?').get(Number(req.params.id));
  if (comment) {
    db.prepare('UPDATE comments SET is_blocked = ? WHERE id = ?').run(comment.is_blocked ? 0 : 1, comment.id);
    req.flash('success', `The comment was ${comment.is_blocked ? 'unblocked' : 'blocked'}.`);
  }
  res.redirect('/admin/moderation/comments');
});

module.exports = router;
