const path = require('path');

const ROOT = path.join(__dirname, '..');

module.exports = {
  port: process.env.PORT || 3000,
  maxUploadSize: 300 * 1024 * 1024, // 300 MB
  tempFileMaxAgeMs: 15 * 60 * 1000, // 15 minutos
  cleanupIntervalMs: 5 * 60 * 1000, // 5 minutos
  paths: {
    frontend: path.join(ROOT, '..', 'frontend'),
    uploads: path.join(ROOT, 'uploads'),
    converted: path.join(ROOT, 'converted'),
    temp: path.join(ROOT, 'temp')
  },
  allowedInputExtensions: [
    '.mp4', '.avi', '.mkv', '.mov', '.webm', '.flv', '.wmv',
    '.mp3', '.aac', '.wav', '.ogg', '.m4a'
  ]
};
