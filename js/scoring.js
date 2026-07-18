// ==========================================================================
// NUTRISCAN — Bewertungslogik
// quality()  → Grund-Qualität (NOVA/Zutaten/Zusatzstoffe), der "Primal-Score"
// fit()      → Ziel-Fit für ein einzelnes gewähltes Ziel
// evaluate() → Gesamtbewertung: Allergen-Deckel, rote Flaggen, Ziel-Fit +
//              Grund-Qualität kombiniert, "Gut zu wissen"-Hinweise
// ==========================================================================
import {
  BENIGN_ADDITIVES, CONCERNING_ADDITIVES, SWEETENER_ADDITIVES,
  GOOD_OILS, BAD_OILS, SMALL_QUANTITY_KEYWORDS,
  NOVA_BASE_SCORE, INGREDIENT_COUNT_FALLBACK_SCORE_UNKNOWN, INGREDIENT_COUNT_FALLBACK_TIERS, INGREDIENT_COUNT_FALLBACK_SCORE_MANY,
  ALCOHOL_ABV_CAP_THRESHOLD, HARDENED_FAT_SCORE_CAP,
  FIT_SUGAR_TABLE, FIT_SATFAT_TABLE, FIT_SALT_TABLE, FIT_LOWCARB_TABLE, FIT_MUSKEL_PROTEIN_TABLE,
  GOAL_SCORE_MIN_WEIGHT, GOAL_SCORE_AVG_WEIGHT, FINAL_GOAL_WEIGHT, FINAL_QUALITY_WEIGHT,
  QUALITY_FLOOR_THRESHOLD, QUALITY_FLOOR_VALUE, QUALITY_CAP_THRESHOLD, QUALITY_CAP_VALUE,
  VERDICT_TOP_THRESHOLD, VERDICT_SOLID_THRESHOLD, VERDICT_MODEST_THRESHOLD,
  GOAL_LABEL, ALLERGEN_LABEL
} from './config.js';
import { state } from './storage.js';

/* ---------- Kleine Zahlen-Helfer ------------------------------------------ */
export const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;
export const has = v => v !== null && v !== undefined;
export const clamp = n => Math.max(1, Math.min(10, n));

// Verneinungssicheres Suchen: "ohne X", "Xfrei", "frei von X", "kein X" -> NICHT als Treffer werten
export function ingHas(ing, word) {
  if (!ing.includes(word)) return false;
  const neg = [`ohne ${word}`, `${word}frei`, `${word} frei`, `frei von ${word}`, `kein ${word}`, `keine ${word}`, `nicht ${word}`];
  return !neg.some(p => ing.includes(p));
}
export const isSmallQty = p => SMALL_QUANTITY_KEYWORDS.some(k => (p.category + ' ' + p.name.toLowerCase()).includes(k));

/* ---------- Grund-Qualität (= Primal-Score) -------------------------------
   NOVA-Zeile ist als {nova:true} markiert (wird nur bedingt angezeigt). */
const ADDITIVE_PENALTY_CONCERNING = 0.9;
const ADDITIVE_PENALTY_OTHER = 0.3;
const HARDENED_FAT_QUALITY_PENALTY = 1.5;
const PALM_OIL_QUALITY_PENALTY = 1;
const GOOD_OIL_QUALITY_BONUS = 0.5;
const BAD_OIL_QUALITY_PENALTY = 0.5;
const RAW_MILK_QUALITY_BONUS = 0.5;
const ORGANIC_QUALITY_BONUS = 0.4;

