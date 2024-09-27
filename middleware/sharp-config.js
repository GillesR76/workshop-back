const sharp = require("sharp");
const path = require("path");

module.exports = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const fileName = `${Date.now()}-${req.file.originalname.split(' ').join('_')}.webp`;
  const outputPath = path.join(__dirname, '..', 'images', fileName);

  sharp(req.file.buffer)
    .resize({ width: 800, height: 600, fit: 'inside' })
    .webp({ quality: 80 })
    .toFile(outputPath)
    .then(() => {
      req.file.filename = fileName;
      req.file.path = outputPath;
      next();
    })
    .catch(error => {
      console.error('Sharp error:', error);
      next(error);
    });
};