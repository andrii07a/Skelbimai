// REST API for the React marketplace. Answers are always JSON.
// Hidden content (blocked listings, blocked comments, suspended members) is never sent.
const express = require('express');

const router = express.Router();
router.use(require('./catalogue'));
router.use(require('./saved'));
router.use(require('./session'));

router.use((req, res) => {
  res.status(404).json({ error: `There is no API route ${req.method} ${req.originalUrl}.` });
});

module.exports = router;