export function quality(p) {
  const r = []; let s;
  if (has(p.nova)) {
    s = NOVA_BASE_SCORE[p.nova];
    if (p.nova >= 4) r.push({ t: 'bad', x: 'Stark verarbeitet (NOVA 4)', nova: true });
    else if (p.nova <= 2) r.push({ t: 'good', x: 'Kaum verarbeitet (NOVA ' + p.nova + ')', nova: true });
    else r.push({ t: 'neutral', x: 'Klassisch verarbeitet (NOVA 3)', nova: true });
  } else {
    s = p.ingCount == null ? INGREDIENT_COUNT_FALLBACK_SCORE_UNKNOWN
      : (INGREDIENT_COUNT_FALLBACK_TIERS.find(([max]) => p.ingCount <= max) || [null, INGREDIENT_COUNT_FALLBACK_SCORE_MANY])[1];
    r.push({ t: 'neutral', x: 'Verarbeitungsgrad geschätzt (NOVA fehlt)', nova: true });
  }
  const concern = p.additivesList.filter(a => CONCERNING_ADDITIVES.includes(a)).length;
  const other = p.additivesList.filter(a => !CONCERNING_ADDITIVES.includes(a) && !BENIGN_ADDITIVES.includes(a)).length;
  if (concern) { s -= concern * ADDITIVE_PENALTY_CONCERNING; r.push({ t: 'bad', x: `${concern} bedenkliche(r) Zusatzstoff(e)` }); }
  if (other) s -= other * ADDITIVE_PENALTY_OTHER;
  if (ingHas(p.ing, 'gehärtet') || ingHas(p.ing, 'hydrogenat')) { s -= HARDENED_FAT_QUALITY_PENALTY; r.push({ t: 'bad', x: 'Gehärtete Fette' }); }
  if (ingHas(p.ing, 'palmöl') || ingHas(p.ing, 'palmfett')) { s -= PALM_OIL_QUALITY_PENALTY; r.push({ t: 'bad', x: 'Palmöl' }); }
  if (GOOD_OILS.some(o => ingHas(p.ing, o))) { s += GOOD_OIL_QUALITY_BONUS; r.push({ t: 'good', x: 'Hochwertiges Öl (Raps/Oliven/Lein)' }); }
  if (BAD_OILS.some(o => ingHas(p.ing, o))) { s -= BAD_OIL_QUALITY_PENALTY; r.push({ t: 'bad', x: 'Omega-6-lastiges Öl' }); }
  if (ingHas(p.ing, 'rohmilch') || p.labels.includes('raw')) s += RAW_MILK_QUALITY_BONUS;
  if (p.labels.includes('organic') || ingHas(p.ing, 'bio')) s += ORGANIC_QUALITY_BONUS;
  return { score: clamp(s), reasons: r };
}

/* ---------- Ziel-Fit -------------------------------------------------------
   WICHTIGE REGEL: Die Grund-Qualität (Verarbeitungsgrad) darf ein Ergebnis
   NIE über fit() beeinflussen — das würde z.B. eine Cola Zero bei den
   Zielen "Energie"/"Wenig Zucker" zu Unrecht abwerten. Der Verarbeitungs-
   Deckel/-Boden wirkt ausschließlich über quality() in evaluate(), und der
   Deckel (Abwertung) nur, wenn "Primal" mit unter den gewählten Zielen ist. */
const MUSKEL_DEFAULT_SCORE = 1.5;
const MUSKEL_PROTEIN_PER_KCAL_BONUS_THRESHOLD = 10; // Proteinanteil an kcal in %
const MUSKEL_PROTEIN_PER_KCAL_BONUS = 0.5;
const MUSKEL_HIGH_SUGAR_THRESHOLD = 25;
const MUSKEL_HIGH_SUGAR_PENALTY = 1;

const ABNEHMEN_BASE_SCORE = 5;
const ABNEHMEN_KCAL_TABLE = [[40, 3], [80, 2], [150, 1], [250, 0], [350, -1]];
const ABNEHMEN_KCAL_ELSE = -2;
const ABNEHMEN_PROTEIN_TABLE = [[10, 1.5], [5, 0.5]];
const ABNEHMEN_FIBER_TABLE = [[6, 1], [3, 0.5]];
const ABNEHMEN_SUGAR_TABLE = [[22.5, -2], [10, -1], [5, -0.5]];
const ABNEHMEN_SATFAT_THRESHOLD = 5;
const ABNEHMEN_SATFAT_PENALTY = 1;

