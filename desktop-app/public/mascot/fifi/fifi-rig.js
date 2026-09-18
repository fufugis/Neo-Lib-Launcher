/* Shared by the standalone animation studio and the React adapter. No audio. */
(() => {
  const defaultRoot = document.currentScript?.src
    ? new URL('./', document.currentScript.src).href : './mascot/fifi/';
  const moods = new Set(['idle', 'greeting', 'listening', 'thinking', 'talking', 'happy', 'celebrate', 'alert', 'concern', 'sleep', 'fly', 'curious']);
  const effects = new Set(['none','hello','scan','beacon','glint','invite','burst','soft','gratitude','trail']);
  const moodEffects = {greeting:'hello',thinking:'scan',curious:'scan',alert:'beacon',happy:'glint',celebrate:'burst',concern:'soft',listening:'none',fly:'trail'};
  if (customElements.get('neo-fifi')) return;

  class FifiRig extends HTMLElement {
    static get observedAttributes() { return ['mood', 'motion', 'rest', 'paused', 'fx', 'energy', 'asset-root', 'particles', 'speaking', 'gesture']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._timers = new Set();
      this._visible = true;
      this._media = matchMedia('(prefers-reduced-motion: reduce)');
      this._sync = () => this.sync();
    }
    connectedCallback() {
      this.render();
      document.addEventListener('visibilitychange', this._sync);
      this._media.addEventListener('change', this._sync);
      this._observer = new IntersectionObserver(([entry]) => {
        this._visible = entry.isIntersecting;
        this.sync();
      });
      this._observer.observe(this);
      this.sync();
    }
    disconnectedCallback() {
      this.stop();
      this._observer?.disconnect();
      document.removeEventListener('visibilitychange', this._sync);
      this._media.removeEventListener('change', this._sync);
    }
    attributeChangedCallback(name) {
      if (!this.isConnected) return;
      if (name === 'asset-root') this.render();
      this.sync();
    }
    render() {
      this.stop();
      const root = new URL(this.getAttribute('asset-root') || defaultRoot, document.baseURI);
      // Only internal, fixed markup. Asset URLs are assigned through DOM properties.
      this.shadowRoot.innerHTML = `
        <link rel="stylesheet">
        <div class="rig" aria-hidden="true">
          <div class="hover"><div class="accent"><div class="gesture"><div class="breath">
            <div class="fin fin-tl"><img alt="" draggable="false"></div>
            <div class="fin fin-tr"><img alt="" draggable="false"></div>
            <div class="tail tail-l"><img alt="" draggable="false"></div>
            <div class="tail tail-r"><img alt="" draggable="false"></div>
            <img class="body" alt="" draggable="false">
            <div class="energy"><div></div></div>
            <svg class="decals" viewBox="0 0 100 100"><g fill="none" stroke-width=".6"><path stroke="#f6a1fb" d="M50 25l3 5h-6z M36 33l3-2 3 2v4l-3 2-3-2z M58 65l4-3 4 3v4l-4 3-4-3z"/><path stroke="#69f6fb" d="M40 63l3 5h-6z M65 55l3 5h-6z"/></g></svg>
            <div class="face"><div class="eye eye-l"></div><div class="eye eye-r"></div></div>
            <div class="fin fin-bl"><img alt="" draggable="false"></div>
            <div class="fin fin-br"><img alt="" draggable="false"></div>
            <div class="particles">${Array.from({ length: 6 }, (_, i) => `<i style="--i:${i};--a:${i * 60}deg"><b></b></i>`).join('')}</div>
          </div></div></div></div>
        </div>`;
      this.shadowRoot.querySelector('link').href = new URL('fifi-rig.css', root).href;
      this.shadowRoot.querySelector('.body').src = new URL('rig/body-v1.png', root).href;
      this.shadowRoot.querySelectorAll('.fin img').forEach(img => { img.src = new URL('rig/fin-v1.png', root).href; });
      this.shadowRoot.querySelectorAll('.tail img').forEach(img => { img.src = new URL('rig/tendril-v1.png', root).href; });
      this.shadowRoot.querySelectorAll('.eye').forEach((eye, index) => {
        // The ring is a pixel matrix, so expressions and blinks deform the eye alone.
        const pixels = [];
        for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) {
          const r = Math.hypot(x, y);
          if (r > 5.6 && r < 9.3) pixels.push(`<rect x="${50 + x * 4}" y="${50 + y * 4}" width="3.2" height="3.2" rx=".5"/>`);
        }
        eye.innerHTML = `<div class="socket"><div class="gaze"><svg class="iris" viewBox="0 0 104 104">${pixels.join('')}</svg></div></div>`;
        eye.style.setProperty('--eye-index', index);
      });
    }
    later(callback, ms) {
      const id = setTimeout(() => { this._timers.delete(id); callback(); }, ms);
      this._timers.add(id);
    }
    stop() {
      this._timers.forEach(clearTimeout);
      this._timers.clear();
      this.shadowRoot?.querySelectorAll('.socket').forEach(el => el.getAnimations().forEach(a => a.cancel()));
      this._running = false;
    }
    sync() {
      const rig = this.shadowRoot.querySelector('.rig');
      if (!rig) return;
      const requested = this.getAttribute('mood');
      const mood = this.hasAttribute('rest') ? 'sleep' : moods.has(requested) ? requested : 'idle';
      const reduced = this._media.matches || this.getAttribute('motion') === 'reduced';
      const paused = document.hidden || !this._visible || this.hasAttribute('paused') || this.hasAttribute('rest') || mood === 'sleep';
      const amount = this.getAttribute('motion') === 'full' ? 1 : .6;
      const fx = this.hasAttribute('fx') ? Number(this.getAttribute('fx')) : .5;
      const energy = Number(this.getAttribute('energy') || 0);
      rig.dataset.mood = mood;
      rig.dataset.still = String(reduced || paused);
      const requestedEffect = this.getAttribute('particles');
      const selectedEffect = effects.has(requestedEffect) ? requestedEffect : (moodEffects[mood] || 'none');
      rig.dataset.effect = paused || reduced || fx <= 0 ? 'none' : selectedEffect;
      rig.dataset.speaking = String(!paused && (this.hasAttribute('speaking') || mood === 'talking'));
      const gesture = this.getAttribute('gesture');
      rig.dataset.accent = !paused && !reduced && ['nod','double-nod','bow','present'].includes(gesture) ? gesture : 'none';
      rig.style.setProperty('--amount', amount);
      rig.style.setProperty('--fx', Number.isFinite(fx) ? Math.max(0, Math.min(1, fx)) : .5);
      rig.style.setProperty('--speech', Number.isFinite(energy) ? Math.max(0, Math.min(1, energy)) : 0);
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', `FiFi, ${mood}`);
      if (paused || reduced) {
        this.stop();
        this.lookAt(0, 0);
      } else if (!this._running) {
        this._running = true;
        this.scheduleBlink();
      }
    }
    scheduleBlink() {
      if (!this._running) return;
      this.later(() => {
        this.blink();
        this.scheduleBlink();
      }, 3200 + Math.random() * 4200);
    }
    blink() {
      if (!this._running) return;
      this.shadowRoot.querySelectorAll('.socket').forEach(el => {
        el.getAnimations().forEach(a => a.cancel());
        el.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.07)', offset: .45 }, { transform: 'scaleY(1)' }], { duration: 180, easing: 'ease-in-out' });
      });
    }
    lookAt(x, y) {
      const active = this._running;
      const finite = value => Number.isFinite(Number(value)) ? Math.max(-1, Math.min(1, Number(value))) : 0;
      const rig = this.shadowRoot.querySelector('.rig');
      rig?.style.setProperty('--look-x', `${active ? finite(x) * 6 : 0}%`);
      rig?.style.setProperty('--look-y', `${active ? finite(y) * 5 : 0}%`);
    }
  }
  customElements.define('neo-fifi', FifiRig);
})();
