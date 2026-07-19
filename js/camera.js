// ==========================================================================
// NUTRISCAN — Kamera-Scanner
// Native BarcodeDetector (Android/Chrome), ZXing als Fallback (iPad/Safari).
// ==========================================================================
import { $, setStatus } from './ui.js';

let stream = null, nativeDet = null, zxing = null, scanning = false, videoTrack = null, torchOn = false;

const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'qr_code'];

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
    video.srcObject = stream; await video.play(); scanning = true;
    videoTrack = stream.getVideoTracks()[0];

    await enableContinuousFocus(videoTrack);
    setupTorchButton(videoTrack);

    if ('BarcodeDetector' in window) { nativeDet = await createNativeDetector(); nativeLoop(video, onScan); }
    else if (window.ZXing) {
      zxing = new ZXing.BrowserMultiFormatReader(zxingHints());
      zxing.decodeFromVideoElement(video, (result) => { if (result && scanning) handleScan(result.getText(), onScan); });
    }
    else setStatus('Scanner-Bibliothek nicht geladen – Barcode bitte eintippen.', true);
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
  if (!scanning) return;
  try { const codes = await nativeDet.detect(video); if (codes.length) { handleScan(codes[0].rawValue, onScan); return; } } catch (e) { }
  requestAnimationFrame(() => nativeLoop(video, onScan));
}
function handleScan(code, onScan) { if (!scanning) return; scanning = false; stopCam(); onScan(code); }
export function stopCam() {
  scanning = false; torchOn = false;
  if (zxing) { try { zxing.reset(); } catch (e) { } zxing = null; }
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
  videoTrack = null;
  const btn = $('#torchBtn'); if (btn) { btn.style.display = 'none'; btn.classList.remove('on'); btn.onclick = null; }
}
export function resetCam() { stopCam(); $('#scanOff').style.display = 'flex'; $('#reticle').style.display = 'none'; $('#laser').style.display = 'none'; }