const ENERGIE_BASE_SCORE = 5;
const ENERGIE_CARBS_OPTIMAL_MIN = 25;
const ENERGIE_CARBS_OPTIMAL_MAX = 65;
const ENERGIE_CARBS_OPTIMAL_BONUS = 2;
const ENERGIE_CARBS_MODERATE_MIN = 15;
const ENERGIE_CARBS_MODERATE_BONUS = 1;
const ENERGIE_FIBER_TABLE = [[5, 1.5], [3, 0.5]];
const ENERGIE_SUGAR_TABLE = [[25, -2], [12, -1]];

const AUSGEWOGEN_QUALITY_WEIGHT = 0.6;
const AUSGEWOGEN_BASELINE_WEIGHT = 0.4;
const AUSGEWOGEN_BASELINE = 4;
const AUSGEWOGEN_SUGAR_THRESHOLD = 22.5;
const AUSGEWOGEN_SATFAT_THRESHOLD = 6;
const AUSGEWOGEN_SALT_THRESHOLD = 1.5;
const AUSGEWOGEN_FIBER_THRESHOLD = 5;

export function fit(goal, p) {
  const g = p.sugar, pr = p.protein, sf = p.satfat, sa = p.salt, cb = p.carbs, kc = p.kcal, fb = p.fiber, small = isSmallQty(p);
  // Tabelle "je niedriger der Wert, desto höher der Score" (erster nicht unterschrittener Grenzwert gewinnt)
  const T = (val, table, def = 1) => { if (!has(val)) return null; for (const [l, v] of table) if (val <= l) return v; return def; };
  // Tabelle "je höher der Wert, desto höher der Score/Bonus" (erster erreichter Grenzwert gewinnt)
  const Tge = (val, table, def = 1) => { if (!has(val)) return null; for (const [l, v] of table) if (val >= l) return v; return def; };
  const damp = v => (v != null && small) ? Math.max(v, 4) : v; // Kleinmengen (Öl/Gewürz/Sauce) milder bewerten
  switch (goal) {
    case 'zucker': return damp(T(g, FIT_SUGAR_TABLE));
    case 'gesfett': return damp(T(sf, FIT_SATFAT_TABLE));
    case 'salz': return damp(T(sa, FIT_SALT_TABLE));
    case 'lowcarb': return T(cb, FIT_LOWCARB_TABLE);
    case 'muskel': {
      let s = Tge(pr, FIT_MUSKEL_PROTEIN_TABLE, MUSKEL_DEFAULT_SCORE); if (s == null) return null;
      if (has(kc) && kc > 0 && pr / kc * 100 >= MUSKEL_PROTEIN_PER_KCAL_BONUS_THRESHOLD) s = Math.min(10, s + MUSKEL_PROTEIN_PER_KCAL_BONUS);
      if (has(g) && g > MUSKEL_HIGH_SUGAR_THRESHOLD) s -= MUSKEL_HIGH_SUGAR_PENALTY;
      return clamp(s);
    }
    case 'abnehmen': {
      let s = ABNEHMEN_BASE_SCORE;
      if (has(kc)) { s += T(kc, ABNEHMEN_KCAL_TABLE, ABNEHMEN_KCAL_ELSE); } else return null;
      s += Tge(pr, ABNEHMEN_PROTEIN_TABLE, 0) ?? 0;
      s += Tge(fb, ABNEHMEN_FIBER_TABLE, 0) ?? 0;
      s += Tge(g, ABNEHMEN_SUGAR_TABLE, 0) ?? 0;
      if (has(sf) && sf >= ABNEHMEN_SATFAT_THRESHOLD) s -= ABNEHMEN_SATFAT_PENALTY;
      return clamp(s);
    }
    case 'energie': {
      if (!has(cb)) return null; let s = ENERGIE_BASE_SCORE;
      s += (cb >= ENERGIE_CARBS_OPTIMAL_MIN && cb <= ENERGIE_CARBS_OPTIMAL_MAX) ? ENERGIE_CARBS_OPTIMAL_BONUS : (cb >= ENERGIE_CARBS_MODERATE_MIN ? ENERGIE_CARBS_MODERATE_BONUS : 0);
      s += Tge(fb, ENERGIE_FIBER_TABLE, 0) ?? 0;
      s += Tge(g, ENERGIE_SUGAR_TABLE, 0) ?? 0;
      return clamp(s);
    }
    case 'ausgewogen': {
      const q = quality(p).score; let s = q * AUSGEWOGEN_QUALITY_WEIGHT + AUSGEWOGEN_BASELINE * AUSGEWOGEN_BASELINE_WEIGHT;
      if (has(g) && g > AUSGEWOGEN_SUGAR_THRESHOLD) s -= 1;
      if (has(sf) && sf > AUSGEWOGEN_SATFAT_THRESHOLD) s -= 1;
      if (has(sa) && sa > AUSGEWOGEN_SALT_THRESHOLD) s -= .5;
      if (has(fb) && fb >= AUSGEWOGEN_FIBER_THRESHOLD) s += .5;
      return clamp(s);
    }
    case 'primal': return quality(p).score;
  }
  return null;
}

