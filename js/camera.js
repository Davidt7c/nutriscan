// ==========================================================================
// NUTRISCAN — Kamera-Scanner
// Native BarcodeDetector (Android/Chrome), ZXing als Fallback (iPad/Safari).
// Erkennt der Barcode-Scanner 3s lang nichts, springt der Scanner automatisch
// auf eine OCR-Erkennung (Tesseract.js) der gedruckten Ziffernreihe um.
// ==========================================================================
import { $, setStatus } from './ui.js';

let stream = null, nativeDet = null, zxing = null, scanning = false, videoTrack = null, torchOn = false;
let barcodeActive = false, ocrActive = false, ocrWorker = null, ocrFallbackTimer = null, ocrTimer = null;

const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'qr_code'];
const OCR_FALLBACK_DELAY = 3000;
const OCR_SCAN_INTERVAL = 2000;
const OCR_NUMBER_RE = /(?<!\d)\d{8,13}(?!\d)/;

export async function startCamera(onScan) {
  $('#scanOff').style.display = 'none'; $('#reticle').style.display = 'block'; $('#laser').style.display = 'block';
  const video = $('#video');
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    video.srcObject = stream; await video.play(); scanning = true; barcodeActive = true;
    videoTrack = stream.getVideoTracks()[0];

    await enableContinuousFocus(videoTrack);
    setupTorchButton(videoTrack);

    if ('BarcodeDetector' in window) { nativeDet = await createNativeDetector(); nativeLoop(video, onScan); }
    else if (window.ZXing) {
      zxing = new ZXing.BrowserMultiFormatReader(zxingHints());
      zxing.decodeFromVideoElement(video, (result) => { if (result && scanning && barcodeActive) handleScan(result.getText(), onScan); });
    }
    else { setStatus('Scanner-Bibliothek nicht geladen – Barcode bitte eintippen.', true); return; }

    ocrFallbackTimer = setTimeout(() => switchToOcr(video, onScan), OCR_FALLBACK_DELAY);
  } catch (e) { resetCam(); setStatus('Kein Kamerazugriff (Rechte/HTTPS nötig). Tippe den Barcode ein.', true); }
}

async function createNativeDetector() {
  try {
    const supported = await BarcodeDetector.getSupportedFormats();
    const formats = NATIVE_FORMATS.filter((f) => supported.includes(f));
    return new BarcodeDetector({ formats: formats.length ? formats : NATIVE_FORMATS });
  } catch (e) {
    return new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
  }
}

function zxingHints() {
  const hints = new Map();
  hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
    ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8,
    ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E,
    ZXing.BarcodeFormat.CODE_128, ZXing.BarcodeFormat.CODE_39,
    ZXing.BarcodeFormat.ITF, ZXing.BarcodeFormat.QR_CODE
  ]);
  hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
  return hints;
}

async function enableContinuousFocus(track) {
  if (!track || !track.getCapabilities) return;
  try {
    const caps = track.getCapabilities();
    if (caps.focusMode && caps.focusMode.includes('continuous')) {
      await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
    }
  } catch (e) { }
}

function setupTorchButton(track) {
  const btn = $('#torchBtn');
  if (!btn) return;
  torchOn = false;
  btn.classList.remove('on');
  let supportsTorch = false;
  try { supportsTorch = !!(track && track.getCapabilities && track.getCapabilities().torch); } catch (e) { }
  btn.style.display = supportsTorch ? 'flex' : 'none';
  btn.onclick = async () => {
    if (!videoTrack) return;
    const next = !torchOn;
    try { await videoTrack.applyConstraints({ advanced: [{ torch: next }] }); torchOn = next; btn.classList.toggle('on', torchOn); }
    catch (e) { }
  };
}

async function nativeLoop(video, onScan) {
  if (!scanning || !barcodeActive) return;
  try { const codes = await nativeDet.detect(video); if (codes.length) { handleScan(codes[0].rawValue, onScan); return; } } catch (e) { }
  requestAnimationFrame(() => nativeLoop(video, onScan));
}

