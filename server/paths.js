// Folder locations used in several files.
const path = require('node:path');

module.exports = {
  DATA_DIR: path.join(__dirname, 'data'),
  DB_FILE: path.join(__dirname, 'data', 'app.db'),
  UPLOAD_DIR: path.join(__dirname, 'uploads'),
  CLIENT_DIST: path.join(__dirname, '..', 'client', 'dist'),
};
