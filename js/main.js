// ==========================================================================
// NUTRISCAN — Initialisierung + Events
// Bildschirmnavigation, Figuren einsetzen, Chips/Buttons verdrahten,
// gespeicherten Zustand laden.
// ==========================================================================
import { ALLERGENS, GROUPS } from './config.js';
import { $, $$, mascot, foodBuddy, showResult } from './ui.js';
import { evaluate } from './scoring.js';
import { state, loadState, saveState, hasOnboarded, markOnboarded, renderHistory, clearHistory, addHistory } from './storage.js';
import { lookup, DEMO } from './data.js';
import { startCamera, resetCam } from './camera.js';

/* ---------- Bildschirmnavigation ------------------------------------------- */
function go(screen) {
  $$('.screen').forEach(s => s.classList.toggle('on', s.dataset.screen === screen));
  const showNav = ['scan', 'goals', 'history', 'result'].includes(screen);
  $('#nav').style.display = showNav ? 'flex' : 'none'; $('#editGoals').style.display = showNav ? 'inline-flex' : 'none';
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.nav === screen || (screen === 'result' && b.dataset.nav === 'scan')));
  if (screen === 'history') renderHistory(code => { go('scan'); lookup(code, go); });
  if (screen !== 'scan') resetCam();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Figuren einsetzen ----------------------------------------------- */
$('#fApple').innerHTML = foodBuddy('apple'); $('#fAvo').innerHTML = foodBuddy('avocado');
$('#fCarrot').innerHTML = foodBuddy('carrot'); $('#fDrop').innerHTML = foodBuddy('drop');
$('#heroBuddy').innerHTML = mascot('happy', '#22B573');

/* ---------- Allergen-Chips -------------------------------------------------- */
$('#allergenChips').innerHTML = ALLERGENS.map(a => `<button class="chip" data-al="${a.id}" aria-pressed="false"><span class="chip__emoji">${a.e}</span>${a.t}</button>`).join('');
function refreshAllergenChips() { $$('#allergenChips .chip').forEach(c => c.setAttribute('aria-pressed', state.allergens.has(c.dataset.al))); }
$$('#allergenChips .chip').forEach(c => c.addEventListener('click', () => {
  const id = c.dataset.al, on = state.allergens.has(id); on ? state.allergens.delete(id) : state.allergens.add(id);
  c.setAttribute('aria-pressed', !on); saveState();
}));

/* ---------- Ziel-Gruppen ----------------------------------------------------- */
$('#goalGroups').innerHTML = GROUPS.map(gr => `<div class="group"><div class="group__head"><span class="group__title">${gr.name}</span><span class="group__tag">${gr.tag}</span></div>
  <div class="chips">${gr.goals.map(g => `<button class="chip" data-goal="${g.id}" aria-pressed="false"><span class="chip__emoji">${g.e}</span>${g.t}</button>`).join('')}</div></div>`).join('');
function refreshGoalChips() {
  $('#goalCount').textContent = `${state.goals.length} / 3`;
  $$('#goalGroups .chip').forEach(c => { const on = state.goals.includes(c.dataset.goal); c.setAttribute('aria-pressed', on); c.disabled = !on && state.goals.length >= 3; });
}
$$('#goalGroups .chip').forEach(c => c.addEventListener('click', () => {
  const id = c.dataset.goal, i = state.goals.indexOf(id);
  if (i >= 0) state.goals.splice(i, 1); else if (state.goals.length < 3) state.goals.push(id);
  refreshGoalChips(); saveState();
}));

/* ---------- Kamera / Barcode ------------------------------------------------- */
function handleScan(code) { $('#barcode').value = code; lookup(code, go); }

/* ---------- Events ------------------------------------------------------------ */
$('#startBtn').addEventListener('click', () => go('allergens'));
$('#skipToScan').addEventListener('click', () => { markOnboarded(); go('scan'); });
$('#toGoals').addEventListener('click', () => go('goals'));
$('#toScan').addEventListener('click', () => { markOnboarded(); go('scan'); });
$('#editGoals').addEventListener('click', () => go('goals'));
$('#editAllergens').addEventListener('click', () => go('allergens'));
$('#camStart').addEventListener('click', () => startCamera(handleScan));
$('#lookupBtn').addEventListener('click', () => { const c = $('#barcode').value.trim(); if (c) lookup(c, go); });
$('#barcode').addEventListener('keydown', e => { if (e.key === 'Enter') { const c = $('#barcode').value.trim(); if (c) lookup(c, go); } });
$('#againBtn').addEventListener('click', () => go('scan'));
$('#changeGoalBtn').addEventListener('click', () => go('goals'));
$('#clearHist').addEventListener('click', () => { if (confirm('Ganzen Verlauf löschen?')) { clearHistory(); renderHistory(code => { go('scan'); lookup(code, go); }); } });
$$('.demo').forEach(b => b.addEventListener('click', () => { const p = DEMO[b.dataset.demo]; const ev = evaluate(p); showResult(p, ev, state, go); addHistory(p, ev, 'demo-' + b.dataset.demo); }));
$$('#nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.nav)));

/* ---------- Start: gespeicherte Ziele/Allergene laden, Onboarding ------------- */
loadState(); refreshAllergenChips(); refreshGoalChips();
if (hasOnboarded()) go('scan');
