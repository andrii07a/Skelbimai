// Photo upload with multer: jpg / png / webp / gif, max 5 MB.
// Errors do not crash the request: they are saved in req.uploadError and shown in the form.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');
const { UPLOAD_DIR } = require('../paths');

const MAX_SIZE_MB = 5;
const ALLOWED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
};
const TYPE_ERROR = 'Only JPG, PNG, WEBP or GIF images are allowed.';

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ALLOWED[file.mimetype];
    if (!allowedExts || !allowedExts.includes(ext)) {
      req.uploadError = TYPE_ERROR;
      return cb(null, false); // skip the file, keep reading the other form fields
    }
    cb(null, true);
  },
}).single('image');

// Checks the first bytes of the file, so a renamed .txt or .exe is not accepted as a photo.
function looksLikeImage(filePath) {
  const bytes = Buffer.alloc(12);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, bytes, 0, 12, 0);
  fs.closeSync(fd);
  const hex = bytes.toString('hex');
  return (
    hex.startsWith('ffd8ff') || // JPEG
    hex.startsWith('89504e47') || // PNG
    hex.startsWith('47494638') || // GIF
    (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP')
  );
}

function deleteImage(fileName) {
  if (!fileName || fileName !== path.basename(fileName)) return; // only plain file names
  fs.rm(path.join(UPLOAD_DIR, fileName), { force: true }, () => {});
}

function uploadImage(req, res, next) {
  multerUpload(req, res, (err) => {
    if (err) {
      req.uploadError =
        err.code === 'LIMIT_FILE_SIZE'
          ? `The photo is too large (max ${MAX_SIZE_MB} MB).`
          : 'The photo could not be uploaded.';
    } else if (req.file && !looksLikeImage(req.file.path)) {
      deleteImage(req.file.filename);
      req.file = undefined;
      req.uploadError = TYPE_ERROR;
    }
    req.body = req.body || {};
    next();
  });
}

module.exports = { uploadImage, deleteImage, MAX_SIZE_MB };
