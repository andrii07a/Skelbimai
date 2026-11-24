// For every signed-in member: own listings (create / edit / delete),
// comments under own listings, and the ★ saved list.
const express = require('express');
const db = require('../db/database');
const listings = require('../services/listings');
const { acceptPhoto, removePhoto, MAX_MB } = require('../middleware/photos');

const router = express.Router();

// Loads the listing from the URL and stops if it belongs to somebody else.
function ownListingOnly(req, res, next) {
  const listing = listings.getListing(req.params.id);
  if (!listing) {
    return res.status(404).render('message', { title: 'Listing not found', text: 'It may already have been deleted.' });
  }
  if (listing.seller_id !== req.member.id) {
    return res.status(403).render('message', {
      title: 'Not your listing',
      text: 'Only the person who posted a listing can change or delete it.',
    });
  }
  req.listing = listing;
  next();
}

function showForm(res, { listing = null, form, fieldErrors = {}, status = 200 }) {
  res.status(status).render('listings/form', {
    title: listing ? 'Edit listing' : 'New listing',
    listing,
    form,
    fieldErrors,
    categories: listings.categories(),
    limits: listings.LIMITS,
    maxMb: MAX_MB,
  });
}

// ----- list -----
router.get('/listings', (req, res) => {
  res.render('listings/index', {
    title: 'My listings',
    rows: listings.listingsOfSeller(req.member.id),
    euro: listings.centsToEuro,
  });
});

// ----- create -----
router.get('/listings/new', (req, res) => showForm(res, { form: {} }));

router.post('/listings', acceptPhoto, (req, res) => {
  const { clean, fieldErrors } = listings.checkListingForm(req.body);
  if (req.photoProblem) fieldErrors.photo = req.photoProblem;
  else if (!req.file) fieldErrors.photo = 'Add a photo so buyers can see the item.';

  if (Object.keys(fieldErrors).length) {
    if (req.file) removePhoto(req.file.filename); // the listing was not saved, so neither is its photo
    return showForm(res, { form: req.body, fieldErrors, status: 400 });
  }

  listings.createListing({ ...clean, sellerId: req.member.id, photo: req.file.filename });
  req.notice('success', `“${clean.title}” is now live on the marketplace.`);
  res.redirect('/admin/listings');
});

// ----- edit (ownership is checked BEFORE a file is accepted) -----
router.get('/listings/:id/edit', ownListingOnly, (req, res) => {
  const l = req.listing;
  showForm(res, {
    listing: l,
    form: { title: l.title, details: l.details, categoryId: l.category_id, price: listings.centsToEuro(l.price_cents) },
  });
});

router.post('/listings/:id', ownListingOnly, acceptPhoto, (req, res) => {
  const { clean, fieldErrors } = listings.checkListingForm(req.body);
  if (req.photoProblem) fieldErrors.photo = req.photoProblem;

  if (Object.keys(fieldErrors).length) {
    if (req.file) removePhoto(req.file.filename);
    return showForm(res, { listing: req.listing, form: req.body, fieldErrors, status: 400 });
  }

  const photo = req.file ? req.file.filename : req.listing.photo;
  listings.saveListingChanges({ ...clean, photo, id: req.listing.id });
  if (req.file) removePhoto(req.listing.photo); // the old photo is no longer used
  req.notice('success', 'Changes saved.');
  res.redirect('/admin/listings');
});

// ----- delete -----
router.post('/listings/:id/delete', ownListingOnly, (req, res) => {
  listings.deleteListing(req.listing.id);
  removePhoto(req.listing.photo);
  req.notice('success', `“${req.listing.title}” was deleted.`);
  res.redirect('/admin/listings');
});

// ----- comments under my listing -----
router.get('/listings/:id/comments', ownListingOnly, (req, res) => {
  const comments = db
    .prepare(
      `SELECT m.id, m.body, m.blocked_at, m.posted_at, a.username AS author
         FROM comments m JOIN users a ON a.id = m.author_id
        WHERE m.listing_id = ?
        ORDER BY m.posted_at DESC, m.id DESC`
    )
    .all(req.listing.id);
  res.render('listings/comments', { title: 'Comments', listing: req.listing, comments });
});

// The seller removes an inappropriate comment under their own listing
router.post('/comments/:id/delete', (req, res) => {
  const comment = db
    .prepare(
      'SELECT m.id, m.listing_id, l.seller_id FROM comments m JOIN listings l ON l.id = m.listing_id WHERE m.id = ?'
    )
    .get(Number(req.params.id) || 0);

  if (!comment) {
    return res.status(404).render('message', { title: 'Comment not found', text: 'It may already have been removed.' });
  }
  if (comment.seller_id !== req.member.id) {
    return res.status(403).render('message', {
      title: 'Not your listing',
      text: 'You can remove comments only under listings you posted.',
    });
  }
  db.prepare('DELETE FROM comments WHERE id = ?').run(comment.id);
  req.notice('success', 'The comment was removed.');
  res.redirect(`/admin/listings/${comment.listing_id}/comments`);
});

// ----- ★ saved listings -----
router.get('/saved', (req, res) => {
  const rows = db
    .prepare(
      `SELECT l.id, l.title, l.price_cents, l.photo, l.blocked_at, c.title AS category_title,
              s.username AS seller, s.blocked_at AS seller_blocked_at, sv.saved_at
         FROM saved_listings sv
         JOIN listings l   ON l.id = sv.listing_id
         JOIN categories c ON c.id = l.category_id
         JOIN users s      ON s.id = l.seller_id
        WHERE sv.user_id = ?
        ORDER BY sv.saved_at DESC`
    )
    .all(req.member.id);
  res.render('saved', { title: 'Saved listings', rows, euro: listings.centsToEuro });
});

router.post('/saved/:id/remove', (req, res) => {
  db.prepare('DELETE FROM saved_listings WHERE user_id = ? AND listing_id = ?').run(req.member.id, Number(req.params.id) || 0);
  req.notice('success', 'Removed from your saved listings.');
  res.redirect('/admin/saved');
});

module.exports = router;
