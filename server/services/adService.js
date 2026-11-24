// Ad validation and database queries used by the admin pages.
const db = require('../db/database');

const MAX_PRICE = 1000000;

function getCategories() {
  return db.prepare('SELECT id, name FROM categories ORDER BY name').all();
}

// Checks the form data on the server. Returns { values, errors }.
// "values" are cleaned values ready to save; "errors" is { field: message }.
function validateAd(body) {
  const values = {
    title: String(body.title ?? '').trim(),
    description: String(body.description ?? '').trim(),
    price: String(body.price ?? '').trim().replace(',', '.'),
    category_id: Number(body.category_id),
  };
  const errors = {};

  if (values.title.length < 3 || values.title.length > 100) {
    errors.title = 'Title must be 3-100 characters long.';
  }
  if (values.description.length < 10 || values.description.length > 3000) {
    errors.description = 'Description must be 10-3000 characters long.';
  }
  if (!/^\d+(\.\d{1,2})?$/.test(values.price) || Number(values.price) > MAX_PRICE) {
    errors.price = `Enter a price from 0 to ${MAX_PRICE} (for example 25 or 19.99).`;
  }
  if (!db.prepare('SELECT 1 FROM categories WHERE id = ?').get(values.category_id)) {
    errors.category_id = 'Choose a category.';
  }

  return { values, errors };
}

function getAdsOfUser(userId) {
  return db
    .prepare(
      `SELECT a.*, c.name AS category_name,
              (SELECT COUNT(*) FROM comments m WHERE m.ad_id = a.id) AS comment_count
         FROM ads a JOIN categories c ON c.id = a.category_id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC, a.id DESC`
    )
    .all(userId);
}

function getAd(id) {
  return db.prepare('SELECT * FROM ads WHERE id = ?').get(Number(id));
}

function createAd(userId, values, image) {
  return db
    .prepare(
      `INSERT INTO ads (title, description, price, image, category_id, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(values.title, values.description, Number(values.price), image, values.category_id, userId).lastInsertRowid;
}

function updateAd(id, values, image) {
  db.prepare(
    `UPDATE ads SET title = ?, description = ?, price = ?, image = ?, category_id = ?,
                    updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
  ).run(values.title, values.description, Number(values.price), image, values.category_id, id);
}

function deleteAd(id) {
  db.prepare('DELETE FROM ads WHERE id = ?').run(id); // comments and favorites are deleted by ON DELETE CASCADE
}

module.exports = { getCategories, validateAd, getAdsOfUser, getAd, createAd, updateAd, deleteAd };
