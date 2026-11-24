// Signing in / out and joining from the React app. Uses the same rules as the account pages.
const express = require('express');
const accounts = require('../../services/accounts');

const router = express.Router();

// GET /api/session -> { member } (null when nobody is signed in)
router.get('/session', (req, res) => {
  res.json({ member: accounts.toPublicMember(req.member) });
});

// POST /api/session { login, password } -> sign in
router.post('/session', async (req, res) => {
  const { member, problem } = await accounts.signIn(req.body.login, req.body.password);
  if (problem) return res.status(401).json({ error: problem });
  await accounts.openSession(req, member.id);
  res.json({ member: accounts.toPublicMember(member) });
});

// DELETE /api/session -> sign out
router.delete('/session', async (req, res) => {
  await accounts.closeSession(req);
  res.status(204).end();
});

// POST /api/members { username, email, password, password2 } -> create an account and sign in
router.post('/members', async (req, res) => {
  const { member, fieldErrors } = await accounts.join(req.body);
  if (fieldErrors) return res.status(422).json({ error: 'Some fields need fixing.', fieldErrors });
  await accounts.openSession(req, member.id);
  res.status(201).json({ member: accounts.toPublicMember(member) });
});

module.exports = router;
