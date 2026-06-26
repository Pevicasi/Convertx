const path = require('path');
const fs = require('fs-extra');
const profiles = require('../config/conversionProfiles');
const { analyzeFile } = require('../services/fileAnalyzer');
const { convertFile } = require('../services/ffmpegService');
const { removeFileSafe } = require('../services/cleanupService');
const { paths } = require('../config/appConfig');

async function uploadAndAnalyze(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

    const analysis = await analyzeFile(req.file.path, req.file.originalname, req.file.size);

    return res.json({
      success: true,
      fileId: req.file.filename,
      originalName: req.file.originalname,
      analysis,
      availableFormats: Object.keys(profiles)
    });
  } catch (error) {
    if (req.file?.path) await removeFileSafe(req.file.path);
    return res.status(500).json({ error: error.message });
  }
}

async function convert(req, res) {
  const { fileId, targetFormat } = req.body;

  if (!fileId || !targetFormat) {
    return res.status(400).json({ error: 'Arquivo e formato de saída são obrigatórios.' });
  }

  const inputPath = path.join(paths.uploads, fileId);

  try {
    if (!await fs.pathExists(inputPath)) {
      return res.status(404).json({ error: 'Arquivo original não encontrado. Envie novamente.' });
    }

    const result = await convertFile(inputPath, targetFormat);
    await removeFileSafe(inputPath);

    return res.json({
      success: true,
      downloadUrl: `/api/download/${result.outputName}`,
      outputName: result.outputName
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function download(req, res) {
  const fileName = req.params.fileName;
  const filePath = path.join(paths.converted, fileName);

  try {
    if (!await fs.pathExists(filePath)) {
      return res.status(404).send('Arquivo não encontrado ou já removido.');
    }

    res.download(filePath, fileName, async () => {
      await removeFileSafe(filePath);
    });
  } catch (error) {
    return res.status(500).send('Erro ao baixar arquivo.');
  }
}

function getProfiles(req, res) {
  res.json({ success: true, profiles });
}

module.exports = { uploadAndAnalyze, convert, download, getProfiles };
