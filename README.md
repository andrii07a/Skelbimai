# 🧺 Turgus: a local classifieds marketplace

*Turgus* (Lithuanian for "market") is a web app where people post ads for things and services,
search them, ask the seller questions and keep a ★ list of ads they like.

| Part | Technology |
| --- | --- |
| Account / admin area | Node.js + Express, server-rendered EJS pages, Bootstrap 5 with a custom sidebar theme |
| Public marketplace | React single-page app (Vite, React Router, Bootstrap 5 + own theme), works on phones |
| Data exchange | REST API (JSON) from Express to React |
| Database | SQLite through the built-in `node:sqlite` module: one file, nothing to install |
| Login | `express-session` cookie + `bcryptjs` password hashes; roles `admin` and `user` |
| Photo upload | `multer` (JPG / PNG / WEBP / GIF, up to 5 MB, file content is checked too) |

Everything runs on **one port** (http://localhost:3000) and works offline: no database server,
no CDN.

---

## How to run

**Requirement:** [Node.js](https://nodejs.org) **22.13 or newer** (check with `node -v`).

```bash
git clone <this repository URL>
cd <repository folder>
npm run setup   # installs server + client packages and builds the React app
npm start       # starts Turgus
```

| Address | What it is |
| --- | --- |
| http://localhost:3000 | Public marketplace (React) |
| http://localhost:3000/admin | Account / admin area |

On the first start the database (`server/data/app.db`) is created and filled with demo data:
users, categories, ads with pictures, questions and saved ads.
To start over: stop the server, run `npm run reset-db`, then `npm start`.

## Demo accounts

| Role | Username | Email | Password | What is special |
| --- | --- | --- | --- | --- |
| Administrator | `admin` | admin@example.com | `admin123` | Sees the *Administration* menu |
| User | `jonas` | jonas@example.com | `user123` | 5 ads (1 blocked by the admin), 2 saved ads |
| User | `ona` | ona@example.com | `user123` | 4 ads, 2 saved ads |
| Blocked user | `spammer` | spammer@example.com | `user123` | Cannot sign in; their ad and comment are hidden |

Sign in with the username **or** the email, or create a new account (*Join* on the marketplace,
or `/admin/register`).

---

## How to test each role

### Guest
1. Open http://localhost:3000.
2. Type a **word or phrase** in the big search field (e.g. `bike`, `for beginners`): results update
   while you type, without reloading the page. Pick a **category** on the left (chips on a phone).
3. Try **sorting** (newest / cheapest / most expensive) and the **grid ▦ / list ☰** switch.
   Filters are kept in the address, so the browser *Back* button works.
4. Open an ad: photo, price, seller and the **Questions** thread.
5. Click ☆ or try to ask a question: you are sent to *Sign in*.
6. http://localhost:3000/admin redirects to the sign-in page.
   Signing in as `spammer` shows *"Your account is blocked"*.

### Registered user (`jonas` / `user123`)
On the marketplace:
1. *Sign in*, then click ☆ on any ad: it becomes ★ and is stored **in the database**
   (it is still there after a reload and on the *★ Saved* page).
2. Open an ad and post a question: it appears straight away. Answers written by the
   seller are shown on the right with a *seller* badge.

In the account area (click your name in the header, or http://localhost:3000/admin):
1. **New ad**: title, category, description, price and photo. Submit an empty form, a `.txt` file
   or a file over 5 MB: each error is shown under its field.
2. **My ads**: edit or delete your own ads. Someone else's ad, e.g.
   http://localhost:3000/admin/ads/5/edit (owned by `ona`), shows *Access denied*.
3. **💬 button** in *My ads*: questions under that ad; delete inappropriate ones.
4. **Saved ads**: the ads you starred.
5. Administration pages (e.g. http://localhost:3000/admin/users) show *Access denied*.

### Administrator (`admin` / `admin123`)
The sidebar has an extra **Administration** section:
1. **Categories**: create one; delete one without ads (a category with ads cannot be deleted).
2. **Users**: block / unblock. Block `ona`: that account is signed out at once, cannot sign in,
   and its ads disappear from the marketplace. Unblock it again.
3. **Moderate ads**: block / unblock any ad. A blocked ad disappears from the marketplace
   (its owner still sees it marked *Blocked by admin*).
4. **Moderate comments**: block / unblock any comment; blocked ones are hidden publicly.

---

## REST API

| Method | Address | Description |
| --- | --- | --- |
| GET | `/api/categories` | Categories with the number of visible ads |
| GET | `/api/ads?category=ID&q=phrase&sort=newest` | Search; `sort` = `newest`, `price_asc` or `price_desc` (all optional) |
| GET | `/api/ads/:id` | One ad with its visible comments |
| POST | `/api/ads/:id/comments` | Add a comment `{ "text": "..." }` *(sign-in required)* |
| GET | `/api/favorites` | My saved ads *(sign-in required)* |
| POST / DELETE | `/api/favorites/:adId` | Save / unsave an ad *(sign-in required)* |
| POST | `/api/register` | `{ username, email, password, password2? }` |
| POST | `/api/login` | `{ login, password }` (login = username or email) |
| POST | `/api/logout` | Sign out |
| GET | `/api/me` | The signed-in user, or `null` |

Blocked ads, blocked comments and everything from blocked users are never returned.

## Database (5 tables)

```
users      (id, username, email, password_hash, role, is_blocked, created_at)
categories (id, name)
ads        (id, title, description, price, image, category_id → categories, user_id → users,
            is_blocked, created_at, updated_at)
comments   (id, ad_id → ads, user_id → users, text, is_blocked, created_at)
favorites  (user_id → users, ad_id → ads, created_at)   -- many-to-many, PRIMARY KEY (user_id, ad_id)
```

- A user has many ads and comments; an ad has many comments.
- `favorites` links users and ads (many-to-many).
- Deleting an ad also deletes its comments and favorites (`ON DELETE CASCADE`).
- A category that still has ads cannot be deleted (`ON DELETE RESTRICT`).
- Passwords are stored only as bcrypt hashes.

## Project structure

```
package.json                 "setup", "start", "reset-db" for the whole project
client/                      React marketplace
  src/lib/http.js              API client + list of endpoints
  src/lib/format.js            prices, "3 hours ago" dates
  src/context/SessionContext   who is signed in
  src/hooks/                   useListings, useDebouncedValue, useStoredState
  src/components/layout/       SiteHeader, SiteFooter
  src/components/browse/       SearchHero, CategoryPicker, ResultsToolbar
  src/components/listing/      ListingTile, ListingRow, ListingCollection, SaveToggle,
                               CommentThread, CommentComposer
  src/components/ui/           Avatar, Loader, EmptyState
  src/pages/                   BrowsePage, ListingPage, SavedPage, AuthPage, MissingPage
  src/styles/theme.css         Turgus theme (teal + amber)
server/                      Express application
  app.js                       connects everything, serves the API, account pages, photos and React
  db/                          database.js (tables), seed.js (demo data), reset.js
  middleware/                  auth (loadUser / requireLogin / requireAdmin), upload, flash messages
  routes/                      adminAuth, adminDashboard, adminAds, adminModeration, api
  services/                    authService (shared by pages and API), adService (validation)
  views/                       EJS templates of the account area
  public/admin.css             sidebar theme of the account area
```

## Development mode (optional)

Automatic restart / reload while editing, in two terminals:

```bash
npm run dev:server   # Express with node --watch on http://localhost:3000
npm run dev:client   # Vite on http://localhost:5173 (forwards /api, /uploads, /admin to port 3000)
```
