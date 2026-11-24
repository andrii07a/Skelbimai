// npm run reset-db : deletes the database and uploaded photos.
// On the next start the database is created again with fresh demo data.
const fs = require('node:fs');
const path = require('node:path');
const { DATA_DIR, UPLOAD_DIR } = require('../paths');

fs.rmSync(DATA_DIR, { recursive: true, force: true });

for (const file of fs.readdirSync(UPLOAD_DIR)) {
  if (file !== '.gitkeep') fs.rmSync(path.join(UPLOAD_DIR, file), { force: true });
}

console.log('Database and uploads deleted. Run "npm start" to create fresh demo data.');
