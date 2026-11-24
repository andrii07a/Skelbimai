// Accounts: joining, signing in and the session. Shared by the account pages and the REST API,
// so the rules exist in exactly one place.
const bcrypt = require('bcryptjs');
const db = require('../db/database');

const RULES = {
  username: /^[A-Za-z0-9_]{3,30}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  passwordMin: 6,
  passwordMax: 72, // bcrypt only uses the first 72 bytes
};

const findMember = db.prepare('SELECT id, username, email, role, blocked_at FROM users WHERE id = ?');
const findByLogin = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?');
const usernameTaken = db.prepare('SELECT 1 FROM users WHERE username = ?');
const emailTaken = db.prepare('SELECT 1 FROM users WHERE email = ?');
const insertMember = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');

// What the browser may know about a member (never the password hash)
function toPublicMember(member) {
  if (!member) return null;
  return { id: member.id, username: member.username, email: member.email, isAdmin: member.role === 'admin' };
}

function getMember(id) {
  return findMember.get(id) ?? null;
}

// Returns { fieldErrors } when the form is wrong, otherwise { member }.
async function join(form) {
  const username = String(form.username ?? '').trim();
  const email = String(form.email ?? '').trim().toLowerCase();
  const password = String(form.password ?? '');
  const fieldErrors = {};

  if (!RULES.username.test(username)) {
    fieldErrors.username = 'Use 3 to 30 characters: Latin letters, digits or an underscore.';
  } else if (usernameTaken.get(username)) {
    fieldErrors.username = 'Somebody already uses this username — try another one.';
  }

  if (!RULES.email.test(email) || email.length > 120) {
    fieldErrors.email = 'This does not look like an email address.';
  } else if (emailTaken.get(email)) {
    fieldErrors.email = 'An account with this email already exists.';
  }

  if (password.length < RULES.passwordMin || password.length > RULES.passwordMax) {
    fieldErrors.password = `The password needs ${RULES.passwordMin} to ${RULES.passwordMax} characters.`;
  }
  if (form.password2 !== undefined && String(form.password2) !== password) {
    fieldErrors.password2 = 'The two passwords are different.';
  }

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const hash = await bcrypt.hash(password, 10); // only the hash is stored, never the password
  const { lastInsertRowid } = insertMember.run(username, email, hash);
  return { member: getMember(lastInsertRowid) };
}

// "login" may be the username or the email. Returns { problem } or { member }.
async function signIn(login, password) {
  const name = String(login ?? '').trim();
  const secret = String(password ?? '');
  if (!name || !secret) return { problem: 'Please fill in both fields.' };

  const row = findByLogin.get(name, name.toLowerCase());
  // Same message for "no such user" and "wrong password", so nobody can test which usernames exist
  if (!row || !(await bcrypt.compare(secret, row.password_hash))) {
    return { problem: 'That username/email and password do not match.' };
  }
  if (row.blocked_at) {
    return { problem: 'This account has been suspended by an administrator.' };
  }
  return { member: getMember(row.id) };
}

// A fresh session id after signing in protects against session fixation.
function openSession(req, memberId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.memberId = memberId;
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

function closeSession(req) {
  return new Promise((resolve) => req.session.destroy(() => resolve()));
}

module.exports = { join, signIn, openSession, closeSession, getMember, toPublicMember };
