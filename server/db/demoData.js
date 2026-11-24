// Demo content for the first start, so the marketplace is not empty.
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { UPLOAD_DIR } = require('../paths');

const PEOPLE = [
  { username: 'administrator', email: 'administrator@turgus.test', password: 'turgus-admin', role: 'admin' },
  { username: 'lina', email: 'lina@turgus.test', password: 'lina-2026' },
  { username: 'tomas', email: 'tomas@turgus.test', password: 'tomas-2026' },
  { username: 'spam_bot', email: 'spam@turgus.test', password: 'spam-2026', blocked: true },
];

const CATEGORIES = ['Phones & Computers', 'Home & Living', 'Kids & Baby', 'Sport & Leisure', 'Books & Music', 'Help & Services'];

// [seller, category, title, price €, emoji, colours, details, blocked?]
const LISTINGS = [
  ['lina', 'Books & Music', 'Kindle Paperwhite e-reader', 75, '📖', ['#0e7490', '#67e8f9'],
    'Waterproof model with warm light, 8 GB. Battery lasts about three weeks. Comes with a fabric cover.'],
  ['lina', 'Home & Living', 'Espresso machine, barely used', 140, '☕', ['#92400e', '#fcd34d'],
    'Makes great espresso and cappuccino. Used for six months, descaled last week. Original box included.'],
  ['lina', 'Kids & Baby', 'Wooden toy train set', 30, '🚂', ['#b91c1c', '#fca5a5'],
    '48 pieces: tracks, a bridge, three wagons and a station. Suitable from 3 years.'],
  ['lina', 'Books & Music', 'Vinyl records, 40 LPs', 120, '💿', ['#6d28d9', '#c4b5fd'],
    'Rock and jazz from the 70s and 80s. All records play well; a list of titles can be sent on request.'],
  ['tomas', 'Sport & Leisure', 'Camping tent for 3 people', 65, '⛺', ['#15803d', '#86efac'],
    'Double-layer tent with two entrances. Used on four trips, no holes. Packs into a 50 cm bag.'],
  ['tomas', 'Sport & Leisure', 'Ice skates, size 42', 25, '⛸️', ['#1d4ed8', '#93c5fd'],
    'Hockey skates, sharpened before the season. Pick-up in Kaunas or I can send them by parcel locker.'],
  ['tomas', 'Phones & Computers', 'Gaming headset with microphone', 35, '🎧', ['#334155', '#94a3b8'],
    'Wired USB headset with surround sound. The microphone can be removed. Works with PC and console.'],
  ['tomas', 'Help & Services', 'Moving help with a van', 25, '🚚', ['#c2410c', '#fdba74'],
    'Price per hour. Two people and a 12 m³ van, also evenings and weekends. Kaunas and nearby.'],
  ['administrator', 'Home & Living', 'Ceramic plant pots, set of 3', 18, '🏺', ['#a16207', '#fde68a'],
    'Hand-made pots in three sizes (10, 14 and 18 cm) with drainage holes.'],
  ['tomas', 'Phones & Computers', 'FREE iPhone, you only pay delivery!!!', 0, '❗', ['#7f1d1d', '#f87171'],
    'Demo of a listing that the administrator blocked: owner sees it, the marketplace does not.', true],
  ['spam_bot', 'Help & Services', 'Crypto course: get rich in 7 days', 0, '🤑', ['#3f3f46', '#a1a1aa'],
    'Demo of a listing from a blocked account: it is hidden everywhere on the marketplace.'],
];

// [listing index, author, text, blocked?]
const COMMENTS = [
  [0, 'tomas', 'Are there adverts on the lock screen?'],
  [0, 'lina', 'No, the adverts were removed in the settings.'],
  [4, 'lina', 'How heavy is it when packed?'],
  [4, 'tomas', 'About 3.5 kg together with the poles.'],
  [1, 'administrator', 'Does it come with a milk frother?'],
  [7, 'lina', 'Do you also work on Sundays?'],
  [6, 'spam_bot', 'Buy cheap followers on my website!!!', true],
];

// [user, listing index]
const SAVED = [
  ['lina', 4],
  ['lina', 6],
  ['tomas', 0],
  ['tomas', 1],
];

// Square "sticker" picture: dotted pastel background, tilted white card with an emoji.
function drawPicture(fileName, emoji, [strong, light]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="4" fill="${strong}" fill-opacity="0.22"/>
    </pattern>
  </defs>
  <rect width="800" height="800" fill="#fbf8f2"/>
  <rect width="800" height="800" fill="${light}" fill-opacity="0.25"/>
  <rect width="800" height="800" fill="url(#dots)"/>
  <g transform="rotate(-7 400 400)">
    <rect x="200" y="215" width="400" height="400" rx="64" fill="${strong}" fill-opacity="0.85"/>
    <rect x="185" y="185" width="400" height="400" rx="64" fill="#ffffff"/>
    <text x="385" y="395" font-size="230" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  </g>
</svg>`;
  fs.writeFileSync(path.join(UPLOAD_DIR, fileName), svg);
  return fileName;
}

module.exports = function fillWithDemoData(db) {
  console.log('Turgus: new database, adding demo content…');
  db.exec('BEGIN');
  try {
    const userId = {};
    const addUser = db.prepare(
      'INSERT INTO users (username, email, password_hash, role, blocked_at) VALUES (?, ?, ?, ?, ?)'
    );
    for (const p of PEOPLE) {
      const hash = bcrypt.hashSync(p.password, 10);
      userId[p.username] = addUser.run(p.username, p.email, hash, p.role ?? 'user', p.blocked ? '2026-11-01 10:00:00' : null).lastInsertRowid;
    }

    const categoryId = {};
    const addCategory = db.prepare('INSERT INTO categories (title) VALUES (?)');
    CATEGORIES.forEach((title) => (categoryId[title] = addCategory.run(title).lastInsertRowid));

    // Older listings first, so "posted 3 days ago" looks natural
    const addListing = db.prepare(
      `INSERT INTO listings (seller_id, category_id, title, details, price_cents, photo, blocked_at, posted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`
    );
    const listingIds = LISTINGS.map(([seller, category, title, price, emoji, colours, details, blocked], i) => {
      const photo = drawPicture(`demo-listing-${i + 1}.svg`, emoji, colours);
      const age = `-${(LISTINGS.length - i) * 7} hours`;
      return addListing.run(
        userId[seller], categoryId[category], title, details, price * 100, photo,
        blocked ? '2026-11-02 12:00:00' : null, age
      ).lastInsertRowid;
    });

    const addComment = db.prepare('INSERT INTO comments (listing_id, author_id, body, blocked_at) VALUES (?, ?, ?, ?)');
    for (const [index, author, text, blocked] of COMMENTS) {
      addComment.run(listingIds[index], userId[author], text, blocked ? '2026-11-03 09:00:00' : null);
    }

    const addSaved = db.prepare('INSERT INTO saved_listings (user_id, listing_id) VALUES (?, ?)');
    for (const [user, index] of SAVED) addSaved.run(userId[user], listingIds[index]);

    db.exec('COMMIT');
    console.log('Turgus: demo content ready.');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
};
