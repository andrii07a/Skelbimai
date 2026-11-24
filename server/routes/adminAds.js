// Admin area for every logged-in user: create, edit and delete OWN ads.
const express = require('express');
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

module.exports = router;
