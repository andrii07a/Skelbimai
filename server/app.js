// Main Express application: admin area (EJS), REST API and the built React site, all on one port.
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const session = require('express-session');

require('./db/database'); // creates tables + demo data on first start
const { UPLOAD_DIR, CLIENT_DIST } = require('./paths');
const { loadUser, requireLogin } = require('./middleware/auth');
const flash = require('./middleware/flash');
const adminAuthRoutes = require('./routes/adminAuth');
const adminDashboardRoutes = require('./routes/adminDashboard');
const adminAdsRoutes = require('./routes/adminAds');
const adminModerationRoutes = require('./routes/adminModeration');
const apiRoutes = require('./routes/api');

const PORT = process.env.PORT || 3000;
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Read form data (admin pages) and JSON (React → API)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use((req, res, next) => {
  req.body = req.body ?? {}; // Express 5 leaves req.body undefined for requests without a body
  next();
});

// Login is remembered with a session cookie
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'school-project-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);
app.use(loadUser);

// Static files: uploaded photos and Bootstrap for the admin pages
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/vendor/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));

// REST API for the React site
app.use('/api', apiRoutes);

// Admin area
app.use('/admin', flash);
app.use('/admin', adminAuthRoutes); // /admin/login, /admin/register, /admin/logout (no login needed)
app.use('/admin', requireLogin); // everything below needs a logged-in user
app.use('/admin', adminDashboardRoutes);
app.use('/admin', adminAdsRoutes); // my ads, comments under them, saved ads
app.use('/admin', adminModerationRoutes); // admin only: categories, users, blocking

// 404 for admin pages
app.use('/admin', (req, res) => {
  res.status(404).render('error', { title: 'Page not found', message: 'This admin page does not exist.' });
});

// Public React site (built into client/dist by "npm run setup")
const clientIndex = path.join(CLIENT_DIST, 'index.html');
app.use(express.static(CLIENT_DIST));
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/uploads/')) return next();
  // Every other address (/, /ads/5, /favorites...) is handled by React Router
  if (!fs.existsSync(clientIndex)) {
    return res
      .status(503)
      .send('The React site is not built yet. Run <code>npm run setup</code> in the project folder. Admin area: <a href="/admin">/admin</a>');
  }
  res.sendFile(clientIndex);
});

// Error handler: JSON for the API, a page for the admin area
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  const message = status >= 500 ? 'Something went wrong on the server.' : err.message;
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(status).json({ error: message });
  }
  res.locals.flash = res.locals.flash || null;
  res.locals.currentPath = res.locals.currentPath || req.path;
  res.locals.currentUser = res.locals.currentUser || null;
  res.status(status).render('error', { title: 'Error', message });
});

app.listen(PORT, () => {
  console.log(`Classifieds app: http://localhost:${PORT}`);
  console.log(`Admin area:      http://localhost:${PORT}/admin`);
});
