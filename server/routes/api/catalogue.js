// Public catalogue: categories, search, one listing, comments.
const express = require('express');
const db = require('../../db/database');
const listings = require('../../services/listings');
const { mustBeSignedIn } = require('../../middleware/access');

const router = express.Router();
const viewerOf = (req) => req.member?.id ?? 0;

// GET /api/categories  -> [{ id, title, listingsTotal }]  (only visible listings are counted)
router.get('/categories', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.id, c.title,
              (SELECT COUNT(*) FROM listings l JOIN users s ON s.id = l.seller_id
                WHERE l.category_id = c.id AND l.blocked_at IS NULL AND s.blocked_at IS NULL) AS listings_total
         FROM categories c ORDER BY c.title`
    )
    .all();
  res.json(rows.map((r) => ({ id: r.id, title: r.title, listingsTotal: r.listings_total })));
});

// GET /api/listings?category=3&q=tent&sort=price_asc   (every parameter is optional)
router.get('/listings', (req, res) => {
  const categoryId = Number.parseInt(req.query.category, 10);
  const filters = {
    categoryId: categoryId > 0 ? categoryId : null,
    phrase: String(req.query.q ?? '').trim().slice(0, 80),
    order: String(req.query.sort ?? 'newest'),
  };
  res.json(listings.searchCatalogue(filters, viewerOf(req)));
});

// GET /api/listings/:id  -> listing + its visible comments
router.get('/listings/:id', (req, res) => {
  const listing = listings.findPublicListing(req.params.id, viewerOf(req));
  if (!listing) return res.status(404).json({ error: 'This listing is not available.' });
  res.json({ ...listing, comments: listings.commentsOf(listing.id) });
});

// POST /api/listings/:id/comments  { text }
router.post('/listings/:id/comments', mustBeSignedIn, (req, res) => {
  const listing = listings.findPublicListing(req.params.id, req.member.id);
  if (!listing) return res.status(404).json({ error: 'This listing is not available.' });

  const text = String(req.body.text ?? '').trim();
  if (!text) return res.status(422).json({ error: 'An empty comment cannot be posted.' });
  if (text.length > 1000) return res.status(422).json({ error: 'Please keep the comment under 1000 characters.' });

  const row = db
    .prepare(
      `INSERT INTO comments (listing_id, author_id, body) VALUES (?, ?, ?)
       RETURNING id, body, posted_at, ? AS author`
    )
    .get(listing.id, req.member.id, text, req.member.username);
  res.status(201).json(listings.toCommentJson(row));
});

module.exports = router;
