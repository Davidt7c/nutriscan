// ==========================================================================
// NUTRISCAN — Verlauf, Cache & Einstellungen (localStorage, pro Gerät)
// Enthält außerdem den gemeinsamen App-Zustand `state` (gewählte Ziele und
// Allergene), den scoring.js für die Bewertung und main.js für die Chips
// benötigen.
// ==========================================================================
import { GOAL_LABEL } from './config.js';
import { scoreColor, esc } from './ui.js';

export const state = { allergens: new Set(), goals: [] };

const HKEY = 'ns_history', CKEY = 'ns_cache', GKEY = 'ns_goals', AKEY = 'ns_allergens', OKEY = 'ns_onboarded';

export function cacheGet(c) { try { return JSON.parse(localStorage.getItem(CKEY) || '{}')[c] || null; } catch (e) { return null; } }
export function cacheSet(c, p) { try { const o = JSON.parse(localStorage.getItem(CKEY) || '{}'); o[c] = p; localStorage.setItem(CKEY, JSON.stringify(o)); } catch (e) { } }

export function saveState() { try { localStorage.setItem(GKEY, JSON.stringify(state.goals)); localStorage.setItem(AKEY, JSON.stringify([...state.allergens])); } catch (e) { } }
export function loadState() { try { state.goals = JSON.parse(localStorage.getItem(GKEY) || '[]'); state.allergens = new Set(JSON.parse(localStorage.getItem(AKEY) || '[]')); } catch (e) { } }

export function hasOnboarded() { return !!localStorage.getItem(OKEY); }
export function markOnboarded() { try { localStorage.setItem(OKEY, '1'); } catch (e) { } }

export function addHistory(p, ev, code) {
  try {
    const h = JSON.parse(localStorage.getItem(HKEY) || '[]');
    h.unshift({ name: p.name, score: ev.final, goals: [...state.goals], code, t: Date.now() });
    localStorage.setItem(HKEY, JSON.stringify(h.slice(0, 50)));
  } catch (e) { }
}
export function clearHistory() { localStorage.removeItem(HKEY); }

export function renderHistory(onSelect) {
  let h = []; try { h = JSON.parse(localStorage.getItem(HKEY) || '[]'); } catch (e) { }
  const el = document.querySelector('#histList');
  if (!h.length) { el.innerHTML = '<div class="empty">Noch nichts gescannt.</div>'; return; }
  el.innerHTML = h.map(it => `<div class="hist-item" data-code="${esc(it.code)}">
    <div class="hist-score" style="background:${it.score != null ? scoreColor(it.score) : '#9AA9A2'}">${it.score != null ? it.score : '?'}</div>
    <div class="hist-name">${esc(it.name)}<small>${esc(it.goals.map(g => GOAL_LABEL[g]).join(', ') || 'ohne Ziel')}</small></div></div>`).join('');
  [...el.querySelectorAll('.hist-item')].forEach(x => x.addEventListener('click', () => onSelect(x.dataset.code)));
}
