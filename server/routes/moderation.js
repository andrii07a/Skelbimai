// Administrator tools: categories, members, blocking listings and comments.
// "Blocking" fills blocked_at with the current date; unblocking clears it again.
const express = require('express');
const db = require('../db/database');
const listings = require('../services/listings');
const { mustBeAdmin } = require('../middleware/access');

const router = express.Router();
router.use(['/categories', '/members', '/moderation'], mustBeAdmin);

const flipBlocked = (table) =>
  db.prepare(
    `UPDATE ${table} SET blocked_at = CASE WHEN blocked_at IS NULL THEN datetime('now') ELSE NULL END
      WHERE id = ? RETURNING blocked_at`
  );
const flipListing = flipBlocked('listings');
const flipComment = flipBlocked('comments');
const flipMember = flipBlocked('users');

// ===== Categories =====
function categoriesPage(res, { problem = null, typed = '', status = 200 } = {}) {
  const categories = db
    .prepare(
      `SELECT c.id, c.title, COUNT(l.id) AS used_by
         FROM categories c LEFT JOIN listings l ON l.category_id = c.id
        GROUP BY c.id ORDER BY c.title`
    )
    .all();
  res.status(status).render('moderation/categories', { title: 'Categories', categories, problem, typed });
}

router.get('/categories', (req, res) => categoriesPage(res));

router.post('/categories', (req, res) => {
  const title = String(req.body.title ?? '').trim();
  if (title.length < 2 || title.length > 40) {
    return categoriesPage(res, { problem: 'A category name needs 2 to 40 characters.', typed: title, status: 400 });
  }
  if (db.prepare('SELECT 1 FROM categories WHERE title = ?').get(title)) {
    return categoriesPage(res, { problem: `“${title}” is already on the list.`, typed: title, status: 400 });
  }
  db.prepare('INSERT INTO categories (title) VALUES (?)').run(title);
  req.notice('success', `Category “${title}” added.`);
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', (req, res) => {
  const id = Number(req.params.id) || 0;
  const used = db.prepare('SELECT COUNT(*) AS n FROM listings WHERE category_id = ?').get(id).n;
  if (used) {
    req.notice('warning', `This category still has ${used} listing(s), so it stays. Remove or move them first.`);
  } else {
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    req.notice('success', 'Category removed.');
  }
  res.redirect('/admin/categories');
});

// ===== Members =====
router.get('/members', (req, res) => {
  const people = db
    .prepare(
      `SELECT u.id, u.username, u.email, u.role, u.blocked_at, u.joined_at,
              (SELECT COUNT(*) FROM listings l WHERE l.seller_id = u.id) AS listings_total
         FROM users u ORDER BY u.joined_at, u.id`
    )
    .all();
  res.render('moderation/members', { title: 'Members', people });
});

router.post('/members/:id/suspend', (req, res) => {
  const id = Number(req.params.id) || 0;
  const person = db.prepare('SELECT username FROM users WHERE id = ?').get(id);
  if (!person) {
    req.notice('warning', 'That member does not exist.');
  } else if (id === req.member.id) {
    req.notice('warning', 'You cannot suspend your own account.');
  } else {
    const { blocked_at } = flipMember.get(id);
    req.notice('success', blocked_at ? `${person.username} is suspended and cannot sign in.` : `${person.username} can sign in again.`);
  }
  res.redirect('/admin/members');
});

// ===== Listings =====
router.get('/moderation/listings', (req, res) => {
  const rows = db
    .prepare(
      `SELECT l.id, l.title, l.price_cents, l.photo, l.blocked_at, c.title AS category_title,
              s.username AS seller, s.blocked_at AS seller_blocked_at
         FROM listings l
         JOIN categories c ON c.id = l.category_id
         JOIN users s      ON s.id = l.seller_id
        ORDER BY l.posted_at DESC, l.id DESC`
    )
    .all();
  res.render('moderation/listings', { title: 'Review listings', rows, euro: listings.centsToEuro });
});

router.post('/moderation/listings/:id/block', (req, res) => {
  const changed = flipListing.get(Number(req.params.id) || 0);
  if (changed) req.notice('success', changed.blocked_at ? 'Listing hidden from the marketplace.' : 'Listing visible again.');
  res.redirect('/admin/moderation/listings');
});

// ===== Comments =====
router.get('/moderation/comments', (req, res) => {
  const comments = db
    .prepare(
      `SELECT m.id, m.body, m.blocked_at, m.posted_at, l.id AS listing_id, l.title AS listing_title, a.username AS author
         FROM comments m
         JOIN listings l ON l.id = m.listing_id
         JOIN users a    ON a.id = m.author_id
        ORDER BY m.posted_at DESC, m.id DESC`
    )
    .all();
  res.render('moderation/comments', { title: 'Review comments', comments });
});

router.post('/moderation/comments/:id/block', (req, res) => {
  const changed = flipComment.get(Number(req.params.id) || 0);
  if (changed) req.notice('success', changed.blocked_at ? 'Comment hidden.' : 'Comment visible again.');
  res.redirect('/admin/moderation/comments');
});

module.exports = router;
