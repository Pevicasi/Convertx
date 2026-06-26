const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const chooseBtn = document.getElementById('chooseBtn');
const filePanel = document.getElementById('filePanel');
const fileInfo = document.getElementById('fileInfo');
const formatSelect = document.getElementById('formatSelect');
const convertBtn = document.getElementById('convertBtn');
const statusBox = document.getElementById('statusBox');
const downloadPanel = document.getElementById('downloadPanel');
const downloadLink = document.getElementById('downloadLink');

let currentFileId = null;

function showStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.remove('hidden', 'error');
  if (isError) statusBox.classList.add('error');
}

function hideStatus() {
  statusBox.classList.add('hidden');
}

function renderInfo(analysis) {
  const items = [
    ['Nome', analysis.name],
    ['Tamanho', analysis.size],
    ['Formato', analysis.format],
    ['Duração', analysis.duration],
    ['Bitrate', analysis.bitrate],
    ['Vídeo', analysis.video ? analysis.video.codec : 'Sem vídeo'],
    ['Resolução', analysis.video ? analysis.video.resolution : '-'],
    ['FPS', analysis.video ? analysis.video.fps : '-'],
    ['Áudio', analysis.audio ? analysis.audio.codec : 'Sem áudio'],
    ['Sample rate', analysis.audio ? analysis.audio.sampleRate : '-']
  ];

  fileInfo.innerHTML = items.map(([label, value]) => `
    <div class="info-item">
      <small>${label}</small>
      <strong>${value || '-'}</strong>
    </div>
  `).join('');
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  showStatus('Enviando e analisando arquivo...');
  downloadPanel.classList.add('hidden');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Falha no upload.');

  currentFileId = data.fileId;
  renderInfo(data.analysis);
  filePanel.classList.remove('hidden');
  hideStatus();
}

async function convertCurrentFile() {
  if (!currentFileId) return showStatus('Envie um arquivo primeiro.', true);

  convertBtn.disabled = true;
  showStatus('Convertendo... Aguarde até finalizar.');

  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId: currentFileId,
        targetFormat: formatSelect.value
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Falha na conversão.');

    downloadLink.href = data.downloadUrl;
    downloadPanel.classList.remove('hidden');
    showStatus('Conversão concluída. Faça o download agora.');
    currentFileId = null;
  } catch (error) {
    showStatus(error.message, true);
  } finally {
    convertBtn.disabled = false;
  }
}

chooseBtn.addEventListener('click', () => fileInput.click());
dropArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) uploadFile(file).catch(err => showStatus(err.message, true));
});

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, event => {
    event.preventDefault();
    dropArea.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, event => {
    event.preventDefault();
    dropArea.classList.remove('dragover');
  });
});

dropArea.addEventListener('drop', event => {
  const file = event.dataTransfer.files[0];
  if (file) uploadFile(file).catch(err => showStatus(err.message, true));
});

convertBtn.addEventListener('click', convertCurrentFile);

downloadLink.addEventListener('click', () => {
  setTimeout(() => {
    downloadPanel.classList.add('hidden');
    filePanel.classList.add('hidden');
    fileInput.value = '';
    showStatus('Arquivo baixado. Para baixar novamente, será necessário converter outra vez.');
  }, 1200);
});
