(() => {
  const el = id => document.getElementById(id);
  const fifi = el('fifi'), stage = el('stage'), dock = el('dock');
  const modes = ['idle','greeting','listening','thinking','talking','happy','celebrate','alert','concern','sleep','fly','curious'];
  let mood = 'idle', drag = null, flight = null, returnTimer = null;
  let voicePlayer = null, stageVisible = true;
  let anchor = { x:.5, y:.52 };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  try {
    const saved = JSON.parse(localStorage.getItem('neolib.fifi.studio.anchor'));
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) anchor = saved;
  } catch { /* File URLs and private browser storage may be unavailable. */ }
  function place(save = false) {
    const rect = stage.getBoundingClientRect();
    const marginX = Math.min(.5, (dock.offsetWidth / 2 + 10) / rect.width);
    const marginY = Math.min(.5, (dock.offsetHeight / 2 + 14) / rect.height);
    anchor.x = Math.max(marginX, Math.min(1 - marginX, anchor.x));
    anchor.y = Math.max(marginY, Math.min(1 - marginY, anchor.y));
    dock.style.left = `${anchor.x * 100}%`; dock.style.top = `${anchor.y * 100}%`;
    if (save) try { localStorage.setItem('neolib.fifi.studio.anchor', JSON.stringify(anchor)); } catch { /* Optional preview persistence. */ }
  }
  function cancelFlight() { flight?.cancel(); flight = null; }
  function setMood(value, autoReturn = true) {
    voicePlayer?.cancel();
    ['particles','speaking','gesture'].forEach(name => fifi.removeAttribute(name));
    clearTimeout(returnTimer); cancelFlight(); mood = value;
    fifi.setAttribute('mood', value);
    // Visual-only intensity demo; no audio is loaded or accessed.
    fifi.setAttribute('energy', value === 'talking' ? '.55' : '0');
    el('state-label').textContent = el('rest').checked ? 'RESTING' : value.toUpperCase();
    [...el('moods').children].forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mood === value)));
    if (autoReturn && ['greeting','celebrate','alert'].includes(value)) returnTimer = setTimeout(() => setMood('idle'), 3200);
  }
  modes.forEach(value => {
    const button = document.createElement('button'); button.textContent = value[0].toUpperCase() + value.slice(1);
    button.dataset.mood = value; button.setAttribute('aria-pressed', String(value === mood));
    button.addEventListener('click', () => setMood(value)); el('moods').append(button);
  });
  const still = () => el('rest').checked || el('paused').checked || el('motion').value === 'reduced' || reduce.matches || mood === 'sleep';
  function syncControls() {
    voicePlayer?.cancel();
    ['particles','speaking','gesture'].forEach(name => fifi.removeAttribute(name));
    cancelFlight();
    fifi.setAttribute('motion', el('motion').value);
    fifi.toggleAttribute('rest', el('rest').checked); fifi.toggleAttribute('paused', el('paused').checked);
    el('blink').disabled = still(); el('flight').disabled = still();
    el('state-label').textContent = el('rest').checked ? 'RESTING' : mood.toUpperCase();
    fifi.setAttribute('mood',mood);
    el('voice-preview').disabled = el('rest').checked || el('paused').checked;
  }
  ['motion','rest','paused'].forEach(id => el(id).addEventListener('change', syncControls));
  el('moods').addEventListener('click', syncControls);
  reduce.addEventListener('change', syncControls);
  el('fx').addEventListener('input', () => { fifi.setAttribute('fx', el('fx').value / 100); el('fx-value').textContent = `${el('fx').value}%`; });
  el('size').addEventListener('input', () => { dock.style.width = `${el('size').value}px`; el('size-value').textContent = `${el('size').value} px`; place(); });
  el('background').addEventListener('change', () => { stage.className = `stage ${el('background').value}`; });
  el('blink').addEventListener('click', () => fifi.blink());
  el('reset').addEventListener('click', () => { cancelFlight(); anchor = { x:.5, y:.52 }; place(true); });
  el('flight').addEventListener('click', () => {
    if (still()) return;
    setMood('fly', false);
    const r = stage.getBoundingClientRect(), w = dock.offsetWidth, h = dock.offsetHeight;
    const targetX = Math.max(0, r.width - (anchor.x * r.width + w / 2) - 12);
    const targetY = Math.min(0, h / 2 + 12 - anchor.y * r.height);
    flight = dock.animate([
      { transform:'translate(-50%, -50%)' },
      { transform:`translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px))`, offset:.4 },
      { transform:`translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px))`, offset:.6 },
      { transform:'translate(-50%, -50%)' },
    ], { duration:2400, easing:'ease-in-out' });
    flight.onfinish = () => { flight = null; setMood('idle'); };
  });
  stage.addEventListener('pointermove', event => {
    if (drag) {
      const r = stage.getBoundingClientRect();
      anchor = { x:(event.clientX-r.left-drag.x)/r.width, y:(event.clientY-r.top-drag.y)/r.height }; place();
    } else {
      const r = dock.getBoundingClientRect();
      fifi.lookAt((event.clientX-r.left-r.width/2)/r.width, (event.clientY-r.top-r.height/2)/r.height);
    }
  });
  stage.addEventListener('pointerleave', () => fifi.lookAt(0,0));
  dock.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    cancelFlight(); const r = dock.getBoundingClientRect();
    drag = { x:event.clientX-r.left-r.width/2, y:event.clientY-r.top-r.height/2 };
    dock.setPointerCapture(event.pointerId);
  });
  const release = () => { if (drag) { drag=null; place(true); } };
  dock.addEventListener('pointerup', release); dock.addEventListener('pointercancel', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(returnTimer); cancelFlight(); setMood('idle', false); } });
  const scripts=globalThis.FifiVoiceScripts;
  scripts.lines.forEach(line => {
    const option=document.createElement('option');option.value=line.id;option.textContent=line.text;el('voice-line').append(option);
  });
  function showLine() {
    voicePlayer?.cancel();
    const line=scripts.lines.find(line=>line.id===el('voice-line').value);
    el('voice-trigger').textContent=`When: ${line.trigger}`;
    el('voice-direction').textContent=line.direction;
  }
  voicePlayer=scripts.createPreview({
    canRun:()=>!document.hidden && stageVisible && !el('rest').checked && !el('paused').checked,
    apply:phase=>{
      fifi.setAttribute('mood',phase.mood);fifi.setAttribute('particles',phase.particles);
      fifi.setAttribute('gesture',phase.gesture || 'none');fifi.toggleAttribute('speaking',phase.speaking);
      fifi.setAttribute('energy',phase.speaking ? '.35' : '0');
      el('state-label').textContent=el('rest').checked?'RESTING':phase.mood.toUpperCase();
      el('voice-phase').textContent=`${phase.name} · ${phase.mood} · ${phase.particles==='none'?'no particles':phase.particles}`;
    },
    onDone:status=>{el('voice-phase').textContent=status==='finished'?'Rehearsal finished.':'Rehearsal stopped.';},
  });
  el('voice-preview').addEventListener('click',()=>{
    clearTimeout(returnTimer);cancelFlight();mood='idle';
    // Keep the performance visible when its controls sit below the fold.
    stage.scrollIntoView({block:'center',behavior:'instant'});
    stageVisible=stage.getBoundingClientRect().bottom>0 && stage.getBoundingClientRect().top<innerHeight;
    voicePlayer.start(el('voice-line').value,Number(el('voice-duration').value));
  });
  el('voice-stop').addEventListener('click',()=>voicePlayer.cancel());
  el('voice-line').addEventListener('change',showLine);
  el('voice-duration').addEventListener('input',()=>{el('duration-value').textContent=`${Number(el('voice-duration').value)/1000} seconds`;});
  new IntersectionObserver(([entry])=>{stageVisible=entry.isIntersecting;if(!stageVisible)voicePlayer.cancel();}).observe(stage);
  window.addEventListener('pagehide',()=>voicePlayer.cancel());
  showLine();
  new ResizeObserver(() => place()).observe(stage);
  syncControls(); place();
})();
