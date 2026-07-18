// ==========================================================================
// NUTRISCAN — Produktdaten
// Open-Food-Facts-Abruf (API v2, kein Key nötig), normalize() auf unser
// internes Produkt-Format, EAN-Prüfziffer und die Offline-Demoprodukte.
// ==========================================================================
import { num, evaluate } from './scoring.js';
import { setStatus, showResult } from './ui.js';
import { state, cacheGet, cacheSet, addHistory } from './storage.js';

export function normalize(off) {
  const n = off.nutriments || {};
  const ing = (off.ingredients_text_de || off.ingredients_text || '').toLowerCase();
  const ingCount = Array.isArray(off.ingredients) ? off.ingredients.length : (ing ? ing.split(',').length : null);
  return {
    name: off.product_name_de || off.product_name || off.generic_name || 'Unbekanntes Produkt',
    brand: (off.brands || '').split(',')[0] || '',
    sugar: num(n['sugars_100g']), protein: num(n['proteins_100g']), fat: num(n['fat_100g']),
    satfat: num(n['saturated-fat_100g']), salt: num(n['salt_100g']), kcal: num(n['energy-kcal_100g']),
    fiber: num(n['fiber_100g']), carbs: num(n['carbohydrates_100g']),
    alcohol: num(n['alcohol_100g']) ?? num(n['alcohol']), caffeine: num(n['caffeine_100g']),
    nova: num(off.nova_group),
    additivesList: (off.additives_tags || []).map(t => t.replace('en:', '').toLowerCase()),
    allergens: (off.allergens_tags || []), traces: (off.traces_tags || []),
    labels: (off.labels_tags || []).join(' '), category: (off.categories_tags || []).join(' '), ing, ingCount
  };
}

export function validEAN(code) {
  if (!/^\d{8}$|^\d{12,13}$/.test(code)) return true;
  if (code.length !== 13) return true;
  const d = code.split('').map(Number);
  const sum = d.slice(0, 12).reduce((a, x, i) => a + x * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === d[12];
}

export async function lookup(code, go) {
  code = String(code).trim();
  if (code.startsWith('demo-')) { const p = DEMO[code.slice(5)]; if (p) { finishLookup(p, code, go); return; } } // Beispiele aus dem Verlauf
  if (code[0] === '2') { setStatus('Sieht nach händlerinternem Code aus (Waage/Theke) – nicht in der Datenbank.', true); return; }
  if (!validEAN(code)) { setStatus('Barcode unvollständig gelesen – bitte nochmal scannen.', true); return; }
  const cached = cacheGet(code); if (cached) { finishLookup(cached, code, go); return; }
  setStatus('Suche Produkt …');
  try {
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`, { signal: ctrl.signal });
    clearTimeout(timer);
    const data = await res.json();
    if (data.status !== 1) { setStatus('Produkt nicht gefunden. Verpacktes Produkt? Sonst Etikett prüfen.', true); return; }
    const p = normalize(data.product); cacheSet(code, p); finishLookup(p, code, go);
  } catch (e) {
    setStatus(e.name === 'AbortError' ? 'Keine Antwort – in dieser Vorschau ist Internet blockiert. Nutze die Beispiele, oder hoste die App.' : 'Keine Verbindung zur Datenbank. Probier ein Beispiel unten.', true);
  }
}
function finishLookup(p, code, go) { setStatus(''); const ev = evaluate(p); showResult(p, ev, state, go); addHistory(p, ev, code); }

/* ---------- Demo-Produkte (offline) ---------------------------------------- */
export const DEMO = {
  quark: { name: 'Magerquark', brand: 'Beispiel', sugar: 4, protein: 12, fat: 0.3, satfat: 0.2, salt: 0.1, kcal: 67, fiber: 0, carbs: 4, nova: 1, additivesList: [], allergens: ['en:milk'], traces: [], labels: '', category: 'dairies', ing: 'magermilch', ingCount: 1 },
  cola: { name: 'Cola', brand: 'Beispiel', sugar: 10.6, protein: 0, fat: 0, satfat: 0, salt: 0, kcal: 42, fiber: 0, carbs: 10.6, nova: 4, additivesList: ['e150d', 'e338'], allergens: [], traces: [], labels: '', category: 'beverages', ing: 'wasser, zucker, farbstoff e150d, säuerungsmittel phosphorsäure, aroma, koffein', ingCount: 6, caffeine: 10 },
  colazero: { name: 'Cola Zero', brand: 'Beispiel', sugar: 0, protein: 0, fat: 0, satfat: 0, salt: 0, kcal: 0.3, fiber: 0, carbs: 0, nova: 4, additivesList: ['e150d', 'e950', 'e951'], allergens: [], traces: [], labels: '', category: 'beverages', ing: 'wasser, farbstoff e150d, süßstoff e950 e951, aroma, koffein', ingCount: 5, caffeine: 10 },
  riegel: { name: 'Proteinriegel', brand: 'Beispiel', sugar: 6, protein: 30, fat: 12, satfat: 6, salt: 0.4, kcal: 350, fiber: 8, carbs: 24, nova: 4, additivesList: ['e422'], allergens: ['en:milk', 'en:soybeans'], traces: ['en:nuts'], labels: '', category: 'snacks', ing: 'milchprotein, sojaprotein, feuchthaltemittel, süßstoff, aroma, palmöl', ingCount: 6 },
  avocado: { name: 'Avocado', brand: 'Beispiel', sugar: 0.7, protein: 2, fat: 15, satfat: 2.1, salt: 0, kcal: 160, fiber: 6.7, carbs: 1.8, nova: 1, additivesList: [], allergens: [], traces: [], labels: 'organic', category: 'fruits', ing: 'avocado', ingCount: 1 },
  gummi: { name: 'Gummibärchen', brand: 'Beispiel', sugar: 46, protein: 6, fat: 0.2, satfat: 0.1, salt: 0.1, kcal: 343, fiber: 0, carbs: 77, nova: 4, additivesList: ['e120', 'e102'], allergens: [], traces: [], labels: '', category: 'sweets', ing: 'glukosesirup, zucker, gelatine, farbstoff e120, e102, aroma', ingCount: 6 },
  hafer: { name: 'Haferflocken', brand: 'Beispiel', sugar: 1, protein: 13, fat: 7, satfat: 1.3, salt: 0, kcal: 370, fiber: 10, carbs: 59, nova: 1, additivesList: [], allergens: ['en:gluten'], traces: [], labels: '', category: 'cereals', ing: 'vollkornhafer', ingCount: 1 },
  bier: { name: 'Pils', brand: 'Beispiel', sugar: 0, protein: 0.5, fat: 0, satfat: 0, salt: 0, kcal: 42, fiber: 0, carbs: 3.3, nova: 3, additivesList: [], allergens: ['en:gluten'], traces: [], labels: '', category: 'beverages alcoholic', ing: 'wasser, gerstenmalz, hopfen', ingCount: 3, alcohol: 4.9 },
  oel: { name: 'Natives Olivenöl', brand: 'Beispiel', sugar: 0, protein: 0, fat: 100, satfat: 14, salt: 0, kcal: 899, fiber: 0, carbs: 0, nova: 2, additivesList: [], allergens: [], traces: [], labels: 'organic', category: 'oils olive-oils', ing: 'natives olivenöl extra', ingCount: 1 },
};
