const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Le fichier doit être une image.'), false);
  }
};

module.exports = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // limite à 5 MB
  },
  fileFilter: fileFilter
}).single('image');