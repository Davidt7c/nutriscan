// ==========================================================================
// NUTRISCAN — Intro (Astronaut, Cel-Shading-Stil)
// Reines SVG + CSS + JS, kein Framework. Läuft beim allerersten Öffnen
// automatisch ab (Merker in localStorage) und kann über den
// "Intro nochmal ansehen"-Button im Hero erneut gestartet werden.
// Bewusst als klassisches (nicht-modulares) Script, damit es so früh wie
// möglich läuft und unabhängig von js/main.js bleibt.
// ==========================================================================
(function () {
  const KEY = 'ns_intro_seen';
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SCENE_SVG = `
    <svg class="ns-intro__scene" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" role="presentation" aria-hidden="true">
      <defs>
        <radialGradient id="nsBgGrad" cx="50%" cy="-10%" r="110%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="55%" stop-color="#F4F7F2"/>
        </radialGradient>
        <clipPath id="nsVisorClip"><ellipse cx="200" cy="158" rx="60" ry="52"/></clipPath>
        <filter id="nsRippleFilter" x="-60%" y="-60%" width="220%" height="220%">
          <feTurbulence id="nsTurbNode" type="fractalNoise" numOctaves="1" seed="7" baseFrequency="0.004" result="nsNoise">
            <animate id="nsTurb" attributeName="baseFrequency" begin="indefinite" dur="0.9s" values="0.004;0.05;0.004" fill="freeze"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="nsNoise" scale="0" xChannelSelector="R" yChannelSelector="G">
            <animate id="nsDisp" attributeName="scale" begin="indefinite" dur="0.9s" values="0;40;0" fill="freeze"/>
          </feDisplacementMap>
        </filter>
      </defs>

      <g id="nsSceneGroup" filter="url(#nsRippleFilter)">
        <rect x="0" y="0" width="400" height="400" fill="url(#nsBgGrad)"/>

        <g class="ns-astro" id="nsAstro">
          <ellipse cx="200" cy="300" rx="95" ry="18" fill="rgba(32,48,42,.08)"/>

          <rect x="128" y="215" width="144" height="150" rx="34" fill="#E4EBE2"/>

          <g class="ns-astro__arm-l" style="transform-origin:108px 238px">
            <rect x="80" y="232" width="42" height="118" rx="21" fill="#FFFFFF"/>
            <rect x="80" y="316" width="42" height="26" rx="13" fill="#22B573"/>
            <circle cx="101" cy="352" r="24" fill="#22B573"/>
          </g>

          <rect x="112" y="222" width="176" height="180" rx="72" fill="#FFFFFF"/>
          <rect x="112" y="255" width="176" height="147" rx="66" fill="#E9EFE7" opacity=".65"/>

          <rect x="118" y="268" width="150" height="22" rx="11" fill="#22B573" transform="rotate(-9 200 280)"/>

          <g transform="translate(168,296)">
            <rect x="-24" y="-18" width="48" height="36" rx="12" fill="#FFFFFF" stroke="#22B573" stroke-width="3"/>
            <rect x="-13" y="-8" width="4" height="16" rx="2" fill="#22B573"/>
            <rect x="-5" y="-8" width="4" height="16" rx="2" fill="#22B573"/>
            <rect x="3" y="-8" width="4" height="16" rx="2" fill="#22B573"/>
            <rect x="11" y="-8" width="4" height="16" rx="2" fill="#22B573"/>
          </g>

          <rect x="150" y="206" width="100" height="22" rx="11" fill="#22B573"/>

          <g class="ns-astro__arm-r" id="nsArmR" style="transform-origin:292px 238px">
            <rect x="278" y="232" width="42" height="118" rx="21" fill="#FFFFFF"/>
            <rect x="278" y="316" width="42" height="26" rx="13" fill="#22B573"/>
            <circle cx="299" cy="352" r="24" fill="#22B573"/>
          </g>

          <circle cx="200" cy="152" r="90" fill="#FFFFFF"/>
          <path d="M200 62 A90 90 0 0 1 276 196 A96 96 0 0 0 200 62Z" fill="#E4EBE2" opacity=".55"/>
          <ellipse cx="200" cy="158" rx="60" ry="52" fill="#16233B"/>
          <g clip-path="url(#nsVisorClip)">
            <circle class="ns-star" cx="168" cy="132" r="2" fill="#fff" style="animation-delay:.1s"/>
            <circle class="ns-star" cx="222" cy="140" r="1.6" fill="#fff" style="animation-delay:.6s"/>
            <circle class="ns-star" cx="196" cy="118" r="1.4" fill="#fff" style="animation-delay:1.1s"/>
            <circle class="ns-star" cx="182" cy="176" r="1.8" fill="#fff" style="animation-delay:.3s"/>
            <circle class="ns-star" cx="230" cy="172" r="1.3" fill="#fff" style="animation-delay:1.4s"/>
            <circle class="ns-star" cx="210" cy="190" r="1.6" fill="#fff" style="animation-delay:.85s"/>
            <circle class="ns-star" cx="160" cy="160" r="1.3" fill="#fff" style="animation-delay:1.7s"/>
            <g class="ns-star" style="animation-delay:.45s" transform="translate(214,124)">
              <rect x="-1.3" y="-7" width="2.6" height="14" rx="1.3" fill="#fff"/>
              <rect x="-7" y="-1.3" width="14" height="2.6" rx="1.3" fill="#fff"/>
            </g>
            <g class="ns-star" style="animation-delay:1.2s" transform="translate(176,196)">
              <rect x="-1" y="-5" width="2" height="10" rx="1" fill="#fff"/>
              <rect x="-5" y="-1" width="10" height="2" rx="1" fill="#fff"/>
            </g>
          </g>
          <ellipse cx="168" cy="112" rx="20" ry="12" fill="#FFFFFF" opacity=".55" transform="rotate(-24 168 112)"/>
        </g>

        <g id="nsRipples"></g>
      </g>
    </svg>
    <button type="button" class="ns-intro__skip" id="nsIntroSkip" aria-label="Intro überspringen">Überspringen</button>
  `;

  let overlayEl = null;
  let playing = false;
  let timers = [];

  function after(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    overlayEl = document.createElement('div');
    overlayEl.className = 'ns-intro ns-intro--hidden';
    overlayEl.innerHTML = SCENE_SVG;
    document.body.appendChild(overlayEl);
    overlayEl.querySelector('#nsIntroSkip').addEventListener('click', () => finish(true));
    return overlayEl;
  }

  function spawnRipple(el) {
    const g = el.querySelector('#nsRipples');
    for (let i = 0; i < 3; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', 246); c.setAttribute('cy', 300); c.setAttribute('r', 4);
      c.classList.add('ns-ring');
      c.style.animationDelay = (i * 140) + 'ms';
      g.appendChild(c);
    }
  }

  function resetScene(el) {
    const astro = el.querySelector('.ns-astro'), arm = el.querySelector('#nsArmR'), scene = el.querySelector('#nsSceneGroup');
    astro.classList.remove('ns-drift'); arm.classList.remove('ns-tap'); scene.classList.remove('ns-fade-content');
    el.querySelector('#nsRipples').innerHTML = '';
  }

  function finish(skip) {
    clearTimers();
    if (!overlayEl) { playing = false; return; }
    overlayEl.classList.add('ns-intro--hidden');
    after(() => { resetScene(overlayEl); playing = false; }, skip ? 0 : 560);
  }

  function play(force) {
    if (playing) return;
    if (!force && localStorage.getItem(KEY)) return;
    const el = ensureOverlay();
    playing = true;
    clearTimers();
    resetScene(el);
    try { localStorage.setItem(KEY, '1'); } catch (e) { }

    void el.offsetWidth; // Reflow, damit CSS-Animationen bei Wiederholung neu starten
    el.classList.remove('ns-intro--hidden');

    if (REDUCED) { after(() => finish(false), 700); return; }

    requestAnimationFrame(() => el.querySelector('.ns-astro').classList.add('ns-drift'));

    after(() => {
      el.querySelector('#nsArmR').classList.add('ns-tap');
      after(() => {
        spawnRipple(el);
        const turb = el.querySelector('#nsTurb'), disp = el.querySelector('#nsDisp');
        try { turb.beginElement(); disp.beginElement(); } catch (e) { }
      }, 260);
    }, 3000);

    after(() => el.querySelector('#nsSceneGroup').classList.add('ns-fade-content'), 4200);
    after(() => finish(false), 4700);
  }

  function init() {
    if (!localStorage.getItem(KEY)) play(false);
    const btn = document.getElementById('replayIntro');
    if (btn) btn.addEventListener('click', () => play(true));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.NSIntro = { play: play };
})();
