// Everything about listings: checking the form, saving, and the public catalogue queries.
const db = require('../db/database');

const LIMITS = { titleMin: 3, titleMax: 100, detailsMin: 10, detailsMax: 3000, maxEuro: 1000000 };

// ---------- money ----------
// "19,99" or "19.99" -> 1999 cents; returns null when the text is not a price
function parseEuroToCents(text) {
  const clean = String(text ?? '').trim().replace(',', '.');
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(clean)) return null;
  const cents = Math.round(Number(clean) * 100);
  return cents <= LIMITS.maxEuro * 100 ? cents : null;
}

const centsToEuro = (cents) => (cents / 100).toFixed(2);

// ---------- categories ----------
const allCategories = db.prepare('SELECT id, title FROM categories ORDER BY title');
const categoryExists = db.prepare('SELECT 1 FROM categories WHERE id = ?');

// ---------- form check ----------
// Returns { clean, fieldErrors }. "clean" is ready for the database.
function checkListingForm(form) {
  const clean = {
    title: String(form.title ?? '').trim(),
    details: String(form.details ?? '').trim(),
    categoryId: Number.parseInt(form.categoryId, 10),
    priceCents: parseEuroToCents(form.price),
  };
  const fieldErrors = {};

  if (clean.title.length < LIMITS.titleMin || clean.title.length > LIMITS.titleMax) {
    fieldErrors.title = `The title should be ${LIMITS.titleMin}–${LIMITS.titleMax} characters long.`;
  }
  if (clean.details.length < LIMITS.detailsMin || clean.details.length > LIMITS.detailsMax) {
    fieldErrors.details = `Describe the item in ${LIMITS.detailsMin}–${LIMITS.detailsMax} characters.`;
  }
  if (clean.priceCents === null) {
    fieldErrors.price = 'Write the price in euros, e.g. 25 or 12.50 (0 means free).';
  }
  if (!categoryExists.get(clean.categoryId)) {
    fieldErrors.categoryId = 'Pick the category that fits best.';
  }
  return { clean, fieldErrors };
}

// ---------- the seller's own listings ----------
const sellerListings = db.prepare(`
  SELECT l.*, c.title AS category_title,
         (SELECT COUNT(*) FROM comments m WHERE m.listing_id = l.id) AS comments_total
    FROM listings l JOIN categories c ON c.id = l.category_id
   WHERE l.seller_id = ?
   ORDER BY l.posted_at DESC, l.id DESC`);
const oneListing = db.prepare('SELECT * FROM listings WHERE id = ?');
const insertListing = db.prepare(`
  INSERT INTO listings (seller_id, category_id, title, details, price_cents, photo)
  VALUES (:sellerId, :categoryId, :title, :details, :priceCents, :photo)`);
const updateListing = db.prepare(`
  UPDATE listings
     SET category_id = :categoryId, title = :title, details = :details,
         price_cents = :priceCents, photo = :photo, edited_at = datetime('now')
   WHERE id = :id`);
const removeListing = db.prepare('DELETE FROM listings WHERE id = ?'); // comments + stars go too (CASCADE)

// ---------- public catalogue (used by the REST API) ----------
// Only listings that are not blocked and whose seller is not blocked are public.
const VISIBLE = 'l.blocked_at IS NULL AND s.blocked_at IS NULL';
const ORDERS = {
  newest: 'l.posted_at DESC, l.id DESC',
  price_asc: 'l.price_cents ASC, l.id DESC',
  price_desc: 'l.price_cents DESC, l.id DESC',
};

function catalogueSql(where, order = ORDERS.newest) {
  return `
    SELECT l.id, l.title, l.details, l.price_cents, l.photo, l.posted_at,
           c.id AS category_id, c.title AS category_title, s.username AS seller,
           (SELECT COUNT(*) FROM comments m JOIN users a ON a.id = m.author_id
             WHERE m.listing_id = l.id AND m.blocked_at IS NULL AND a.blocked_at IS NULL) AS comments_total,
           (SELECT COUNT(*) FROM saved_listings sv WHERE sv.listing_id = l.id AND sv.user_id = :viewer) AS saved_by_viewer
      FROM listings l
      JOIN users s      ON s.id = l.seller_id
      JOIN categories c ON c.id = l.category_id
     WHERE ${VISIBLE} ${where}
     ORDER BY ${order}`;
}

// Turns a database row into the JSON shape the React app uses
function toCard(row) {
  return {
    id: row.id,
    title: row.title,
    details: row.details,
    price: row.price_cents / 100,
    photoUrl: `/uploads/${row.photo}`,
    category: { id: row.category_id, title: row.category_title },
    seller: row.seller,
    postedAt: row.posted_at,
    commentsTotal: row.comments_total,
    saved: row.saved_by_viewer > 0,
  };
}

// filters: { categoryId, phrase, order }, viewerId: signed-in member id or 0
function searchCatalogue({ categoryId, phrase, order }, viewerId) {
  let where = '';
  const params = { viewer: viewerId };
  if (categoryId) {
    where += ' AND l.category_id = :categoryId';
    params.categoryId = categoryId;
  }
  if (phrase) {
    // % and _ typed by the visitor are matched literally
    params.phrase = `%${phrase.replace(/[\\%_]/g, (ch) => '\\' + ch)}%`;
    where += " AND (l.title LIKE :phrase ESCAPE '\\' OR l.details LIKE :phrase ESCAPE '\\')";
  }
  return db.prepare(catalogueSql(where, ORDERS[order] ?? ORDERS.newest)).all(params).map(toCard);
}

function findPublicListing(id, viewerId) {
  const row = db.prepare(catalogueSql('AND l.id = :id')).get({ id: Number(id) || 0, viewer: viewerId });
  return row ? toCard(row) : null;
}

function savedByMember(memberId) {
  return db
    .prepare(catalogueSql('AND l.id IN (SELECT listing_id FROM saved_listings WHERE user_id = :viewer)'))
    .all({ viewer: memberId })
    .map(toCard);
}

const visibleComments = db.prepare(`
  SELECT m.id, m.body, m.posted_at, a.username AS author
    FROM comments m JOIN users a ON a.id = m.author_id
   WHERE m.listing_id = ? AND m.blocked_at IS NULL AND a.blocked_at IS NULL
   ORDER BY m.posted_at, m.id`);

const toCommentJson = (row) => ({ id: row.id, text: row.body, author: row.author, postedAt: row.posted_at });

module.exports = {
  LIMITS,
  centsToEuro,
  categories: () => allCategories.all(),
  checkListingForm,
  listingsOfSeller: (sellerId) => sellerListings.all(sellerId),
  getListing: (id) => oneListing.get(Number(id) || 0) ?? null,
  createListing: (data) => insertListing.run(data).lastInsertRowid,
  saveListingChanges: (data) => updateListing.run(data),
  deleteListing: (id) => removeListing.run(id),
  searchCatalogue,
  findPublicListing,
  savedByMember,
  commentsOf: (listingId) => visibleComments.all(listingId).map(toCommentJson),
  toCommentJson,
};
