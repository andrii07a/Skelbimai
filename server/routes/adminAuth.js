// Admin area: log in, register, log out (EJS pages).
const express = require('express');
const auth = require('../services/authService');

const router = express.Router();

// Only allow redirects back inside the admin area (no redirects to other sites)
function safeNext(next) {
  const value = String(next || '');
  return /^\/admin(\/|$|\?)/.test(value) ? value : '/admin';
}

router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/admin');
  res.render('login', { title: 'Sign in', values: {}, error: null, next: safeNext(req.query.next) });
});

router.post('/login', async (req, res) => {
  const result = await auth.login(req.body);
  if (result.error) {
    return res.status(400).render('login', {
      title: 'Sign in',
      values: { login: req.body.login },
      error: result.error,
      next: safeNext(req.body.next),
    });
  }
  await auth.startSession(req, result.user.id);
  req.flash('success', `Welcome, ${result.user.username}!`);
  res.redirect(safeNext(req.body.next));
});

router.get('/register', (req, res) => {
  if (req.user) return res.redirect('/admin');
  res.render('register', { title: 'Create an account', values: {}, errors: {} });
});

router.post('/register', async (req, res) => {
  const result = await auth.register(req.body);
  if (result.errors) {
    return res.status(400).render('register', {
      title: 'Create an account',
      values: { username: req.body.username, email: req.body.email },
      errors: result.errors,
    });
  }
  await auth.startSession(req, result.user.id);
  req.flash('success', 'Your account was created. You can now post ads!');
  res.redirect('/admin');
});

router.post('/logout', async (req, res) => {
  await auth.endSession(req);
  res.redirect('/admin/login');
});

module.exports = router;
