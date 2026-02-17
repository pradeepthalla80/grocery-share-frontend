const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const {
  recognizeFoodImage,
  smartSearch,
  checkItemFreshness,
} = require('../controllers/aiController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

router.post('/recognize-food', auth, upload.single('image'), recognizeFoodImage);
router.get('/smart-search', smartSearch);
router.post('/freshness-check', auth, upload.single('image'), checkItemFreshness);

module.exports = router;