/* ---------- OCR-Fallback (Tesseract.js): springt ein, wenn 3s kein Barcode erkannt wurde ----------
   Wichtig: der Videostream (stream/video.srcObject) wird hier NICHT angefasst. Nur die Barcode-Engine
   wird stillgelegt (barcodeActive = false, ihre Callbacks werden dadurch zu No-Ops). zxing.reset()
   stoppt intern auch die MediaStream-Tracks des Video-Elements — das darf beim Umschalten nicht
   passieren, sonst wird der Kamera-View schwarz. zxing wird deshalb hier bewusst NICHT zurückgesetzt,
   sondern erst in stopCam(), wenn die Kamera wirklich beendet wird. */
function switchToOcr(video, onScan) {
  ocrFallbackTimer = null;
  if (!scanning || !barcodeActive) return;
  barcodeActive = false;
  startOcr(video, onScan);
}

async function startOcr(video, onScan) {
  console.log('[NutriScan OCR] Wechsel zu OCR-Fallback. video readyState:', video.readyState, 'size:', video.videoWidth, 'x', video.videoHeight);
  setStatus('Zahlen lesen…');
  ocrActive = true;
  try {
    if (!window.Tesseract) throw new Error('Tesseract.js ist nicht geladen (CDN-Skript fehlt/blockiert)');
    console.log('[NutriScan OCR] Starte Tesseract-Worker…');
    ocrWorker = await Tesseract.createWorker('eng');
    await ocrWorker.setParameters({ tessedit_char_whitelist: '0123456789' });
    console.log('[NutriScan OCR] Tesseract-Worker bereit, prüfe alle', OCR_SCAN_INTERVAL, 'ms ein Frame.');
  } catch (e) {
    ocrActive = false;
    console.error('[NutriScan OCR] Tesseract konnte nicht gestartet werden:', e);
    setStatus('Kein Barcode erkannt – bitte Zahl eintippen.', true);
    return;
  }
  ocrLoop(video, onScan);
}

function ocrLoop(video, onScan) {
  if (!ocrActive || !scanning) return;
  ocrTimer = setTimeout(async () => {
    if (!ocrActive || !scanning) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const { data } = await ocrWorker.recognize(canvas);
      const text = (data.text || '').trim();
      const match = text.match(OCR_NUMBER_RE);
      console.log('[NutriScan OCR] Frame geprüft. Erkannter Text:', JSON.stringify(text), match ? `→ Treffer: ${match[0]}` : '(kein Treffer)');
      if (match) { handleScan(match[0], onScan); return; }
    } catch (e) { console.error('[NutriScan OCR] Fehler beim Frame-Scan:', e); }
    ocrLoop(video, onScan);
  }, OCR_SCAN_INTERVAL);
}

function stopOcr() {
  ocrActive = false;
  if (ocrTimer) { clearTimeout(ocrTimer); ocrTimer = null; }
  if (ocrWorker) { const w = ocrWorker; ocrWorker = null; try { w.terminate(); } catch (e) { } }
}

function handleScan(code, onScan) { if (!scanning) return; scanning = false; stopCam(); onScan(code); }
export function stopCam() {
  scanning = false; barcodeActive = false; torchOn = false;
  if (ocrFallbackTimer) { clearTimeout(ocrFallbackTimer); ocrFallbackTimer = null; }
  stopOcr();
  if (zxing) { try { zxing.reset(); } catch (e) { } zxing = null; }
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
  videoTrack = null;
  const btn = $('#torchBtn'); if (btn) { btn.style.display = 'none'; btn.classList.remove('on'); btn.onclick = null; }
}
export function resetCam() { stopCam(); $('#scanOff').style.display = 'flex'; $('#reticle').style.display = 'none'; $('#laser').style.display = 'none'; }
