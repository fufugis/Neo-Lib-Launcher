const {publicNewsUrl}=require('./game-history-http.cjs');
const {createHash}=require('node:crypto');
function decode(value='') {
  return String(value).replace(/<!\[CDATA\[/g,'').replace(/\]\]>/g,'').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>{const code=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return code>0&&code<=0x10ffff?String.fromCodePoint(code):'';}).replace(/&(amp|lt|gt|quot|apos|nbsp);/gi,(_,name)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[name.toLowerCase()]);
}
const plain=value=>decode(decode(String(value||'').slice(0,500000)).replace(/<[^<>]*>/g,' ')).replace(/\[[\/]?(?:url|img|b|i|h[1-6]|list|\*)[^\[\]]{0,1000}\]/gi,'').replace(/\s+/g,' ').trim();
function attrs(tag) {const result=Object.create(null);for(const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))result[match[1].toLowerCase()]=decode(match[2]??match[3]??match[4]);return result;}
// Bounded forward-only paired-tag extraction avoids repeated scans through an
// unclosed malicious tag stream; this is deliberately not an executing DOM.
function* elements(body,name) {
  const open=new RegExp('<'+name+'\\b[^<>]*>','gi'),lower=body.toLowerCase(),close='</'+name.toLowerCase()+'>';let match,count=0;
  while(count++<150&&(match=open.exec(body))) {
    const end=lower.indexOf(close,open.lastIndex);if(end<0)break;
    yield [body.slice(match.index,end+close.length),match[0],body.slice(open.lastIndex,end)];
    open.lastIndex=end+close.length;
  }
}
const tag=(body,name)=>elements(body,name).next().value?.[2]||'';
function timestamp(value) {if(!value||typeof value!=='string'||!(/\b\d{4}-\d{2}-\d{2}/.test(value)||/\b\d{1,2}\s+[a-z]{3,9}\s+\d{4}\b|\b[a-z]{3,9}\s+\d{1,2},?\s+\d{4}\b/i.test(value)))return 0;const parsed=Date.parse(value);return Number.isFinite(parsed)&&parsed>0?parsed:0;}
function kind(title) {if(/patch|hotfix|changelog|release notes|\bversion\b/i.test(title))return 'Patch';if(/dev.?blog|devlog|development|behind the scenes|roadmap/i.test(title))return 'Devblog';if(/event|festival|weekend|season|anniversary/i.test(title))return 'Event';return 'News';}
function scoped(game,seed) {
  const url=new URL(seed);const tokens=plain(game.name).toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter(t=>t.length>=3&&!['the','game','edition','and'].includes(t))||[];
  const contains=text=>tokens.length&&tokens.every(t=>text.toLowerCase().includes(t));
  return {contains,own:Boolean(game.newsUrl||game.updateWatchUrl)||Boolean(url.hostname.endsWith('.itch.io')&&url.pathname.endsWith('/devlog.rss'))||Boolean(tokens.length&&contains(decode(url.hostname+url.pathname).replace(/[-_/]/g,' ')))};
}
function normalizeEntries(entries,game,now=Date.now()) {
  const result=[],seen=new Set();
  for(const raw of entries) {
    const url=publicNewsUrl(raw.url),date=typeof raw.date==='number'?raw.date:timestamp(raw.date),title=plain(raw.title).slice(0,240),snippet=plain(raw.snippet).slice(0,360);
    if(!url||!title||!Number.isFinite(date)||date<=0||date>now+86400000)continue;
    const canonical=new URL(url);for(const key of [...canonical.searchParams.keys()])if(/^utm_|^(fbclid|gclid|mc_cid|mc_eid)$/i.test(key))canonical.searchParams.delete(key);
    const identity=canonical.href.replace(/\/$/,'')+'|'+title.toLowerCase();
    if(seen.has(identity))continue;seen.add(identity);
    result.push({id:'history-'+createHash('sha256').update(identity).digest('hex'),gameId:String(game.id||''),platform:String(raw.platform||'publisher'),title,url,date,snippet,sourceLabel:String(raw.sourceLabel||new URL(url).hostname).slice(0,160),kind:kind(title)});
  }
  // Same article from multiple sources/UTM links must not crowd the ten slots.
  const titles=new Set();
  return result.sort((a,b)=>b.date-a.date||a.title.localeCompare(b.title)).filter(item=>{const key=item.title.toLowerCase()+'|'+Math.floor(item.date/86400000);if(titles.has(key))return false;titles.add(key);return true;}).slice(0,10);
}
function parsePage(body,seed,game) {
  body=String(body||'').slice(0,2*1024*1024);
  const entries=[],feeds=[],hubs=[],scope=scoped(game,seed),origin=new URL(seed).origin;
  const link=value=>{if(!value)return '';const url=publicNewsUrl(decode(value).trim(),seed);return url&&new URL(url).hostname.replace(/^www\./,'')===new URL(origin).hostname.replace(/^www\./,'')?url:'';};
  const add=entry=>{const url=link(entry.url);if(url&&(scope.own||scope.contains(plain(entry.title+' '+entry.snippet))))entries.push({...entry,url});};
  for(const match of body.matchAll(/<link\b[^<>]*>/gi)) {const a=attrs(match[0]);if(/alternate/i.test(a.rel||'')&&/rss|atom/i.test(a.type||'')){const url=link(a.href);if(url)feeds.push(url);}}
  for(const match of [...elements(body,'item'),...elements(body,'entry')]) {
    const block=match[2],atom=/^<entry\b/i.test(match[1]);let url=tag(block,'link');
    if(atom){const links=[...block.matchAll(/<link\b[^<>]*>/gi)].map(m=>attrs(m[0]));url=(links.find(a=>!a.rel||a.rel==='alternate')||{}).href;}
    add({title:tag(block,'title'),snippet:tag(block,'description')||tag(block,'summary')||tag(block,'content'),url,date:timestamp(tag(block,'pubDate')||tag(block,'published')||tag(block,'dc:date')||tag(block,'updated'))});
  }
  // Read structured publication data only; never run embedded scripts or fetch articles.
  for(const match of elements(body,'script')) {
    if(attrs(match[1]).type!=='application/ld+json'||match[2].length>500000)continue;
    try {const queue=[JSON.parse(match[2])];let visited=0;while(queue.length&&visited++<150){const node=queue.shift();if(!node||typeof node!=='object')continue;if(Array.isArray(node)){queue.push(...node.slice(0,100));continue;}const types=[node['@type']].flat();if(types.some(t=>['NewsArticle','Article','BlogPosting','TechArticle'].includes(t)))add({title:node.headline||node.name,snippet:node.description,url:node.url||node.mainEntityOfPage?.['@id']||seed,date:timestamp(node.datePublished)});for(const key of ['@graph','itemListElement','item','mainEntity'])if(node[key])queue.push(node[key]);}}catch{}
  }
  for(const match of elements(body,'article')) {
    const block=match[2],heading=['h1','h2','h3','h4'].map(name=>tag(block,name)).find(Boolean)||'',time=block.match(/<time\b[^<>]*>/i)?.[0]||'';
    const anchor=(heading||block).match(/<a\b[^<>]*>/i)?.[0]||'';
    add({title:heading,snippet:tag(block,'p'),url:attrs(anchor).href,date:timestamp(attrs(time).datetime||plain(tag(block,'time')))});
  }
  for(const match of elements(body,'a')) {
    const url=link(attrs(match[1]).href),label=plain(match[2]);
    if(url&&url!==seed&&/^(?:news|updates|patch notes|devlogs?|development blog|blog|changelog)$/i.test(label)&&(scope.own||scope.contains(url)))hubs.push(url);
  }
  return {entries,feeds:[...new Set(feeds)].slice(0,2),hubs:[...new Set(hubs)].slice(0,1)};
}
module.exports={parsePage,normalizeEntries,plain,timestamp,publicNewsUrl};
