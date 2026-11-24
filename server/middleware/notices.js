// Short notices shown once on the next account page ("Listing published", …).
// In a route: req.notice('success', 'Listing published.'); then redirect.
function notices(req, res, next) {
  res.locals.notice = req.session.notice ?? null;
  delete req.session.notice;
  req.notice = (tone, text) => {
    req.session.notice = { tone, text };
  };
  res.locals.here = req.originalUrl.split('?')[0]; // highlights the current menu item
  next();
}

module.exports = notices;