/* ---------- Gesamtbewertung ------------------------------------------------ */
export function evaluate(p) {
  const q = quality(p);
  let cap = 10; const flags = [];
  if (has(p.alcohol) && p.alcohol > ALCOHOL_ABV_CAP_THRESHOLD) { cap = 1; flags.push('alk'); }
  if (ingHas(p.ing, 'gehärtet') || ingHas(p.ing, 'hydrogenat')) cap = Math.min(cap, HARDENED_FAT_SCORE_CAP);

  const chosen = state.goals.length ? state.goals : ['primal'];
  const fits = chosen.map(g => ({ g, v: fit(g, p) }));
  const known = fits.filter(f => f.v != null);
  const missing = fits.filter(f => f.v == null).map(f => f.g);
  let goalScore = null;
  if (known.length) { const vals = known.map(f => f.v); goalScore = GOAL_SCORE_MIN_WEIGHT * Math.min(...vals) + GOAL_SCORE_AVG_WEIGHT * (vals.reduce((a, b) => a + b, 0) / vals.length); }

  // Allergene
  const allergenHits = [...state.allergens].filter(a => p.allergens.includes(a) || p.traces.includes(a));
  const allergenUnknown = state.allergens.size > 0 && p.allergens.length === 0;

  const qualityCapped = q.score <= QUALITY_CAP_THRESHOLD;               // schlecht gemacht -> Deckel greift
  const showProcessing = chosen.includes('primal') || qualityCapped;    // NOVA-Zeile nur dann zeigen

  const reasons = [];
  let final, verdict, sub = '';

  if (goalScore != null) {
    // Qualitäts-Begründungen (NOVA-Zeile bedingt)
    q.reasons.forEach(r => { if (r.nova && !showProcessing) return; reasons.push(r); });
    known.forEach(f => {
      const t = f.v >= 7 ? 'good' : f.v >= 4 ? 'neutral' : 'bad';
      reasons.push({ t, x: `${GOAL_LABEL[f.g]}: ${f.v >= 7 ? 'passt gut' : f.v >= 4 ? 'okay' : 'passt schlecht'}`, sub: `Ziel-Fit ${f.v}/10` });
    });
    if (missing.length) reasons.push({ t: 'neutral', x: `Keine Daten für: ${missing.map(g => GOAL_LABEL[g]).join(', ')}` });
  }

  if (allergenHits.length) {
    final = 1; verdict = 'Nicht für dich'; sub = 'Enthält laut Daten: ' + allergenHits.map(a => ALLERGEN_LABEL[a] || a.replace('en:', '')).join(', ') + '. Etikett prüfen.';
    reasons.unshift({ t: 'bad', x: 'Enthält dein Allergen – rot markiert', sub: 'Score auf 1 gedeckelt' });
  } else if (goalScore == null) {
    final = null; verdict = 'Zu wenig Daten'; sub = 'Für dein Ziel fehlen wichtige Nährwerte. Etikett prüfen.';
  } else {
    let blended = FINAL_GOAL_WEIGHT * goalScore + FINAL_QUALITY_WEIGHT * q.score;
    if (q.score >= QUALITY_FLOOR_THRESHOLD) blended = Math.max(blended, QUALITY_FLOOR_VALUE); // gesund -> Boden
    if (q.score <= QUALITY_CAP_THRESHOLD) blended = Math.min(blended, QUALITY_CAP_VALUE);      // schlecht gemacht -> Deckel
    blended = Math.min(blended, cap);                                                          // rote Flaggen deckeln hart
    final = Math.round(clamp(blended));
    const goalTxt = chosen.map(g => GOAL_LABEL[g]).join(' + ');
    if (flags.includes('alk')) { verdict = 'Enthält Alkohol'; sub = 'Für keine Ernährung sinnvoll.'; reasons.unshift({ t: 'bad', x: `Alkohol ${p.alcohol}% – Bewertung gedeckelt` }); }
    else if (goalScore < 5 && q.score >= QUALITY_FLOOR_THRESHOLD) { verdict = 'Gesund, aber nicht optimal'; sub = 'Passt nicht ideal zu „' + goalTxt + '" – trotzdem gut verzehrbar.'; }
    else if (goalScore >= 6 && q.score <= QUALITY_CAP_THRESHOLD) { verdict = 'Hilft dem Ziel – aber verarbeitet'; sub = 'Erfüllt „' + goalTxt + '", ist aber stark verarbeitet.'; }
    else if (final >= VERDICT_TOP_THRESHOLD) verdict = 'Top für dich!';
    else if (final >= VERDICT_SOLID_THRESHOLD) verdict = 'Solide Wahl';
    else if (final >= VERDICT_MODEST_THRESHOLD) verdict = 'Nur in Maßen';
    else verdict = 'Besser meiden';
  }

  // "Gut zu wissen" — steht neben dem Score, verändert ihn nicht
  const know = [];
  if (allergenHits.length) know.push('⚠️ Enthält laut Daten: ' + allergenHits.map(a => ALLERGEN_LABEL[a] || a.replace('en:', '')).join(', ') + '.');
  else if (allergenUnknown) know.push('Keine Allergen-Angaben in den Daten – Etikett prüfen.');
  if (ingHas(p.ing, 'rohmilch')) know.push('Enthält Rohmilch – für Schwangere, Kleinkinder & Immungeschwächte riskant (Listerien).');
  if (has(p.caffeine) && p.caffeine > 0) know.push('Enthält Koffein.');
  if (ingHas(p.ing, 'süßstoff') || p.additivesList.some(a => SWEETENER_ADDITIVES.includes(a))) know.push('Enthält Süßstoff – bei „Wenig Zucker" ok, bei „Primal" bewusst abgewertet.');
  if (isSmallQty(p)) know.push('Wird meist in kleinen Mengen verzehrt – pro 100 g wirkt Salz/Zucker/Fett strenger als in Wirklichkeit.');
  if (chosen.includes('muskel') && chosen.includes('abnehmen')) know.push('Muskelaufbau + Abnehmen ziehen bei den Kalorien in verschiedene Richtungen – die Bewertung ist ein Kompromiss.');

  return { final, verdict, sub, reasons, know };
}
