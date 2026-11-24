// Turgus server: account/admin pages (EJS), REST API and the built React marketplace on ONE port.
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const session = require('express-session');

require('./db/database'); // creates the tables (and demo content) before anything else
const { UPLOAD_DIR, CLIENT_DIST } = require('./paths');
const { attachMember, mustBeSignedIn } = require('./middleware/access');
const notices = require('./middleware/notices');

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

// ---- reading requests ----
app.use(express.urlencoded({ extended: false })); // HTML forms
app.use(express.json({ limit: '20kb' })); // React → API
app.use((req, res, next) => {
  req.body ??= {}; // Express 5 leaves body undefined when nothing was sent
  next();
});

// ---- who is signed in (cookie session) ----
app.use(
  session({
    name: 'turgus.sid',
    secret: process.env.SESSION_SECRET || 'turgus-local-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 14 },
  })
);
app.use(attachMember);

// ---- files ----
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1d' }));
app.use('/vendor/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
app.use('/admin-assets', express.static(path.join(__dirname, 'public')));

// ---- REST API ----
app.use('/api', require('./routes/api'));

// ---- account / admin area ----
app.use('/admin', notices);
app.use('/admin', require('./routes/account')); // sign in / join / sign out: open to everyone
app.use('/admin', mustBeSignedIn); // the rest needs a member
app.use('/admin', require('./routes/overview'));
app.use('/admin', require('./routes/myListings'));
app.use('/admin', require('./routes/moderation'));
app.use('/admin', (req, res) => {
  res.status(404).render('message', { title: 'Page not found', text: 'There is no such page in your account.' });
});

// ---- React marketplace: real files first, then index.html for every other address ----
const reactIndex = path.join(CLIENT_DIST, 'index.html');
app.use(express.static(CLIENT_DIST));
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/uploads/')) return next();
  if (!fs.existsSync(reactIndex)) {
    return res
      .status(503)
      .type('html')
      .send('<p>The marketplace is not built yet: run <code>npm run setup</code>.</p><p><a href="/admin">Account area</a></p>');
  }
  res.sendFile(reactIndex);
});

// ---- errors: JSON for the API, a friendly page elsewhere ----
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  const text = status >= 500 ? 'Something broke on our side. Please try again.' : 'The request could not be read.';
  if (req.originalUrl.startsWith('/api/')) return res.status(status).json({ error: text });
  res.locals.member ??= null;
  res.locals.notice ??= null;
  res.locals.here ??= req.path;
  res.status(status).render('message', { title: 'Something went wrong', text });
});

app.listen(PORT, () => {
  console.log(`Turgus marketplace: http://localhost:${PORT}`);
  console.log(`Account area:       http://localhost:${PORT}/admin`);
});
