// ==========================================================================
// NUTRISCAN — Konfiguration
// Alle Bewertungs-Schwellenwerte und Listen (Zusatzstoffe, Öle, Allergene,
// Ziele) an einer Stelle, damit man die Regeln leicht anpassen kann, ohne
// die Logik in scoring.js durchsuchen zu müssen.
// ==========================================================================

/* ---------- Allergene (Vorfilter, harter Deckel) ------------------------- */
export const ALLERGENS = [
  { id: 'en:gluten', t: 'Gluten', e: '🌾' },
  { id: 'en:milk', t: 'Milch', e: '🥛' },
  { id: 'en:eggs', t: 'Ei', e: '🥚' },
  { id: 'en:nuts', t: 'Nüsse', e: '🌰' },
  { id: 'en:peanuts', t: 'Erdnuss', e: '🥜' },
  { id: 'en:soybeans', t: 'Soja', e: '🫘' },
  { id: 'en:fish', t: 'Fisch', e: '🐟' },
  { id: 'en:sesame-seeds', t: 'Sesam', e: '⚪' }
];
export const ALLERGEN_LABEL = Object.fromEntries(ALLERGENS.map(a => [a.id, a.t]));

/* ---------- Ernährungsziele (bis zu 3 gleichzeitig wählbar) -------------- */
export const GROUPS = [
  { name: 'Fitness-Ziele', tag: 'Score', goals: [
    { id: 'muskel', e: '💪', t: 'Muskelaufbau' },
    { id: 'abnehmen', e: '🔥', t: 'Abnehmen' },
    { id: 'energie', e: '⚡', t: 'Energie' },
    { id: 'ausgewogen', e: '⚖️', t: 'Ausgewogen' }
  ] },
  { name: 'Reduzieren', tag: 'Score', goals: [
    { id: 'zucker', e: '🚫', t: 'Wenig Zucker' },
    { id: 'gesfett', e: '🧈', t: 'Wenig ges. Fett' },
    { id: 'salz', e: '🧂', t: 'Wenig Salz' },
    { id: 'lowcarb', e: '🥩', t: 'Low Carb' }
  ] },
  { name: 'Primal', tag: 'Zutatenqualität', goals: [
    { id: 'primal', e: '🌿', t: 'Echt & unverarbeitet' }
  ] }
];
export const GOAL_LABEL = Object.fromEntries(GROUPS.flatMap(g => g.goals).map(x => [x.id, x.t]));

/* ---------- Zusatzstoffe (E-Nummern), für Grund-Qualität (quality()) ----- */
// Unbedenklich -> kein Punktabzug
export const BENIGN_ADDITIVES = ['e300', 'e306', 'e330', 'e440', 'e322', 'e410', 'e412', 'e415', 'e414', 'e401', 'e290', 'e296', 'e270'];
// Bedenklich -> stärkerer Punktabzug (siehe ADDITIVE_PENALTY_CONCERNING in scoring.js)
export const CONCERNING_ADDITIVES = ['e102', 'e104', 'e110', 'e120', 'e122', 'e124', 'e129', 'e131', 'e132', 'e133', 'e150d', 'e151', 'e171', 'e320', 'e321', 'e250', 'e251', 'e621', 'e951', 'e950', 'e955', 'e952', 'e954'];
// Süßstoffe -> nur "Gut zu wissen"-Hinweis, kein harter Deckel
export const SWEETENER_ADDITIVES = ['e950', 'e951', 'e952', 'e954', 'e955', 'e960', 'e961', 'e962'];

/* ---------- Öle (Zutaten-Textsuche in quality()) -------------------------- */
export const GOOD_OILS = ['leinöl', 'walnussöl', 'rapsöl', 'olivenöl', 'hanföl'];
export const BAD_OILS = ['sonnenblumenöl', 'distelöl', 'sojaöl', 'maiskeimöl'];

