# Classifieds: a posting / classifieds web application

A web app where users post ads for items and services, search ads, comment on them
and save the ones they like with a ⭐.

| Part | Technology |
| --- | --- |
| Admin area | Node.js + Express, server-rendered pages (EJS) with Bootstrap 5 |
| Public area | React SPA (Vite, React Router, Bootstrap 5), mobile-friendly |
| Data exchange | REST API (JSON) from Express to React |
| Database | SQLite through the built-in `node:sqlite` module: one file, nothing to install |
| Login | `express-session` (cookie) + `bcryptjs` password hashes; roles `admin` and `user` |
| Photo upload | `multer` (JPG / PNG / WEBP / GIF, up to 5 MB) |

Everything runs on **one port** (http://localhost:3000). No separate database server is needed.

---

## How to run

**Requirement:** [Node.js](https://nodejs.org) **22.13 or newer** (check with `node -v`).

```bash
git clone <this repository URL>
cd <repository folder>
npm run setup   # installs server + client packages and builds the React site
npm start       # starts the app
```

Open:

- **Public site:** http://localhost:3000
- **Admin area:** http://localhost:3000/admin

On the first start the database (`server/data/app.db`) is created automatically and filled with
demo data: users, categories, ads with pictures, comments and saved ads.

To start again from fresh demo data: stop the server, run `npm run reset-db`, then `npm start`.

## Demo accounts

| Role | Username | Email | Password | Notes |
| --- | --- | --- | --- | --- |
| Administrator | `admin` | admin@example.com | `admin123` | Can manage categories, users and block content |
| User | `jonas` | jonas@example.com | `user123` | Owns 5 ads (one is blocked by the admin), has 2 saved ads |
| User | `ona` | ona@example.com | `user123` | Owns 4 ads, has 2 saved ads |
| Blocked user | `spammer` | spammer@example.com | `user123` | Cannot log in; their ad and comment are hidden |

You can log in with the username **or** the email. You can also register a new account
(public site → *Register*, or `/admin/register`).

---

## How to test each role

### 1. Guest (not logged in)
1. Open http://localhost:3000.
2. Pick a **category** and/or type a **word or phrase** (e.g. `bike`, `for beginners`).
   Results update without reloading the page (SPA), and the filter is kept in the address bar.
3. Open an ad: photo, details and comments are shown.
4. Click ☆ or try to comment: you are asked to log in.
5. Open http://localhost:3000/admin: you are redirected to the admin login page.
6. Try `spammer` / `user123`: the message *"Your account is blocked"* is shown.

### 2. Registered user (`jonas` / `user123`)
Public site:
1. Log in, click ☆ on any ad: it turns into ★ and is saved **in the database**
   (it is still there after a reload, and on the *⭐ Saved* page).
2. Open an ad and write a comment: it appears immediately.

Admin area (*My account* button, or http://localhost:3000/admin):
1. **+ New ad**: fill in title, category, description, price and photo. Try submitting an empty form,
   a wrong file type (e.g. `.txt`) or a file bigger than 5 MB: the errors are shown in the form.
2. **My ads**: edit or delete your own ads. Opening someone else's ad, e.g.
   http://localhost:3000/admin/ads/5/edit (owned by `ona`), gives *Access denied*.
3. **💬 button** in *My ads*: see comments under your ad and delete inappropriate ones.
4. **⭐ Saved**: the list of ads you saved.
5. Admin-only pages such as http://localhost:3000/admin/users show *Access denied*.

### 3. Administrator (`admin` / `admin123`)
In the admin area the administrator also has:
1. **Categories**: create a category; delete a category that has no ads
   (a category with ads cannot be deleted).
2. **Users**: block / unblock a user. Try blocking `ona`: she is logged out and cannot log in,
   and her ads disappear from the public site. Unblock her again.
3. **All ads**: block / unblock any ad. A blocked ad disappears from the public site
   (the owner still sees it marked *Blocked by admin*).
4. **All comments**: block / unblock any comment. Blocked comments are hidden on the public site.

---

## REST API

| Method | Address | Description |
| --- | --- | --- |
| GET | `/api/categories` | All categories with the number of visible ads |
| GET | `/api/ads?category=ID&q=phrase` | Search ads by category and word / phrase (both optional) |
| GET | `/api/ads/:id` | One ad with its visible comments |
| POST | `/api/ads/:id/comments` | Add a comment `{ "text": "..." }` *(login required)* |
| GET | `/api/favorites` | My saved ads *(login required)* |
| POST / DELETE | `/api/favorites/:adId` | Save / remove an ad *(login required)* |
| POST | `/api/register` | `{ username, email, password, password2? }` |
| POST | `/api/login` | `{ login, password }` (login = username or email) |
| POST | `/api/logout` | Log out |
| GET | `/api/me` | The logged-in user, or `null` |

Blocked ads, blocked comments and everything from blocked users are never returned by the API.

## Database (5 tables)

```
users      (id, username, email, password_hash, role, is_blocked, created_at)
categories (id, name)
ads        (id, title, description, price, image, category_id → categories, user_id → users,
            is_blocked, created_at, updated_at)
comments   (id, ad_id → ads, user_id → users, text, is_blocked, created_at)
favorites  (user_id → users, ad_id → ads, created_at)   -- many-to-many, PRIMARY KEY (user_id, ad_id)
```

- A user has many ads and many comments; an ad has many comments.
- `favorites` connects users and ads (many-to-many).
- Deleting an ad also deletes its comments and favorites (`ON DELETE CASCADE`).
- A category that still has ads cannot be deleted (`ON DELETE RESTRICT`).
- Passwords are stored only as bcrypt hashes, never as plain text.

## Project structure

```
package.json         "setup" and "start" commands for the whole project
client/              React SPA (public area)
  src/api.js           helper for calling the REST API
  src/AuthContext.jsx  who is logged in
  src/components/      NavBar, AdCard, FavoriteButton
  src/pages/           Home (search), Ad, Favorites, Login, Register
server/              Express application
  app.js               connects everything; serves the API, admin pages, photos and the built React site
  db/database.js       creates the tables; adds demo data when the database is empty
  db/seed.js           demo data
  db/reset.js          deletes the database and uploaded photos (npm run reset-db)
  middleware/          loadUser / requireLogin / requireAdmin, photo upload, flash messages
  routes/              admin pages (auth, my ads, moderation) and the REST API
  services/            login / registration logic (shared by admin pages and the API), ad validation
  views/               EJS templates of the admin area
```

## Development mode (optional)

Automatic restart / reload while editing code, in two terminals:

```bash
npm run dev:server   # Express with node --watch on http://localhost:3000
npm run dev:client   # Vite on http://localhost:5173 (forwards /api, /uploads and /admin to port 3000)
```
