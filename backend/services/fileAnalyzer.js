const { spawn } = require('child_process');
const ffprobe = require('@ffprobe-installer/ffprobe');

function runFfprobe(filePath) {
  return new Promise((resolve, reject) => {
    const args = ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', filePath];
    const proc = spawn(ffprobe.path, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => stdout += chunk.toString());
    proc.stderr.on('data', chunk => stderr += chunk.toString());

    proc.on('close', code => {
      if (code !== 0) return reject(new Error(stderr || 'Falha ao analisar arquivo.'));
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error('Não foi possível ler a análise do arquivo.'));
      }
    });
  });
}

function formatDuration(seconds) {
  if (!seconds || Number.isNaN(Number(seconds))) return 'Desconhecida';
  const total = Math.floor(Number(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function bytesToMB(bytes) {
  return `${(Number(bytes || 0) / 1024 / 1024).toFixed(2)} MB`;
}

async function analyzeFile(filePath, originalName, fileSize) {
  const data = await runFfprobe(filePath);
  const video = data.streams.find(s => s.codec_type === 'video');
  const audio = data.streams.find(s => s.codec_type === 'audio');

  return {
    name: originalName,
    size: bytesToMB(fileSize),
    format: data.format?.format_name || 'Desconhecido',
    duration: formatDuration(data.format?.duration),
    bitrate: data.format?.bit_rate ? `${Math.round(Number(data.format.bit_rate) / 1000)} kbps` : 'Desconhecido',
    video: video ? {
      codec: video.codec_name || 'Desconhecido',
      resolution: video.width && video.height ? `${video.width}x${video.height}` : 'Desconhecida',
      fps: video.avg_frame_rate || video.r_frame_rate || 'Desconhecido',
      pixFmt: video.pix_fmt || 'Desconhecido'
    } : null,
    audio: audio ? {
      codec: audio.codec_name || 'Desconhecido',
      sampleRate: audio.sample_rate ? `${audio.sample_rate} Hz` : 'Desconhecido',
      channels: audio.channels || 'Desconhecido'
    } : null
  };
}

module.exports = { analyzeFile };
