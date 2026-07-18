// ==========================================================================
// NUTRISCAN — Anzeige
// Figuren (SVG), Ergebnis-Darstellung, kleine DOM-Helfer.
// Bildschirmwechsel (go()) liegt bewusst in main.js, da renderHistory()
// (storage.js) sonst einen Zirkelbezug zu diesem Modul bräuchte.
// ==========================================================================
import { GOAL_LABEL } from './config.js';

/* ---------- DOM-Helfer ----------------------------------------------------- */
export const $ = s => document.querySelector(s);
export const $$ = s => [...document.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); // gegen HTML-Injection
export const round1 = v => Math.round(v * 10) / 10;
const has = v => v !== null && v !== undefined;

/* ---------- Figuren --------------------------------------------------------- */
export function mascot(mood, color) {
  const faces = {
    love: `<circle cx="42" cy="52" r="5" fill="#20302A"/><circle cx="78" cy="52" r="5" fill="#20302A"/><path d="M40 70 q20 20 40 0" stroke="#20302A" stroke-width="5" fill="none" stroke-linecap="round"/><text x="24" y="40" font-size="16">✨</text><text x="84" y="40" font-size="16">✨</text>`,
    happy: `<circle cx="44" cy="54" r="5" fill="#20302A"/><circle cx="76" cy="54" r="5" fill="#20302A"/><path d="M44 68 q16 14 32 0" stroke="#20302A" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    neutral: `<circle cx="44" cy="54" r="5" fill="#20302A"/><circle cx="76" cy="54" r="5" fill="#20302A"/><path d="M46 72 h28" stroke="#20302A" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    worried: `<circle cx="44" cy="56" r="5" fill="#20302A"/><circle cx="76" cy="56" r="5" fill="#20302A"/><path d="M46 74 q14 -10 28 0" stroke="#20302A" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M36 46 l12 4M84 46 l-12 4" stroke="#20302A" stroke-width="4" stroke-linecap="round"/>`,
    sad: `<circle cx="44" cy="56" r="5" fill="#20302A"/><circle cx="76" cy="56" r="5" fill="#20302A"/><path d="M44 76 q16 -14 32 0" stroke="#20302A" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M38 62 q4 6 0 12" stroke="#8FC7E8" stroke-width="4" fill="none" stroke-linecap="round"/>`
  };
  return `<svg viewBox="0 0 120 120" width="100%" height="100%">
    <ellipse cx="60" cy="112" rx="30" ry="6" fill="rgba(0,0,0,.08)"/>
    <path d="M60 10 C88 10 104 32 104 62 C104 92 86 112 60 112 C34 112 16 92 16 62 C16 32 32 10 60 10Z" fill="${color}"/>
    <path d="M60 20 C82 20 94 38 94 62 C94 86 80 102 60 102 C40 102 26 86 26 62 C26 38 38 20 60 20Z" fill="#ffffff" opacity=".92"/>
    ${faces[mood]}</svg>`;
}
export function foodBuddy(kind) {
  const e = `<circle cx="34" cy="42" r="2.6" fill="#20302A"/><circle cx="46" cy="42" r="2.6" fill="#20302A"/><path d="M34 50 q6 6 12 0" stroke="#20302A" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const s = {
    apple: `<path d="M40 20 q-4 -8 4 -8" stroke="#7A5230" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M44 16 q8 -6 12 2 q-8 2 -12 -2Z" fill="#5FC44E"/><path d="M40 22 C58 18 66 36 60 54 C56 66 44 70 40 70 C36 70 24 66 20 54 C14 36 22 18 40 22Z" fill="#EC5A56"/>${e}`,
    avocado: `<path d="M40 12 C58 12 64 34 58 54 C54 68 46 74 40 74 C34 74 26 68 22 54 C16 34 22 12 40 12Z" fill="#6BA84F"/><path d="M40 24 C52 24 56 38 52 52 C49 62 44 66 40 66 C36 66 31 62 28 52 C24 38 28 24 40 24Z" fill="#E4E9A9"/><circle cx="40" cy="48" r="9" fill="#8A5A2B"/>${e}`,
    carrot: `<path d="M40 18 L58 66 Q40 76 22 66 Z" fill="#F5943B"/><path d="M40 10 q-10 -4 -6 8 q10 -2 6 -8Z M40 10 q10 -4 6 8 q-10 -2 -6 -8Z M40 8 q0 -8 0 8" fill="#5FC44E"/>${e}`,
    drop: `<path d="M40 12 C54 34 62 44 62 56 A22 22 0 0 1 18 56 C18 44 26 34 40 12Z" fill="#3AA6E0"/><circle cx="34" cy="48" r="2.6" fill="#fff"/><circle cx="46" cy="48" r="2.6" fill="#fff"/><path d="M34 56 q6 6 12 0" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
  };
  return `<svg viewBox="0 0 80 80" width="100%" height="100%">${s[kind]}</svg>`;
}

/* ---------- Ergebnis-Anzeige ------------------------------------------------ */
const CIRC = 2 * Math.PI * 100;
export const scoreColor = s => {
  const c = getComputedStyle(document.documentElement);
  const k = s >= 9 ? '--s10' : s >= 8 ? '--s8' : s >= 6 ? '--s6' : s >= 5 ? '--s5' : s >= 4 ? '--s4' : s >= 2 ? '--s2' : '--s1';
  return c.getPropertyValue(k).trim();
};
export const scoreMood = s => s >= 9 ? 'love' : s >= 6 ? 'happy' : s >= 4 ? 'neutral' : s >= 2 ? 'worried' : 'sad';
let countTimer = null;
function countUp(el, to) {
  clearInterval(countTimer); if (to == null) { el.textContent = '?'; return; } let cur = 0; el.textContent = '0';
  countTimer = setInterval(() => { cur++; el.textContent = cur; if (cur >= to) clearInterval(countTimer); }, 70);
}

export function showResult(p, ev, state, go) {
  $('#prodName').textContent = p.name; $('#prodBrand').textContent = p.brand;
  $('#goalTags').innerHTML = (state.goals.length ? state.goals : ['primal']).map(g => `<span>${esc(GOAL_LABEL[g])}</span>`).join('');
  const s = ev.final, hasScore = s != null;
  const col = hasScore ? scoreColor(s) : '#9AA9A2', mood = hasScore ? scoreMood(s) : 'neutral';
  $('#resultMascot').innerHTML = mascot(mood, col);
  $('#resultMascot').className = 'mascot' + (hasScore && s >= 6 ? ' bounce' : '');
  countUp($('#scoreNum'), hasScore ? s : null);
  $('#verdict').textContent = ev.verdict; $('#verdict').style.color = col; $('#verdictSub').textContent = ev.sub;
  const ring = $('#ringFg'); ring.style.stroke = col; ring.setAttribute('stroke-dasharray', CIRC); ring.setAttribute('stroke-dashoffset', CIRC);
  requestAnimationFrame(() => ring.setAttribute('stroke-dashoffset', CIRC * (1 - (hasScore ? s : 0) / 10)));
  $('#reasons').innerHTML = ev.reasons.map(r => `<li class="reason reason--${r.t}"><div class="reason__ico">${r.t === 'good' ? '+' : r.t === 'bad' ? '–' : '·'}</div><div class="reason__txt">${esc(r.x)}${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</div></li>`).join('');
  const rows = [['Energie', p.kcal, 'kcal'], ['Eiweiß', p.protein, 'g'], ['Zucker', p.sugar, 'g'], ['Kohlenhydrate', p.carbs, 'g'], ['Fett', p.fat, 'g'], ['ges. Fett', p.satfat, 'g'], ['Ballaststoffe', p.fiber, 'g'], ['Salz', p.salt, 'g']];
  const shown = rows.filter(r => has(r[1]));
  $('#nutriGrid').innerHTML = shown.map(([k, v, u]) => `<div class="nutri-item"><span>${k}</span><span>${round1(v)} ${u}</span></div>`).join('');
  $('#nutriBox').style.display = shown.length ? 'block' : 'none';
  if (ev.know.length) { $('#knowCard').style.display = 'block'; $('#knowList').innerHTML = ev.know.map(k => `<li>${esc(k)}</li>`).join(''); } else $('#knowCard').style.display = 'none';
  go('result');
  if (hasScore && s >= 8) sparkle();
}
function sparkle() {
  const wrap = $('.ring-wrap');
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('div'); s.className = 'sparkle'; s.textContent = '✨';
    s.style.left = 50 + (Math.random() * 60 - 30) + '%'; s.style.top = 50 + (Math.random() * 60 - 30) + '%';
    s.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px'); s.style.setProperty('--dy', (-20 - Math.random() * 30) + 'px');
    s.style.animationDelay = (i * 60) + 'ms'; wrap.appendChild(s); setTimeout(() => s.remove(), 1400);
  }
}
export function setStatus(m, err) { const el = $('#status'); el.textContent = m; el.className = 'status' + (err ? ' err' : ''); }
