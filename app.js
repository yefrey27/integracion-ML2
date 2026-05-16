const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/4jQIFUgrL/';
const CONFIDENCE_THRESHOLD = 0.75;

let model, recognizer;
let isListening = false;
let images = [];
let currentIndex = 0;
let currentFilter = 'original';
let originalImageData = null;

// DOM refs
const micBtn         = document.getElementById('micBtn');
const micStatus      = document.getElementById('micStatus');
const commandValue   = document.getElementById('commandValue');
const confidenceFill = document.getElementById('confidenceFill');
const confidenceText = document.getElementById('confidenceText');
const historyList    = document.getElementById('historyList');
const probsContainer = document.getElementById('probsContainer');
const mainCanvas     = document.getElementById('mainCanvas');
const ctx            = mainCanvas.getContext('2d');
const placeholder    = document.getElementById('placeholder');
const filterBadge    = document.getElementById('filterBadge');
const navInfo        = document.getElementById('navInfo');
const navCounter     = document.getElementById('navCounter');
const loadingOverlay = document.getElementById('loadingOverlay');

// ─── UPLOAD ZONE ───────────────────────────────────────────────────
document.getElementById('uploadZone').addEventListener('click', () =>
  document.getElementById('fileInput').click()
);
document.getElementById('fileInput').addEventListener('change', handleFiles);

document.getElementById('uploadZone').addEventListener('dragover', e => {
  e.preventDefault();
  e.currentTarget.style.borderColor = 'var(--gold)';
});
document.getElementById('uploadZone').addEventListener('dragleave', e => {
  e.currentTarget.style.borderColor = 'var(--border)';
});
document.getElementById('uploadZone').addEventListener('drop', e => {
  e.preventDefault();
  e.currentTarget.style.borderColor = 'var(--border)';
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  if (files.length) loadImages(files);
});

function handleFiles(e) {
  const files = Array.from(e.target.files);
  if (files.length) loadImages(files);
}

function loadImages(files) {
  images = [];
  let loaded = 0;
  files.forEach(file => {
    const img = new Image();
    img.onload = () => {
      images.push(img);
      loaded++;
      if (loaded === files.length) {
        currentIndex = 0;
        showImage(0);
      }
    };
    img.src = URL.createObjectURL(file);
  });
}

function showImage(index) {
  if (!images.length) return;
  const img = images[index];
  mainCanvas.width  = img.width;
  mainCanvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  originalImageData = ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
  placeholder.style.display  = 'none';
  mainCanvas.style.display   = 'block';
  filterBadge.style.display  = 'block';
  navInfo.style.display      = images.length > 1 ? 'block' : 'none';
  navCounter.textContent     = `Obra ${index + 1} / ${images.length}`;
  currentFilter              = 'original';
  filterBadge.textContent    = 'original';
}

// ─── MODEL ─────────────────────────────────────────────────────────
async function loadModel() {
  try {
    const checkpointURL = MODEL_URL + 'model.json';
    const metadataURL   = MODEL_URL + 'metadata.json';
    recognizer = speechCommands.create(
      'BROWSER_FFT',
      undefined,
      checkpointURL,
      metadataURL
    );
    await recognizer.ensureModelLoaded();
    loadingOverlay.style.display = 'none';
    micStatus.textContent = 'Modelo cargado — listo para escuchar';
    initProbsUI();
  } catch (err) {
    console.error('Error al cargar el modelo:', err);
    loadingOverlay.innerHTML = `
      <p style="color:var(--danger);font-style:italic">Error al cargar el modelo</p>
      <small>${err.message}</small>
    `;
  }
}

function initProbsUI() {
  if (!recognizer) return;
  const labels = recognizer.wordLabels();
  probsContainer.innerHTML = '';
  labels.forEach(label => {
    const row = document.createElement('div');
    row.className = 'prob-row';
    row.id = `prob-${label.replace(/\s+/g, '_').replace(/\//g, '_')}`;
    row.innerHTML = `
      <span class="prob-name">${label}</span>
      <div class="prob-bar"><div class="prob-fill" style="width:0%"></div></div>
      <span class="prob-val">0%</span>
    `;
    probsContainer.appendChild(row);
  });
}

async function toggleListening() {
  if (!recognizer) return;

  if (!isListening) {
    await recognizer.listen(result => {
      const scores = result.scores;
      const labels = recognizer.wordLabels();
      updateProbs(labels, scores);

      const maxScore = Math.max(...scores);
      const maxIdx   = scores.indexOf(maxScore);
      const label    = labels[maxIdx];

      if (maxScore > CONFIDENCE_THRESHOLD &&
          label !== '_background_noise_' &&
          label !== 'Ruido de fondo') {
        triggerCommand(label, maxScore);
      }
    }, {
      includeSpectrogram: false,
      probabilityThreshold: 0.1,
      invokeCallbackOnNoiseAndUnknown: true,
      overlapFactor: 0.50
    });

    isListening = true;
    micBtn.classList.add('active');
    micStatus.textContent = 'Escuchando...';
    micStatus.className   = 'mic-status active';
  } else {
    recognizer.stopListening();
    isListening = false;
    micBtn.classList.remove('active');
    micStatus.textContent = 'Micrófono desactivado';
    micStatus.className   = 'mic-status';
    commandValue.textContent       = '—';
    confidenceFill.style.width     = '0%';
    confidenceText.textContent     = 'Confianza: —';
  }
}

function updateProbs(labels, scores) {
  const maxScore = Math.max(...scores);
  labels.forEach((label, i) => {
    const id  = `prob-${label.replace(/\s+/g, '_').replace(/\//g, '_')}`;
    const row = document.getElementById(id);
    if (!row) return;
    const pct  = Math.round(scores[i] * 100);
    const fill = row.querySelector('.prob-fill');
    const val  = row.querySelector('.prob-val');
    fill.style.width = pct + '%';
    fill.className   = 'prob-fill' + (scores[i] === maxScore ? ' top' : '');
    val.textContent  = pct + '%';
  });
}

