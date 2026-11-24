// One-time messages ("Ad saved", "Category deleted"...) shown on the next admin page.
// Usage in a route: req.flash('success', 'Ad saved.'); then redirect.
function flash(req, res, next) {
  res.locals.flash = req.session.flash || null;
  if (req.session.flash) delete req.session.flash;

  req.flash = (type, message) => {
    req.session.flash = { type, message };
  };

  res.locals.currentPath = req.originalUrl.split('?')[0]; // used to highlight the menu item
  next();
}

module.exports = flash;
