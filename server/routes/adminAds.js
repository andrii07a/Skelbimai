// Admin area for every logged-in user: create, edit and delete OWN ads.
const express = require('express');
const db = require('../db/database');
const ads = require('../services/adService');
const { uploadImage, deleteImage, MAX_SIZE_MB } = require('../middleware/upload');

const router = express.Router();

// Finds the ad from the URL and checks that it belongs to the logged-in user.
function loadOwnAd(req, res, next) {
  const ad = ads.getAd(req.params.id);
  if (!ad) {
    return res.status(404).render('error', { title: 'Ad not found', message: 'This ad does not exist.' });
  }
  if (ad.user_id !== req.user.id) {
    return res
      .status(403)
      .render('error', { title: 'Access denied', message: 'You can edit and delete only your own ads.' });
  }
  req.ad = ad;
  next();
}

function renderForm(res, { ad = null, values = {}, errors = {}, status = 200 }) {
  res.status(status).render('ads/form', {
    title: ad ? 'Edit ad' : 'New ad',
    ad,
    values,
    errors,
    categories: ads.getCategories(),
    maxSizeMb: MAX_SIZE_MB,
  });
}

// List of my ads
router.get('/ads', (req, res) => {
  res.render('ads/list', { title: 'My ads', ads: ads.getAdsOfUser(req.user.id) });
});

// New ad
router.get('/ads/new', (req, res) => {
  renderForm(res, {});
});

router.post('/ads', uploadImage, (req, res) => {
  const { values, errors } = ads.validateAd(req.body);
  if (req.uploadError) errors.image = req.uploadError;
  else if (!req.file) errors.image = 'Add a photo of the item.';

  if (Object.keys(errors).length > 0) {
    if (req.file) deleteImage(req.file.filename); // do not keep photos of ads that were not saved
    return renderForm(res, { values: req.body, errors, status: 400 });
  }

  ads.createAd(req.user.id, values, req.file.filename);
  req.flash('success', 'Your ad was published.');
  res.redirect('/admin/ads');
});

// Edit my ad (loadOwnAd runs BEFORE the upload, so strangers cannot even upload files here)
router.get('/ads/:id/edit', loadOwnAd, (req, res) => {
  renderForm(res, { ad: req.ad, values: req.ad });
});

router.post('/ads/:id', loadOwnAd, uploadImage, (req, res) => {
  const { values, errors } = ads.validateAd(req.body);
  if (req.uploadError) errors.image = req.uploadError;

  if (Object.keys(errors).length > 0) {
    if (req.file) deleteImage(req.file.filename);
    return renderForm(res, { ad: req.ad, values: req.body, errors, status: 400 });
  }

  const newImage = req.file ? req.file.filename : req.ad.image;
  ads.updateAd(req.ad.id, values, newImage);
  if (req.file) deleteImage(req.ad.image); // the old photo is not needed any more
  req.flash('success', 'The ad was updated.');
  res.redirect('/admin/ads');
});

// Delete my ad
router.post('/ads/:id/delete', loadOwnAd, (req, res) => {
  ads.deleteAd(req.ad.id);
  deleteImage(req.ad.image);
  req.flash('success', `The ad "${req.ad.title}" was deleted.`);
  res.redirect('/admin/ads');
});

// Comments under my ad: the owner can delete inappropriate ones
router.get('/ads/:id/comments', loadOwnAd, (req, res) => {
  const comments = db
    .prepare(
      `SELECT c.*, u.username
         FROM comments c JOIN users u ON u.id = c.user_id
        WHERE c.ad_id = ?
        ORDER BY c.created_at DESC, c.id DESC`
    )
    .all(req.ad.id);
  res.render('ads/comments', { title: 'Comments', ad: req.ad, comments });
});

// Delete a comment: allowed for the owner of the ad (and for the administrator)
router.post('/comments/:id/delete', (req, res) => {
  const comment = db
    .prepare('SELECT c.id, c.ad_id, a.user_id AS ad_owner_id FROM comments c JOIN ads a ON a.id = c.ad_id WHERE c.id = ?')
    .get(Number(req.params.id));
  if (!comment) {
    return res.status(404).render('error', { title: 'Not found', message: 'This comment does not exist.' });
  }
  if (comment.ad_owner_id !== req.user.id && req.user.role !== 'admin') {
    return res
      .status(403)
      .render('error', { title: 'Access denied', message: 'You can delete comments only under your own ads.' });
  }
  db.prepare('DELETE FROM comments WHERE id = ?').run(comment.id);
  req.flash('success', 'The comment was deleted.');
  const back = String(req.body.back || '');
  res.redirect(back.startsWith('/admin/') ? back : `/admin/ads/${comment.ad_id}/comments`);
});

// My saved (⭐) ads
router.get('/favorites', (req, res) => {
  const favorites = db
    .prepare(
      `SELECT a.*, c.name AS category_name, u.username AS owner, u.is_blocked AS owner_blocked
         FROM favorites f
         JOIN ads a        ON a.id = f.ad_id
         JOIN categories c ON c.id = a.category_id
         JOIN users u      ON u.id = a.user_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC`
    )
    .all(req.user.id);
  res.render('favorites', { title: 'Saved ads', favorites });
});

router.post('/favorites/:adId/delete', (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND ad_id = ?').run(req.user.id, Number(req.params.adId));
  req.flash('success', 'Removed from saved ads.');
  res.redirect('/admin/favorites');
});

module.exports = router;
