// Demo data, so the teacher sees a working site right after the first start.
// Runs automatically from database.js when the users table is empty.
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { UPLOAD_DIR } = require('../paths');

const USERS = [
  { username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'admin' },
  { username: 'jonas', email: 'jonas@example.com', password: 'user123', role: 'user' },
  { username: 'ona', email: 'ona@example.com', password: 'user123', role: 'user' },
  // Blocked account: cannot log in, its ads are hidden on the public site
  { username: 'spammer', email: 'spammer@example.com', password: 'user123', role: 'user', blocked: true },
];

const CATEGORIES = ['Electronics', 'Vehicles', 'Home & Garden', 'Clothing', 'Sports & Hobbies', 'Services'];

const ADS = [
  { owner: 'jonas', category: 'Electronics', title: 'iPhone 13, 128 GB', price: 390, icon: '📱', colors: ['#4f46e5', '#06b6d4'],
    description: 'Used for two years, always in a case. Battery health 87%. Comes with the original box and charger.' },
  { owner: 'jonas', category: 'Vehicles', title: 'Mountain bike, 29" wheels', price: 250, icon: '🚲', colors: ['#16a34a', '#84cc16'],
    description: 'Aluminium frame, size L, hydraulic disc brakes. Recently serviced, new chain and tyres.' },
  { owner: 'jonas', category: 'Home & Garden', title: 'Wooden dining table', price: 120, icon: '🪑', colors: ['#b45309', '#f59e0b'],
    description: 'Solid oak table 160 x 90 cm, seats six people. A few small scratches on the top.' },
  { owner: 'jonas', category: 'Services', title: 'Math tutoring for school students', price: 15, icon: '📐', colors: ['#0ea5e9', '#6366f1'],
    description: 'Price per hour. Grades 5 to 12, preparation for exams. Lessons online or in Vilnius.' },
  { owner: 'ona', category: 'Clothing', title: 'Winter jacket, size M', price: 45, icon: '🧥', colors: ['#db2777', '#f472b6'],
    description: 'Warm down jacket, dark blue, worn for one season. Very good condition, no stains.' },
  { owner: 'ona', category: 'Sports & Hobbies', title: 'Acoustic guitar with bag', price: 80, icon: '🎸', colors: ['#7c3aed', '#c084fc'],
    description: 'Full-size acoustic guitar, great for beginners. New strings, soft bag and a tuner included.' },
  { owner: 'ona', category: 'Electronics', title: 'Laptop 14", 16 GB RAM', price: 520, icon: '💻', colors: ['#334155', '#64748b'],
    description: 'Light laptop for study and work: 512 GB SSD, about 8 hours of battery. Keyboard in English.' },
  { owner: 'ona', category: 'Home & Garden', title: 'Set of house plants', price: 25, icon: '🪴', colors: ['#15803d', '#4ade80'],
    description: 'Five healthy plants in pots: monstera, ficus, two succulents and a snake plant.' },
  { owner: 'admin', category: 'Sports & Hobbies', title: 'Board games bundle', price: 35, icon: '🎲', colors: ['#dc2626', '#fb923c'],
    description: 'Three family board games, all pieces included. Great for evenings with friends.' },
  // Blocked by the admin: visible in the admin area, hidden on the public site
  { owner: 'jonas', category: 'Electronics', title: 'Cheap phones, too good to be true', price: 1, icon: '⚠️', colors: ['#991b1b', '#ef4444'],
    description: 'Example of an ad that the administrator blocked as inappropriate.', blocked: true },
  // Owner is blocked, so this ad is hidden too
  { owner: 'spammer', category: 'Services', title: 'Earn 5000 EUR a week from home!!!', price: 0, icon: '💸', colors: ['#525252', '#a3a3a3'],
    description: 'Example of an ad from a blocked user. It is not shown on the public site.' },
];

const COMMENTS = [
  { ad: 0, author: 'ona', text: 'Is the price negotiable?' },
  { ad: 0, author: 'jonas', text: 'A little, write me a message.' },
  { ad: 1, author: 'admin', text: 'Can I test ride it this weekend?' },
  { ad: 4, author: 'jonas', text: 'Is it suitable for -20 °C?' },
  { ad: 6, author: 'jonas', text: 'Which processor does it have?' },
  { ad: 6, author: 'spammer', text: 'Visit my site for free laptops!!!', blocked: true },
  { ad: 2, author: 'ona', text: 'Do you also have matching chairs?' },
];

const FAVORITES = [
  { user: 'jonas', ad: 5 },
  { user: 'jonas', ad: 6 },
  { user: 'ona', ad: 0 },
  { user: 'ona', ad: 1 },
];

// Draws a square "sticker" picture (SVG) for a demo ad: dotted pastel background,
// a tilted white card with the item's emoji and a coloured shadow. No extra files needed.
function makeImage(fileName, icon, [mainColor, secondColor]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="4" fill="${mainColor}" fill-opacity="0.22"/>
    </pattern>
  </defs>
  <rect width="800" height="800" fill="#fbf8f2"/>
  <rect width="800" height="800" fill="${secondColor}" fill-opacity="0.18"/>
  <rect width="800" height="800" fill="url(#dots)"/>
  <g transform="rotate(-7 400 400)">
    <rect x="200" y="215" width="400" height="400" rx="64" fill="${mainColor}" fill-opacity="0.85"/>
    <rect x="185" y="185" width="400" height="400" rx="64" fill="#ffffff"/>
    <text x="385" y="395" font-size="230" text-anchor="middle" dominant-baseline="central">${icon}</text>
  </g>
</svg>`;
  fs.writeFileSync(path.join(UPLOAD_DIR, fileName), svg);
  return fileName;
}

module.exports = function seed(db) {
  console.log('Empty database: adding demo data...');
  db.exec('BEGIN');
  try {
    const userIds = {};
    const insertUser = db.prepare(
      'INSERT INTO users (username, email, password_hash, role, is_blocked) VALUES (?, ?, ?, ?, ?)'
    );
    for (const u of USERS) {
      const hash = bcrypt.hashSync(u.password, 10);
      userIds[u.username] = insertUser.run(u.username, u.email, hash, u.role, u.blocked ? 1 : 0).lastInsertRowid;
    }

    const categoryIds = {};
    const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
    for (const name of CATEGORIES) {
      categoryIds[name] = insertCategory.run(name).lastInsertRowid;
    }

    const adIds = [];
    const insertAd = db.prepare(
      `INSERT INTO ads (title, description, price, image, category_id, user_id, is_blocked)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    ADS.forEach((ad, i) => {
      const image = makeImage(`sample-${i + 1}.svg`, ad.icon, ad.colors);
      const result = insertAd.run(
        ad.title, ad.description, ad.price, image,
        categoryIds[ad.category], userIds[ad.owner], ad.blocked ? 1 : 0
      );
      adIds.push(result.lastInsertRowid);
    });

    const insertComment = db.prepare('INSERT INTO comments (ad_id, user_id, text, is_blocked) VALUES (?, ?, ?, ?)');
    for (const c of COMMENTS) {
      insertComment.run(adIds[c.ad], userIds[c.author], c.text, c.blocked ? 1 : 0);
    }

    const insertFavorite = db.prepare('INSERT INTO favorites (user_id, ad_id) VALUES (?, ?)');
    for (const f of FAVORITES) {
      insertFavorite.run(userIds[f.user], adIds[f.ad]);
    }

    db.exec('COMMIT');
    console.log('Demo data added.');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
};
