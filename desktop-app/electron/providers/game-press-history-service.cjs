const {parsePage,normalizeEntries,plain}=require('./game-history-parser.cjs');
const normalize=value=>plain(value).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
function matchesGame(title,name) {
  const needle=normalize(name).replace(/\b(?:game of the year|goty|definitive|deluxe|ultimate|standard|complete) edition\b/g,'').replace(/\s+/g,' ').trim();
  const haystack=' '+normalize(title)+' ';
  if(needle.length<4||!haystack.includes(' '+needle+' '))return false;
  // Avoid turning "control settings", "rust removal", etc into game coverage.
  if(['control','inside','grounded','rust','prey','stray','rage','portal'].includes(needle))return haystack.startsWith(' '+needle+' ')&&/\b(game|sequel|remake|remaster|update|patch|developer|players|steam|dlc|review)\b/.test(haystack);
  return true;
}
function createGamePressHistoryService({http,now=Date.now}={}) {
  if(!http?.text)throw new TypeError('Press history requires a safe HTTP client.');
  const cache=new Map(),pending=new Map();
  async function feed(source,force) {
    const old=cache.get(source.url);
    if(old&&now()-old.at<(force?30000:30*60000))return old;
    if(pending.has(source.url))return pending.get(source.url);
    const work=(async()=>{
      try {
        const body=await http.text(source.url);
        const items=parsePage(body,source.url,{name:'',newsUrl:source.url}).entries;
        const value={at:now(),items,failed:false};cache.delete(source.url);cache.set(source.url,value);
        while(cache.size>40)cache.delete(cache.keys().next().value);return value;
      }catch{const value={at:now(),items:old?.items||[],failed:true};cache.delete(source.url);cache.set(source.url,value);while(cache.size>40)cache.delete(cache.keys().next().value);return value;}
    })().finally(()=>pending.delete(source.url));
    pending.set(source.url,work);return work;
  }
  async function fetch(game,{force=false}={}) {
    const slug=normalize(game.name).replace(/ /g,'-').slice(0,160);
    if(!slug||slug.length<4)return {items:[],unavailable:false};
    const sources=[{name:'PC Gamer',url:'https://www.pcgamer.com/feeds/tag/'+encodeURIComponent(slug)+'/'},{name:'GamesRadar+',url:'https://www.gamesradar.com/rss/'}];
    const responses=await Promise.all(sources.map(source=>feed(source,force)));
    const entries=responses.flatMap((response,index)=>response.items.filter(item=>matchesGame(item.title,game.name)).map(item=>({...item,platform:'press',sourceLabel:sources[index].name+' · press coverage'})));
    return {items:normalizeEntries(entries,game,now()).map(item=>({...item,kind:'Coverage'})),unavailable:responses.every(value=>value.failed)};
  }
  return {fetch};
}
module.exports={createGamePressHistoryService};
