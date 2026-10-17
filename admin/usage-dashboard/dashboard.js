let summary = null;
const $ = id => document.getElementById(id);
const count = value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
const number = value => count(value).toLocaleString();
function draw() {
  if (!summary) return;
  $('opens').textContent = number(summary.totals.firstOpens); $('setups').textContent = number(summary.totals.setups);
  $('setup-rate').textContent = summary.totals.firstOpens ? `${Math.round(count(summary.totals.setups) / count(summary.totals.firstOpens) * 100)}% of observed installations` : 'No observed reports yet';
  $('active').textContent = number(summary.active.today); $('active-span').textContent = `${number(summary.active.week)} active in 7 days · ${number(summary.active.month)} in 30 days`;
  $('return').textContent = summary.returning.eligible ? `${Math.round(count(summary.returning.returned) / count(summary.returning.eligible) * 100)}%` : '—';
  $('return-base').textContent = `${number(summary.returning.returned)} returned / ${number(summary.returning.eligible)} eligible`;
  const versions = $('versions'); versions.replaceChildren();
  for (const item of summary.versions) { const row = document.createElement('div'); row.className = 'version'; const label = document.createElement('span'); label.textContent = `v${String(item.version).slice(0,32)}`; const value = document.createElement('b'); value.textContent = number(item.opens); row.append(label,value); versions.append(row); }
  if (!summary.versions.length) versions.textContent = 'No opted-in reports yet';
  const svg = $('chart'); svg.replaceChildren(); const ns = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs, text) => { const element = document.createElementNS(ns, tag); for (const [key, value] of Object.entries(attrs)) element.setAttribute(key,value); if (text != null) element.textContent = text; svg.append(element); return element; };
  const length = Number($('range').value); const today = new Date(summary.asOf); const rows = [];
  for (let index = length - 1; index >= 0; index--) { const day = new Date(today.getTime() - index * 86400000).toISOString().slice(0,10); rows.push({day,opens:count(summary.starts.find(row=>row.day===day)?.opens),active:count(summary.days.find(row=>row.day===day)?.active)}); }
  const max = Math.max(1,...rows.flatMap(row=>[row.opens,row.active]));
  for(let index=0;index<5;index++){const y=210-index*45;make('line',{x1:45,y1:y,x2:775,y2:y,stroke:'#2a394d'});make('text',{x:5,y:y+4,fill:'#93a2ba','font-size':11},Math.round(max*index/4));}
  for(const [field,color] of [['opens','#70dfeb'],['active','#bb99ff']]){
    const points=rows.map((row,index)=>`${45+index*730/(length-1)},${210-row[field]/max*180}`).join(' '); make('polyline',{points,fill:'none',stroke:color,'stroke-width':3});
    rows.forEach((row,index)=>{const dot=make('circle',{cx:45+index*730/(length-1),cy:210-row[field]/max*180,r:4,fill:color});const title=document.createElementNS(ns,'title');title.textContent=`${row.day}: ${row[field]} ${field==='opens'?'first opens':'active installations'}`;dot.append(title);});
  }
  make('text',{x:45,y:240,fill:'#93a2ba','font-size':11},rows[0].day);make('text',{x:775,y:240,fill:'#93a2ba','font-size':11,'text-anchor':'end'},rows.at(-1).day);
}
async function refresh(){ $('refresh').disabled=true; try{const response=await fetch('/api/metrics',{headers:{'X-Local-Session':document.querySelector('meta[name="local-session"]').content},cache:'no-store'});const value=await response.json();if(!response.ok)throw new Error(value.error||'Unavailable');if(!value.totals||!value.active||!value.returning||!Array.isArray(value.days)||!Array.isArray(value.versions)||!Array.isArray(value.starts)||!Number.isFinite(Date.parse(value.asOf)))throw new Error('Invalid summary');summary=value;draw();$('export').disabled=false;$('status').textContent=`Live service data · refreshed ${new Date(value.asOf).toLocaleString()} · only opt-in reporting, no ad attribution`;}catch(error){$('status').textContent=error.message;$('export').disabled=true;}finally{$('refresh').disabled=false;}}
$('refresh').addEventListener('click',refresh);$('range').addEventListener('change',draw);$('export').addEventListener('click',()=>{if(!summary)return;const url=URL.createObjectURL(new Blob([JSON.stringify(summary,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='NEO-LIB-usage-summary.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});void refresh();
