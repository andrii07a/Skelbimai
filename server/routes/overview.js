// /admin — the first page after signing in.
const express = require('express');
const db = require('../db/database');

const router = express.Router();
const count = (sql, ...params) => db.prepare(sql).get(...params).n;

router.get('/', (req, res) => {
  const me = req.member.id;
  const numbers = {
    listings: count('SELECT COUNT(*) AS n FROM listings WHERE seller_id = ?', me),
    comments: count(
      'SELECT COUNT(*) AS n FROM comments m JOIN listings l ON l.id = m.listing_id WHERE l.seller_id = ?',
      me
    ),
    saved: count('SELECT COUNT(*) AS n FROM saved_listings WHERE user_id = ?', me),
  };

  if (req.member.role === 'admin') {
    numbers.members = count('SELECT COUNT(*) AS n FROM users');
    numbers.categories = count('SELECT COUNT(*) AS n FROM categories');
    numbers.allListings = count('SELECT COUNT(*) AS n FROM listings');
    numbers.blocked =
      count('SELECT COUNT(*) AS n FROM listings WHERE blocked_at IS NOT NULL') +
      count('SELECT COUNT(*) AS n FROM comments WHERE blocked_at IS NOT NULL');
  }

  res.render('overview', { title: 'Overview', numbers });
});

module.exports = router;
