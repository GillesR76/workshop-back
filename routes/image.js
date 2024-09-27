const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const sharpConfig = require('../middleware/sharp-config');
const imageCtrl = require('../controllers/image');

router.post('/', auth, multer, sharpConfig, imageCtrl.createImage);
router.get('/', auth, imageCtrl.getAllImages);
router.get('/:id', imageCtrl.getOneImage);
router.put('/:id', auth, multer, sharpConfig, imageCtrl.modifyImage);
router.delete('/:id', auth, imageCtrl.deleteImage);

module.exports = router;