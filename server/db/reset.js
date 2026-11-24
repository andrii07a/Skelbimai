// npm run reset-db : deletes the database and uploaded photos.
// The next "npm start" creates everything again with fresh demo content.
const fs = require('node:fs');
const path = require('node:path');
const { DATA_DIR, UPLOAD_DIR } = require('../paths');

try {
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
} catch (err) {
  if (err.code === 'EPERM' || err.code === 'EBUSY') {
    console.error('The database is in use. Stop the server first (Ctrl+C in its window), then run this again.');
    process.exit(1);
  }
  throw err;
}

for (const file of fs.readdirSync(UPLOAD_DIR)) {
  if (file !== '.gitkeep') fs.rmSync(path.join(UPLOAD_DIR, file), { force: true });
}

console.log('Database and uploaded photos deleted. Run "npm start" to get fresh demo content.');
