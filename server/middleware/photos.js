// Listing photo upload (multer). Problems never crash the request: they end up in
// req.photoProblem and the form shows them next to the photo field.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');
const { UPLOAD_DIR } = require('../paths');

const MAX_MB = 5;
const FORMATS = {
  'image/jpeg': { extensions: ['.jpg', '.jpeg'], magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { extensions: ['.png'], magic: (b) => b.toString('hex', 0, 4) === '89504e47' },
  'image/gif': { extensions: ['.gif'], magic: (b) => b.toString('ascii', 0, 4) === 'GIF8' },
  'image/webp': {
    extensions: ['.webp'],
    magic: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
};
const WRONG_TYPE = 'Please choose a real photo: JPG, PNG, WEBP or GIF.';

const receiver = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, done) => done(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
  fileFilter(req, file, done) {
    const format = FORMATS[file.mimetype];
    const ext = path.extname(file.originalname).toLowerCase();
    if (format && format.extensions.includes(ext)) return done(null, true);
    req.photoProblem = WRONG_TYPE;
    done(null, false); // skip this file but keep reading the text fields
  },
}).single('photo');

// The browser's word about the type is not enough: look at the first bytes of the file too
function hasImageSignature(file) {
  const head = Buffer.alloc(12);
  const fd = fs.openSync(file.path, 'r');
  fs.readSync(fd, head, 0, head.length, 0);
  fs.closeSync(fd);
  return FORMATS[file.mimetype].magic(head);
}

function removePhoto(fileName) {
  if (fileName && fileName === path.basename(fileName)) {
    fs.rm(path.join(UPLOAD_DIR, fileName), { force: true }, () => {});
  }
}

function acceptPhoto(req, res, next) {
  receiver(req, res, (err) => {
    req.body ??= {};
    if (err) {
      req.photoProblem =
        err.code === 'LIMIT_FILE_SIZE' ? `This photo is bigger than ${MAX_MB} MB — please pick a smaller one.` : 'Uploading the photo failed, please try again.';
    } else if (req.file && !hasImageSignature(req.file)) {
      removePhoto(req.file.filename);
      req.file = undefined;
      req.photoProblem = WRONG_TYPE;
    }
    next();
  });
}

module.exports = { acceptPhoto, removePhoto, MAX_MB };
