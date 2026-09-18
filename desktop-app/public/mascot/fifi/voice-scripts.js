/* Declarative choreography only. This module never loads or plays audio. */
(() => {
  // id, exact filename, filename-derived line, trigger, opening, emphasis,
  // settling expression, particles, performance direction.
  const rows = [
    ['welcome','teto-2026-09-06-00-21-[sad]-Welcome-to-Neo-Lib.mp3','Welcome to Neo-Lib','First visible greeting after the intro, once per app session','listening','greeting','happy','hello','A gentle arrival, soft eyes, then one welcoming fin wave. No greeting during background resume.'],
    ['look-here','teto-2026-09-06-00-22-[sad]-Look-here!.mp3','Look here!','A useful contextual hint requested by the player','concern','listening','idle','beacon','Tilt softly, open the listening fin and send one small beacon from it.'],
    ['what-is-this','teto-2026-09-06-00-23-[emphasis]-What-is-this-[short-pause].mp3','What is this?','An unfamiliar item in an explicit help or inspection flow','curious','thinking','curious','scan','Widen one eye, tilt and orbit three tiny data diamonds. Curious rather than frightened.'],
    ['hmm','teto-2026-09-06-00-23-[soft]-[emphasis]-hmm.-[short-pause].mp3','Hmm…','A substantial player-requested search or reasoning step','listening','thinking','listening','scan','Lean to one side; narrow one eye. Slow data orbit, then return attention to the player.'],
    ['introduce','teto-2026-09-06-00-24-[emphasis]-I-am-Fifi-[short-pause].mp3','I am FiFi','FiFi introduction or explicit introduction replay','curious','greeting','happy','hello','Lift both upper fins slightly, wave with one, and brighten the cyan eyes on her name.'],
    ['news','teto-2026-09-06-00-25-[emphasis]-Got-news-for-you-[short-pause].mp3','Got news for you','Fresh verified news for an eligible visible game','listening','alert','listening','beacon','Look attentive, raise a fin and make one cyan signal ripple. No repeated alert for the same story.'],
    ['take-look','teto-2026-09-06-00-25-[emphasis]-Take-a-look-at-this-[short-pause].mp3','Take a look at this','Presenting a result the player asked for','curious','listening','happy','glint','Open a lower fin toward the result; three tiny white-cyan glints punctuate the reveal.'],
    ['play-game','teto-2026-09-06-00-25-[emphasis]-Wanna-play-a-game-ye-[short-pause].mp3','Wanna play a game?','Player opens a game recommendation or prepares a launch','curious','happy','listening','invite','An eager lean and open fins, with a small inviting arc. Host may fly toward Launch only within an explicit action.'],
    ['offer-help','teto-2026-09-06-00-26-[emphasis]-Can-i-help-you-with-something-[short.mp3','Can I help you with something?','Opening FiFi chat','greeting','listening','listening','invite','Small greeting wave; settle into attentive eyes above the chat. Leave input and buttons unobstructed.'],
    ['lets-do-it','teto-2026-09-06-00-26-[emphasis]-Lets-do-it!-[short-pause].mp3',"Let's do it!",'Player confirms a task or launch','listening','celebrate','happy','burst','A quick lift and fin flare, six bright data stars, then settle. Choreography never launches anything.'],
    ['ouff','teto-2026-09-06-00-27-[emphasis]-ouff[short-pause].mp3','Ouff','A recoverable task failure','alert','concern','listening','soft','A small recoil, folded fins, two soft fading motes, then a helpful attentive pose.'],
    ['aha','teto-2026-09-06-00-28-[emphasis]-aha[angry].mp3','Aha','An answer or match was found','thinking','curious','happy','glint','Open the narrowed eye and give a small realization tilt with three glints.'],
    ['more-trouble','teto-2026-09-06-00-28-[emphasis]-More-trouble[short-pause][angry]-[sad.mp3','More trouble','An actionable error that needs attention','curious','concern','listening','soft','A restrained skeptical tilt, then soften and face the player. Pair with a useful repair or feedback action.'],
    ['app-update','teto-2026-09-06-00-28-[emphasis]-Oh-my-GOD,-Neo-Lib-has-a-new-update!!.mp3','Oh my God, Neo-Lib has a new update!','A newly verified Neo-Lib version, once per version','curious','celebrate','happy','burst','Wide eyes become happy crescents; flare fins and make one magenta-cyan star burst.'],
    ['ill-help','teto-2026-09-06-00-29-[emphasis]-I\'ll-help-here[angry].mp3',"I'll help here",'Accepting a help request','concern','listening','listening','invite','Turn concern into an attentive forward lean; open one fin reassuringly.'],
    ['mhm','teto-2026-09-06-00-29-[emphasis]-mhm[angry].mp3','Mhm','A short conversational acknowledgement','listening','listening','idle','none','A tiny nod only. No particles for every little acknowledgement.'],
    ['okiedokie','teto-2026-09-06-00-29-[emphasis]-Okiedokie[angry].mp3','Okiedokie','Accepting an explicit player choice','curious','happy','idle','glint','A playful head tilt and one quick fin lift; a few small glints.'],
    ['sure-fine','teto-2026-09-06-00-30-[emphasis]-Sure,-fine[angry].mp3','Sure, fine','A casual chat agreement','curious','listening','idle','none','A cheeky sideways tilt softens into a cooperative nod.'],
    ['why-not','teto-2026-09-06-00-30-[emphasis]-why-not[angry].mp3','Why not','Accepting a playful suggestion','thinking','curious','happy','invite','A questioning eye and tilted fins open into a small inviting arc.'],
    ['yes-yes','teto-2026-09-06-00-30-[emphasis]-yes-yes[angry].mp3','Yes yes','An enthusiastic acknowledgement','listening','happy','listening','none','Two small conversational nods; keep this clean and quick.'],
    ['easy-task','teto-2026-09-06-00-31-[emphasis]-Easy-task[angry].mp3','Easy task','A simple requested task completed successfully','thinking','happy','idle','glint','Relax the thinking eye and show a confident happy expression with three glints.'],
    ['finished','teto-2026-09-06-00-31-[emphasis]-Okay,-its-finished![angry].mp3',"Okay, it's finished!",'Completion of an explicit import, scan or other task','listening','celebrate','happy','burst','One compact success bounce and brief stars; do not announce background maintenance.'],
    ['well-done','teto-2026-09-06-00-31-[emphasis]-Well-done![angry].mp3','Well done!','A meaningful player milestone','listening','celebrate','happy','burst','Happy crescent eyes and open fins; a short encouraging star burst.'],
    ['dont-mute','teto-2026-09-06-00-32-[emphasis]-Sorry,-but-dont-mute-me[angry].mp3',"Sorry, but don't mute me",'Explicit voice-line preview only','curious','concern','listening','soft','A playful pleading tilt with soft motes. Never play when the user mutes or disables FiFi.'],
    ['check-this','teto-2026-09-06-00-32-[emphasis]-You-should-check-this-out[angry].mp3','You should check this out','A relevant discovery after the player requests suggestions','thinking','alert','listening','beacon','Straighten from thought, raise a fin, and send a single attention ripple.'],
    ['donate','teto-2026-09-06-00-33-[emphasis]-Please,-hit-the-donate-button,-pretty.mp3','Please, hit the donate button…','Player opens the support panel or explicitly previews this line','listening','greeting','happy','gratitude','A small respectful bow, then an open fin and soft pink light. Never interrupt chat or game launch with donation requests.'],
    ['be-my-guest','teto-2026-09-06-00-34-[emphasis]-Be-my-guest[emphasis]-[excited].mp3','Be my guest','Inviting the player to try a suggested action','happy','greeting','listening','invite','Sweep a fin outward, follow with friendly eyes, and settle with a small invitation arc.'],
  ];
  const freeze = value => {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  };
  const lines = freeze(rows.map(([id,file,text,trigger,opening,emphasis,settle,particles,direction]) => ({
    id,file,text,trigger,direction,transcriptStatus:'filename-derived, not audio-verified',
    // Normalized positions; the eventual host uses actual audio time/duration.
    // The studio uses a clearly labelled illustrative duration, never guessed speech timestamps.
    phases:[
      { at:0, name:'Arrive', mood:opening, particles:'none', speaking:true },
      { at:.22, name:'Emphasize', mood:emphasis, particles, speaking:true,
        gesture: ({mhm:'nod','yes-yes':'double-nod',donate:'bow','take-look':'present','be-my-guest':'present','sure-fine':'nod'})[id] || 'none' },
      { at:.65, name:'Settle', mood:settle, particles:'none', speaking:true },
      { at:1, name:'Rest', mood:'idle', particles:'none', speaking:false },
    ],
  })));
  const byId = new Map(lines.map(line => [line.id,line]));
  function sample(id, progress) {
    const line = byId.get(id);
    if (!line) return null;
    const p = Number.isFinite(progress) ? Math.max(0,Math.min(1,progress)) : 0;
    return [...line.phases].reverse().find(phase => phase.at <= p);
  }
  function createPreview({apply,onDone=()=>{},canRun=()=>true,setTimer=setTimeout,clearTimer=clearTimeout}) {
    let generation=0;
    const timers=new Set();
    const neutral={at:1,name:'Rest',mood:'idle',particles:'none',speaking:false,gesture:'none'};
    function cancel(notify=true) {
      generation++;
      timers.forEach(clearTimer);timers.clear();
      if (notify) {apply(neutral);onDone('stopped');}
    }
    function start(id,durationMs=4000) {
      cancel();
      const line=byId.get(id);
      if (!line || !canRun()) return false;
      const duration=Number.isFinite(durationMs)?Math.max(1000,Math.min(15000,durationMs)):4000;
      const token=generation;
      apply(line.phases[0]);
      for (const phase of line.phases.slice(1)) {
        const handle=setTimer(()=>{
          timers.delete(handle);
          if (token!==generation) return;
          if (!canRun()) {cancel();return;}
          apply(phase);
          if (phase.at===1) {onDone('finished');}
        },phase.at*duration);
        timers.add(handle);
      }
      return true;
    }
    return Object.freeze({start,cancel});
  }
  const api = Object.freeze({lines,sample,createPreview,playbackEnabled:true,timing:'normalized draft; live event alignment uses audio start/end plus reaction phases',
    policy:freeze({oneVoiceAtATime:true,minimumGapMs:20000,afterIntroOnly:true,foregroundOnly:true,respectRest:true,respectMute:true,automaticIdleChatter:false})});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.FifiVoiceScripts = api;
})();
