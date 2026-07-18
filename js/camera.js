// ==========================================================================
// NUTRISCAN — Kamera-Scanner
// Native BarcodeDetector (Android/Chrome), ZXing als Fallback (iPad/Safari).
// ==========================================================================
import { $, setStatus } from './ui.js';

let stream = null, nativeDet = null, zxing = null, scanning = false;

export async function startCamera(onScan) {
  $('#scanOff').style.display = 'none'; $('#reticle').style.display = 'block'; $('#laser').style.display = 'block';
  const video = $('#video');
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
    video.srcObject = stream; await video.play(); scanning = true;
    if ('BarcodeDetector' in window) { nativeDet = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] }); nativeLoop(video, onScan); }
    else if (window.ZXing) { zxing = new ZXing.BrowserMultiFormatReader(); zxing.decodeFromVideoElement(video, (result) => { if (result && scanning) handleScan(result.getText(), onScan); }); }
    else setStatus('Scanner-Bibliothek nicht geladen – Barcode bitte eintippen.', true);
  } catch (e) { resetCam(); setStatus('Kein Kamerazugriff (Rechte/HTTPS nötig). Tippe den Barcode ein.', true); }
}
async function nativeLoop(video, onScan) {
  if (!scanning) return;
  try { const codes = await nativeDet.detect(video); if (codes.length) { handleScan(codes[0].rawValue, onScan); return; } } catch (e) { }
  requestAnimationFrame(() => nativeLoop(video, onScan));
}
function handleScan(code, onScan) { if (!scanning) return; scanning = false; stopCam(); onScan(code); }
export function stopCam() { scanning = false; if (zxing) { try { zxing.reset(); } catch (e) { } zxing = null; } if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } }
export function resetCam() { stopCam(); $('#scanOff').style.display = 'flex'; $('#reticle').style.display = 'none'; $('#laser').style.display = 'none'; }
