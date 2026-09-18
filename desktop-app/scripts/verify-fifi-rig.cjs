// Offline lifecycle checks for the real rig controller. Not a browser visual test.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../public/mascot/fifi');
const timers = new Map();
let tick = 0;
const listeners = new Map();
const media = { matches:false, addEventListener(){}, removeEventListener(){} };
const styles = () => ({ values:{}, setProperty(k,v){ this.values[k] = v; } });
const node = () => ({ style:styles(), dataset:{}, animations:[], getAnimations(){return this.animations;}, animate(frames,opts){const a={frames,opts,cancel(){a.cancelled=true;}}; this.animations.push(a); return a;} });
const rigNode=node(), sockets=[node(),node()], eyes=[node(),node()], fins=Array.from({length:4},node), tails=[node(),node()], link=node(), body=node();
const dom = {
  querySelector: selector => ({'.rig':rigNode,link,'.body':body})[selector],
  querySelectorAll: selector => ({'.socket':sockets,'.eye':eyes,'.fin img':fins,'.tail img':tails})[selector] || [],
};
class Element {
  constructor(){this.attrs=new Map();this.isConnected=true;}
  attachShadow(){this.shadowRoot=dom;}
  getAttribute(k){return this.attrs.has(k)?this.attrs.get(k):null;}
  hasAttribute(k){return this.attrs.has(k);}
  setAttribute(k,v){const old=this.getAttribute(k);this.attrs.set(k,String(v));if(this.constructor.observedAttributes.includes(k))this.attributeChangedCallback(k,old,String(v));}
  removeAttribute(k){const old=this.getAttribute(k);this.attrs.delete(k);if(this.constructor.observedAttributes.includes(k))this.attributeChangedCallback(k,old,null);}
}
const doc={hidden:false,currentScript:{src:'file:///C:/test/mascot/fifi/fifi-rig.js'},baseURI:'file:///C:/test/index.html',addEventListener(k,v){listeners.set(k,v);},removeEventListener(k){listeners.delete(k);}};
let Rig;
const context={HTMLElement:Element,document:doc,URL,Math,Number,Set,customElements:{get(){return null;},define(name,type){Rig=type;}},matchMedia:()=>media,IntersectionObserver:class{constructor(fn){this.fn=fn;}observe(){}disconnect(){this.disconnected=true;}},setTimeout(fn,ms){const id=++tick;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);}};
vm.runInNewContext(fs.readFileSync(path.join(root,'fifi-rig.js'),'utf8'),context);
const fifi=new Rig();fifi.connectedCallback();
assert.equal(timers.size,1,'one randomized blink timer while active');
assert.ok([...timers.values()][0].ms >= 3200);
assert.equal(fins.length,4);assert.equal(tails.length,2);
assert.ok(body.src.endsWith('/rig/body-v1.png'));
fifi.blink();assert.equal(sockets[0].animations[0].opts.duration,180);
fifi.lookAt(100,-100);assert.equal(rigNode.style.values['--look-x'],'6%');
fifi.setAttribute('rest','');
assert.equal(rigNode.dataset.mood,'sleep');assert.equal(timers.size,0);
assert.ok(sockets[0].animations.every(a=>a.cancelled),'rest cancels an in-flight blink');
assert.equal(rigNode.style.values['--look-x'],'0%');
fifi.removeAttribute('rest');assert.equal(timers.size,1);
doc.hidden=true;listeners.get('visibilitychange')();assert.equal(timers.size,0);
doc.hidden=false;listeners.get('visibilitychange')();assert.equal(timers.size,1);
fifi._observer.fn([{isIntersecting:false}]);assert.equal(timers.size,0);
fifi._observer.fn([{isIntersecting:true}]);assert.equal(timers.size,1);
fifi.setAttribute('motion','reduced');assert.equal(timers.size,0);
fifi.setAttribute('motion','full');assert.equal(timers.size,1);
media.matches=true;fifi.sync();assert.equal(timers.size,0);
media.matches=false;fifi.sync();assert.equal(timers.size,1);
fifi.setAttribute('mood','sleep');assert.equal(timers.size,0);
fifi.setAttribute('mood','unknown');assert.equal(rigNode.dataset.mood,'idle');assert.equal(timers.size,1);
fifi.setAttribute('fx','NaN');assert.equal(rigNode.style.values['--fx'],.5);
fifi.setAttribute('energy','Infinity');assert.equal(rigNode.style.values['--speech'],0);
fifi.setAttribute('mood','thinking');assert.equal(rigNode.dataset.effect,'scan');
fifi.setAttribute('particles','burst');assert.equal(rigNode.dataset.effect,'burst');
fifi.setAttribute('fx','0');assert.equal(rigNode.dataset.effect,'none');
fifi.setAttribute('fx','.5');fifi.setAttribute('speaking','');fifi.setAttribute('gesture','double-nod');
assert.equal(rigNode.dataset.speaking,'true');assert.equal(rigNode.dataset.accent,'double-nod');
fifi.setAttribute('rest','');assert.equal(rigNode.dataset.speaking,'false');assert.equal(rigNode.dataset.effect,'none');assert.equal(rigNode.dataset.accent,'none');
fifi.removeAttribute('rest');fifi.setAttribute('motion','reduced');assert.equal(rigNode.dataset.effect,'none');assert.equal(rigNode.dataset.accent,'none');
fifi.setAttribute('motion','full');fifi.setAttribute('particles','bad-name');assert.equal(rigNode.dataset.effect,'scan');
fifi.setAttribute('paused','');assert.equal(timers.size,0);
fifi.removeAttribute('paused');assert.equal(timers.size,1);
fifi.disconnectedCallback();assert.equal(timers.size,0);assert.equal(listeners.size,0);assert.equal(fifi._observer.disconnected,true);
// Verify assets / links referenced by the preview and the shared controller exist.
for(const file of ['fifi-rig.js','fifi-rig.css','studio.html','studio.js','rig/body-v1.png','rig/fin-v1.png','rig/tendril-v1.png']) assert.ok(fs.statSync(path.join(root,file)).size>0,file);
require('postcss').parse(fs.readFileSync(path.join(root,'fifi-rig.css'),'utf8'));
const {createRequire}=require('node:module');
const babel=createRequire(require.resolve('@vitejs/plugin-react'))('@babel/core');
for(const file of ['FifiAvatar.jsx','ChangelogModal.jsx']) {
  babel.parseSync(fs.readFileSync(path.resolve(__dirname,'../src/components',file),'utf8'),{configFile:false,babelrc:false,parserOpts:{plugins:['jsx'],sourceType:'module'}});
}
console.log('FiFi checks passed: blink timing, gaze clamping, rest/pause, hidden/offscreen cleanup, reduced motion, invalid input, disconnect cleanup, asset paths, CSS parsing and JSX syntax. Browser visual verification still required.');
