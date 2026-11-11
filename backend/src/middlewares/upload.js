const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('../utils/appError');

const uploadDirectory = path.resolve(__dirname, '../../uploads/competitions');
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = {
  poster: new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp']
  ]),
  guidebook: new Map([['application/pdf', '.pdf']])
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = allowedTypes[file.fieldname]?.get(file.mimetype);
    if (!extension) return callback(new AppError('Format file tidak didukung.', 422));
    const random = crypto.randomBytes(6).toString('hex');
    return callback(null, `${file.fieldname}-${Date.now()}-${random}${extension}`);
  }
});

const uploader = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes[file.fieldname]?.has(file.mimetype)) {
      return callback(new AppError(
        file.fieldname === 'poster'
          ? 'Poster harus berformat JPG, PNG, atau WEBP.'
          : 'Panduan harus berupa file PDF.',
        422
      ));
    }
    return callback(null, true);
  }
}).fields([
  { name: 'poster', maxCount: 1 },
  { name: 'guidebook', maxCount: 1 }
]);

function removeUploadedFiles(req) {
  const files = Object.values(req.files || {}).flat();
  for (const file of files) {
    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

function uploadCompetitionFiles(req, res, next) {
  uploader(req, res, (error) => {
    if (error) {
      try {
        removeUploadedFiles(req);
      } catch (cleanupError) {
        return next(cleanupError);
      }
      if (error instanceof multer.MulterError) {
        const message = error.code === 'LIMIT_FILE_SIZE'
          ? 'Ukuran file melebihi batas yang diizinkan.'
          : 'Jumlah atau jenis file tidak sesuai.';
        return next(new AppError(message, 422));
      }
      return next(error);
    }

    const poster = req.files?.poster?.[0];
    if (poster && poster.size > 2 * 1024 * 1024) {
      try {
        removeUploadedFiles(req);
      } catch (cleanupError) {
        return next(cleanupError);
      }
      return next(new AppError('Ukuran poster maksimal 2 MB.', 422));
    }
    return next();
  });
}

module.exports = { removeUploadedFiles, uploadCompetitionFiles };
