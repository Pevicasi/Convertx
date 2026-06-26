const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { uploadAndAnalyze, convert, download, getProfiles } = require('../controllers/convertController');
const { paths, maxUploadSize, allowedInputExtensions } = require('../config/appConfig');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, paths.uploads),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: maxUploadSize },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedInputExtensions.includes(ext)) {
      return cb(new Error('Formato de entrada não permitido.'));
    }
    cb(null, true);
  }
});

router.get('/profiles', getProfiles);
router.post('/upload', upload.single('file'), uploadAndAnalyze);
router.post('/convert', convert);
router.get('/download/:fileName', download);

module.exports = router;
