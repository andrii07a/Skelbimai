// The ★ list, stored in the saved_listings table. Every route needs a signed-in member.
const express = require('express');
const db = require('../../db/database');
const listings = require('../../services/listings');
const { mustBeSignedIn } = require('../../middleware/access');

const router = express.Router();
router.use('/saved', mustBeSignedIn);

// GET /api/saved -> visible listings the member starred
router.get('/saved', (req, res) => {
  res.json(listings.savedByMember(req.member.id));
});

// PUT /api/saved/:listingId -> star it (doing it twice changes nothing)
router.put('/saved/:listingId', (req, res) => {
  const listing = listings.findPublicListing(req.params.listingId, req.member.id);
  if (!listing) return res.status(404).json({ error: 'This listing is not available.' });
  db.prepare('INSERT OR IGNORE INTO saved_listings (user_id, listing_id) VALUES (?, ?)').run(req.member.id, listing.id);
  res.json({ listingId: listing.id, saved: true });
});

// DELETE /api/saved/:listingId -> unstar it
router.delete('/saved/:listingId', (req, res) => {
  const listingId = Number(req.params.listingId) || 0;
  db.prepare('DELETE FROM saved_listings WHERE user_id = ? AND listing_id = ?').run(req.member.id, listingId);
  res.json({ listingId, saved: false });
});

module.exports = router;
