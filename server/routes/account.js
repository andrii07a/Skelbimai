// Account pages that work without signing in: sign in, join, sign out.
const express = require('express');
const accounts = require('../services/accounts');

const router = express.Router();

// After signing in go back only to an account page (never to another website)
const safeBack = (value) => (/^\/admin(\/|\?|$)/.test(String(value ?? '')) ? String(value) : '/admin');

router.get('/sign-in', (req, res) => {
  if (req.member) return res.redirect('/admin');
  res.render('account/sign-in', { title: 'Sign in', login: '', problem: null, back: safeBack(req.query.back) });
});

router.post('/sign-in', async (req, res) => {
  const { member, problem } = await accounts.signIn(req.body.login, req.body.password);
  if (problem) {
    return res.status(400).render('account/sign-in', {
      title: 'Sign in',
      login: req.body.login ?? '',
      problem,
      back: safeBack(req.body.back),
    });
  }
  await accounts.openSession(req, member.id);
  req.notice('success', `Good to see you, ${member.username}!`);
  res.redirect(safeBack(req.body.back));
});

router.get('/join', (req, res) => {
  if (req.member) return res.redirect('/admin');
  res.render('account/join', { title: 'Join Turgus', form: {}, fieldErrors: {} });
});

router.post('/join', async (req, res) => {
  const { member, fieldErrors } = await accounts.join(req.body);
  if (fieldErrors) {
    return res.status(400).render('account/join', {
      title: 'Join Turgus',
      form: { username: req.body.username, email: req.body.email },
      fieldErrors,
    });
  }
  await accounts.openSession(req, member.id);
  req.notice('success', 'Welcome to Turgus! Your account is ready — post your first listing.');
  res.redirect('/admin');
});

router.post('/sign-out', async (req, res) => {
  await accounts.closeSession(req);
  res.redirect('/admin/sign-in');
});

module.exports = router;