let lastCommand     = '';
let lastCommandTime = 0;

function triggerCommand(label, score) {
  const now = Date.now();
  if (label === lastCommand && now - lastCommandTime < 1500) return;
  lastCommand     = label;
  lastCommandTime = now;

  commandValue.classList.remove('new');
  void commandValue.offsetWidth;
  commandValue.classList.add('new');
  commandValue.textContent = label;

  const pct = Math.round(score * 100);
  confidenceFill.style.width  = pct + '%';
  confidenceText.textContent  = `Confianza: ${pct}%`;

  highlightChip(label);
  addHistory(label);
  executeCommand(label);
}

function highlightChip(label) {
  document.querySelectorAll('.cmd-chip').forEach(c => c.classList.remove('active'));
  const chip =
    document.querySelector(`.cmd-chip[data-cmd="${label}"]`) ||
    document.querySelector(`.cmd-chip[data-cmd*="${label.split('/')[0]}"]`);
  if (chip) {
    chip.classList.add('active');
    setTimeout(() => chip.classList.remove('active'), 1800);
  }
}

function addHistory(cmd) {
  const item = document.createElement('div');
  item.className = 'history-item';
  const now = new Date();
  const t = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
  item.innerHTML = `
    <span class="history-time">${t}</span>
    <span class="history-cmd">${cmd}</span>
  `;
  const empty = historyList.children[0];
  if (empty && empty.querySelector('.history-cmd')?.textContent === 'Sin comandos aún') {
    historyList.innerHTML = '';
  }
  historyList.prepend(item);
  if (historyList.children.length > 20) historyList.removeChild(historyList.lastChild);
}

// ─── COMMAND ACTIONS ───────────────────────────────────────────────
function executeCommand(label) {
  const l = label.toLowerCase();

  if      (l.includes('siguiente') || l.includes('next')) nextImage();
  else if (l.includes('anterior'))                        prevImage();
  else if (l.includes('abrir'))                           document.getElementById('fileInput').click();
  else if (l.includes('cerrar'))                          closeImage();
  else if (l.includes('guardar'))                         saveImage();
  else if (l.includes('pixel'))                           applyFilter('pixel');
  else if (l.includes('oleo') || l.includes('óleo'))      applyFilter('oleo');
  else if (l.includes('blanco') || l.includes('negro'))   applyFilter('byn');
  else if (l.includes('original'))                        applyFilter('original');
  else if (l.includes('soplo'))                           applyFilter('soplo');
}

function nextImage() {
  if (!images.length) return;
  currentIndex = (currentIndex + 1) % images.length;
  showImage(currentIndex);
  applyFilter(currentFilter);
}

function prevImage() {
  if (!images.length) return;
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  showImage(currentIndex);
  applyFilter(currentFilter);
}

function closeImage() {
  images             = [];
  currentIndex       = 0;
  mainCanvas.style.display  = 'none';
  placeholder.style.display = 'flex';
  filterBadge.style.display = 'none';
  navInfo.style.display     = 'none';
  originalImageData         = null;
}

function saveImage() {
  if (!images.length) return;
  const link      = document.createElement('a');
  link.download   = `galeria_${currentFilter}_${Date.now()}.png`;
  link.href       = mainCanvas.toDataURL('image/png');
  link.click();
}

function applyFilter(type) {
  if (!originalImageData) {
    currentFilter          = type;
    filterBadge.textContent = type;
    return;
  }
  currentFilter          = type;
  filterBadge.textContent = type;

  ctx.putImageData(originalImageData, 0, 0);
  const imageData = ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
  const data      = imageData.data;

  if (type === 'byn') {
    for (let i = 0; i < data.length; i += 4) {
      const avg = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      data[i] = data[i+1] = data[i+2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);

  } else if (type === 'pixel') {
    ctx.putImageData(originalImageData, 0, 0);
    const size = Math.max(10, Math.floor(Math.min(mainCanvas.width, mainCanvas.height) / 40));
    for (let y = 0; y < mainCanvas.height; y += size) {
      for (let x = 0; x < mainCanvas.width; x += size) {
        const px = ctx.getImageData(x, y, 1, 1).data;
        ctx.fillStyle = `rgb(${px[0]},${px[1]},${px[2]})`;
        ctx.fillRect(x, y, size, size);
      }
    }

  } else if (type === 'oleo') {
    const tempCanvas    = document.createElement('canvas');
    tempCanvas.width    = mainCanvas.width;
    tempCanvas.height   = mainCanvas.height;
    const tctx          = tempCanvas.getContext('2d');
    tctx.putImageData(originalImageData, 0, 0);
    const td     = tctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const levels = 5;
    for (let i = 0; i < td.data.length; i += 4) {
      td.data[i]   = Math.round(td.data[i]   / (255/levels)) * (255/levels);
      td.data[i+1] = Math.round(td.data[i+1] / (255/levels)) * (255/levels);
      td.data[i+2] = Math.round(td.data[i+2] / (255/levels)) * (255/levels);
    }
    tctx.putImageData(td, 0, 0);
    ctx.filter = 'blur(1.5px)';
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'hsl(0,80%,50%)';
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.globalCompositeOperation = 'source-over';

  } else if (type === 'soplo') {
    ctx.filter = 'blur(3px)';
    ctx.drawImage(images[currentIndex], 0, 0);
    ctx.filter = 'none';

  }
  // 'original' ya fue restaurado arriba con putImageData
}

// Init
window.addEventListener('load', loadModel);
