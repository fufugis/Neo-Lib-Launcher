const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const scripts=require('../public/mascot/fifi/voice-scripts.js');
const folder=path.resolve(__dirname,'../public/mascot/voice-packs/fifi-future');
const actual=fs.readdirSync(folder).filter(file=>file.endsWith('.mp3')).sort();
assert.equal(scripts.playbackEnabled,true);
assert.equal(scripts.lines.length,27);
assert.equal(new Set(scripts.lines.map(line=>line.id)).size,27);
assert.deepEqual(scripts.lines.map(line=>line.file).sort(),actual,'each real MP3 has exactly one script');
const moods=new Set(['idle','greeting','listening','thinking','talking','happy','celebrate','alert','concern','sleep','fly','curious']);
const effects=new Set(['none','hello','scan','beacon','glint','invite','burst','soft','gratitude','trail']);
for(const line of scripts.lines) {
  assert.ok(Object.isFrozen(line));assert.ok(line.trigger);assert.ok(line.direction);
  assert.equal(line.phases[0].at,0);assert.equal(line.phases.at(-1).at,1);
  let previous=-1;
  for(const phase of line.phases){assert.ok(phase.at>previous);previous=phase.at;assert.ok(moods.has(phase.mood));assert.ok(effects.has(phase.particles));}
  assert.equal(scripts.sample(line.id,-1).name,'Arrive');
  assert.equal(scripts.sample(line.id,NaN).name,'Arrive');
  assert.equal(scripts.sample(line.id,1.1).speaking,false);
}
assert.equal(scripts.sample('unknown',.5),null);
let id=0,allowed=true,applied=[],finished=[];
const pending=new Map();
const player=scripts.createPreview({apply:phase=>applied.push(phase),onDone:status=>finished.push(status),canRun:()=>allowed,
  setTimer:(fn,ms)=>{const handle=++id;pending.set(handle,{fn:()=>{pending.delete(handle);fn();},ms});return handle;},clearTimer:id=>pending.delete(id)});
assert.equal(player.start('welcome',5000),true);
assert.equal(applied.at(-1).name,'Arrive');assert.equal(pending.size,3);
const stale=[...pending.values()].map(item=>item.fn);
player.start('mhm',2000);
assert.equal(pending.size,3,'replacement cancels previous timers');
const count=applied.length;stale.forEach(fn=>fn());assert.equal(applied.length,count,'stale phases never overwrite a replacement');
const next=[...pending.entries()].sort((a,b)=>a[1].ms-b[1].ms)[0];
next[1].fn();assert.equal(applied.at(-1).gesture,'nod');
allowed=false;
[...pending.values()][0].fn();assert.equal(pending.size,0);assert.equal(applied.at(-1).speaking,false);
assert.equal(player.start('welcome'),false);assert.equal(pending.size,0);
allowed=true;player.start('finished',3000);
[...pending.values()].sort((a,b)=>a.ms-b.ms).forEach(item=>item.fn());
assert.equal(pending.size,0);assert.equal(applied.at(-1).mood,'idle');assert.equal(finished.at(-1),'finished');
player.start('news');player.cancel();assert.equal(pending.size,0);assert.equal(applied.at(-1).particles,'none');
assert.equal(player.start('no-such-line'),false);
console.log('FiFi: all 27 MP3 filenames mapped; scripts and phase ordering valid; replacement, cancellation, blocked-state and completion checks passed. No audio played.');