/* ---------- Sonstige Zutaten-Stichworte ----------------------------------- */
export const SUGAR_WORDS = ['zucker', 'glukosesirup', 'glucose-fructose', 'fruktose', 'dextrose', 'maltodextrin', 'sirup', 'saccharose', 'maltose'];
// Kleinmengen (Öl, Gewürz, Sauce) -> Salz/Zucker/Fett-Abzüge werden gedämpft
export const SMALL_QUANTITY_KEYWORDS = ['gewürz', 'öl ', 'öle', 'essig', 'würz', 'sauce', 'soße', 'dressing', 'spice', 'condiment', 'oil', 'vinegar', 'seasoning', 'aufstrich'];

/* ---------- Grund-Qualität (NOVA / Verarbeitungsgrad) --------------------- */
// NOVA-Gruppe -> Basis-Score
export const NOVA_BASE_SCORE = { 1: 9.5, 2: 8, 3: 6, 4: 2.5 };
// Fehlt die NOVA-Angabe: grobe Schätzung über die Zutatenanzahl
export const INGREDIENT_COUNT_FALLBACK_SCORE_UNKNOWN = 5; // Zutatenliste fehlt komplett
export const INGREDIENT_COUNT_FALLBACK_TIERS = [[3, 8.5], [6, 6.5], [12, 4.5]]; // [max. Zutaten, Score]
export const INGREDIENT_COUNT_FALLBACK_SCORE_MANY = 3; // mehr Zutaten als die letzte Stufe

/* ---------- Rote Flaggen (zielunabhängig, wirken immer) ------------------- */
export const ALCOHOL_ABV_CAP_THRESHOLD = 1.2; // ab diesem Vol.-% Alkohol -> Score-Deckel bei 1
export const HARDENED_FAT_SCORE_CAP = 3; // Deckel bei gehärteten/hydrierten Fetten

/* ---------- Ziel-Fit-Tabellen: Nährwert (pro 100g) -> Score --------------- */
// Format je Zeile: [Grenzwert, Score] – der erste Grenzwert, der nicht
// unterschritten wird, bestimmt den Score (siehe T() in scoring.js).
export const FIT_SUGAR_TABLE = [[.5, 10], [1.5, 9], [3, 8], [5, 7], [7.5, 6], [10, 5], [15, 4], [22.5, 3], [30, 2]];
export const FIT_SATFAT_TABLE = [[.5, 10], [1, 9], [1.5, 8], [2.5, 7], [4, 6], [6, 4.5], [8, 3], [12, 2]];
export const FIT_SALT_TABLE = [[.1, 10], [.3, 9], [.6, 8], [.9, 6.5], [1.2, 5], [1.6, 3.5], [2.2, 2]];
export const FIT_LOWCARB_TABLE = [[3, 10], [6, 9], [10, 7.5], [15, 6], [22, 4.5], [32, 3], [45, 2]];
// Muskelaufbau: Protein (g/100g) -> Score, aufsteigend geprüft (siehe Tge() in scoring.js)
export const FIT_MUSKEL_PROTEIN_TABLE = [[25, 10], [20, 9], [15, 8], [12, 7], [9, 6], [6, 4.5], [3, 3]];

/* ---------- Gesamt-Blend (Ziel-Fit + Grund-Qualität) ----------------------- */
export const GOAL_SCORE_MIN_WEIGHT = 0.7; // Ziel-Score = 0.7 * schwächstes Ziel + 0.3 * Durchschnitt
export const GOAL_SCORE_AVG_WEIGHT = 0.3;
export const FINAL_GOAL_WEIGHT = 0.7; // End-Score = 0.7 * Ziel-Score + 0.3 * Grund-Qualität
export const FINAL_QUALITY_WEIGHT = 0.3;
export const QUALITY_FLOOR_THRESHOLD = 6; // Grund-Qualität >= 6 -> Boden für den End-Score
export const QUALITY_FLOOR_VALUE = 5;
export const QUALITY_CAP_THRESHOLD = 3; // Grund-Qualität <= 3 -> Deckel für den End-Score
export const QUALITY_CAP_VALUE = 6;

/* ---------- Verdikt-Schwellen (Textbausteine) ------------------------------ */
export const VERDICT_TOP_THRESHOLD = 8;
export const VERDICT_SOLID_THRESHOLD = 6;
export const VERDICT_MODEST_THRESHOLD = 4;
