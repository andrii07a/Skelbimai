// Admin area start page (/admin). Only for logged-in users (see app.js).
const express = require('express');
const db = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const userId = req.user.id;
  const stats = {
    myAds: db.prepare('SELECT COUNT(*) AS n FROM ads WHERE user_id = ?').get(userId).n,
    myComments: db
      .prepare('SELECT COUNT(*) AS n FROM comments c JOIN ads a ON a.id = c.ad_id WHERE a.user_id = ?')
      .get(userId).n,
    favorites: db.prepare('SELECT COUNT(*) AS n FROM favorites WHERE user_id = ?').get(userId).n,
  };
  if (req.user.role === 'admin') {
    stats.users = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
    stats.categories = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n;
    stats.allAds = db.prepare('SELECT COUNT(*) AS n FROM ads').get().n;
    stats.blockedAds = db.prepare('SELECT COUNT(*) AS n FROM ads WHERE is_blocked = 1').get().n;
  }
  res.render('dashboard', { title: 'Dashboard', stats });
});

module.exports = router;
