// Registration and login logic. Used by BOTH the admin pages (routes/adminAuth.js)
// and the REST API (routes/api.js), so the rules are written only once.
const bcrypt = require('bcryptjs');
const db = require('../db/database');

const USERNAME_RE = /^[A-Za-z0-9_]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only the fields that are safe to send to the browser (never the password hash)
function publicUser(user) {
  if (!user) return null;
  return { id: user.id, username: user.username, email: user.email, role: user.role };
}

function findUserById(id) {
  return db.prepare('SELECT id, username, email, role, is_blocked FROM users WHERE id = ?').get(id);
}

// Returns { errors } if something is wrong, or { user } when the account was created.
async function register(input) {
  const username = String(input.username ?? '').trim();
  const email = String(input.email ?? '').trim().toLowerCase();
  const password = String(input.password ?? '');
  const password2 = input.password2;

  const errors = {};
  if (!USERNAME_RE.test(username)) {
    errors.username = 'Username must be 3-30 characters: letters, numbers or _.';
  }
  if (!EMAIL_RE.test(email) || email.length > 100) {
    errors.email = 'Enter a valid email address.';
  }
  if (password.length < 6 || password.length > 72) {
    errors.password = 'Password must be 6-72 characters long.';
  }
  if (password2 !== undefined && password !== String(password2)) {
    errors.password2 = 'Passwords do not match.';
  }
  if (!errors.username && db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) {
    errors.username = 'This username is already taken.';
  }
  if (!errors.email && db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    errors.email = 'This email is already registered.';
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // The password is never stored as plain text, only its bcrypt hash
  const passwordHash = await bcrypt.hash(password, 10);
  const result = db
    .prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(username, email, passwordHash);
  return { user: findUserById(result.lastInsertRowid) };
}

// "login" can be the username or the email. Returns { error } or { user }.
async function login(input) {
  const loginName = String(input.login ?? '').trim();
  const password = String(input.password ?? '');
  if (!loginName || !password) {
    return { error: 'Enter your username (or email) and password.' };
  }

  const user = db
    .prepare('SELECT * FROM users WHERE username = ? OR email = ?')
    .get(loginName, loginName.toLowerCase());

  const passwordOk = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!passwordOk) {
    return { error: 'Wrong username or password.' };
  }
  if (user.is_blocked) {
    return { error: 'Your account is blocked by the administrator.' };
  }
  return { user: findUserById(user.id) };
}

// Saves the logged-in user in the session (a new session id is created for safety).
function startSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = userId;
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

function endSession(req) {
  return new Promise((resolve) => req.session.destroy(() => resolve()));
}

module.exports = { register, login, startSession, endSession, publicUser, findUserById };
