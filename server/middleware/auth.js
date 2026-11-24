// Middleware that knows who is logged in and protects pages / API routes.
const { findUserById } = require('../services/authService');

const isApiRequest = (req) => req.originalUrl.startsWith('/api/');

// Runs on every request: puts the logged-in user into req.user (or null).
// A user who was blocked while logged in is logged out on the next request.
function loadUser(req, res, next) {
  req.user = null;
  const userId = req.session.userId;
  if (userId) {
    const user = findUserById(userId);
    if (user && !user.is_blocked) {
      req.user = user;
    } else {
      delete req.session.userId;
    }
  }
  res.locals.currentUser = req.user; // available in every EJS view
  next();
}

function requireLogin(req, res, next) {
  if (req.user) return next();
  if (isApiRequest(req)) {
    return res.status(401).json({ error: 'Please log in first.' });
  }
  res.redirect('/admin/login?next=' + encodeURIComponent(req.originalUrl));
}

function requireAdmin(req, res, next) {
  if (!req.user) return requireLogin(req, res, next);
  if (req.user.role === 'admin') return next();
  if (isApiRequest(req)) {
    return res.status(403).json({ error: 'Only administrators can do this.' });
  }
  res.status(403).render('error', { title: 'Access denied', message: 'This page is only for administrators.' });
}

module.exports = { loadUser, requireLogin, requireAdmin };
