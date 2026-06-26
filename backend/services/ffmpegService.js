const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const profiles = require('../config/conversionProfiles');
const { paths } = require('../config/appConfig');

function convertFile(inputPath, targetFormat) {
  return new Promise((resolve, reject) => {
    const profile = profiles[targetFormat];
    if (!profile) return reject(new Error('Formato de saída inválido.'));

    const outputName = `${uuidv4()}.${profile.extension}`;
    const outputPath = path.join(paths.converted, outputName);

    const args = ['-y', '-i', inputPath, ...profile.args, outputPath];
    const proc = spawn(ffmpeg.path, args);

    let stderr = '';
    proc.stderr.on('data', chunk => stderr += chunk.toString());

    proc.on('close', code => {
      if (code !== 0) {
        return reject(new Error(stderr || 'Falha na conversão.'));
      }
      resolve({ outputName, outputPath });
    });
  });
}

module.exports = { convertFile };
