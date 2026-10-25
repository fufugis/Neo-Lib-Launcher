const {createOwnedNewsProviderService}=require('./owned-news-provider-service.cjs');
const {parsePage,normalizeEntries,plain,publicNewsUrl}=require('./game-history-parser.cjs');
function createGameHistoryService({http,press=null,now=Date.now,cacheMs=30*60*1000}={}) {
  if(!http?.text||!http?.json)throw new TypeError('Game history needs a safe public HTTP client.');
  const cache=new Map(),pending=new Map();
  let active=0;const waiting=[];
  async function slot(work) {if(active>=2)await new Promise(resolve=>waiting.push(resolve));else active++;try{return await work();}finally{if(waiting.length)waiting.shift()();else active--;}}
  function key(game) {return JSON.stringify([game.id,game.name,game.appid,game.gogId,game.website,game.updateWatchUrl,game.newsUrl,game.launcher,game.source]);}
  async function load(game,force) {
    const entries=[];let failed=false,attempts=0;
    const attempt=async fn=>{attempts++;try{return await fn();}catch{failed=true;return null;}};
    // Identity comes from the saved exact store ID, never a fuzzy title search.
    let appid=/^\d+$/.test(String(game.appid||''))?String(game.appid):'';
    if(!appid){try{const u=new URL(game.website);if(['store.steampowered.com','steamcommunity.com'].includes(u.hostname))appid=u.pathname.match(/\/app\/(\d+)(?:\/|$)/)?.[1]||'';}catch{}}
    if(appid) {
      const data=await attempt(()=>http.json('https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid='+appid+'&count=15&maxlength=500&feeds=steam_community_announcements&format=json'));
      if(data&&String(data.appnews?.appid)!==appid){failed=true;}
      else for(const item of (data?.appnews?.newsitems||[]).slice(0,30))entries.push({title:item.title,url:item.url,date:Number(item.date)*1000,snippet:item.contents,platform:'steam',sourceLabel:'Steam · developer announcements'});
    }
    if(/^\d+$/.test(String(game.gogId||''))) {
      const data=await attempt(()=>http.json('https://api.gog.com/products/'+game.gogId+'?expand=changelog&locale=en-US'));
      if(data) {const owned=createOwnedNewsProviderService({httpGetText:http.text,httpGetJson:async()=>data,stripHtml:plain});
        entries.push(...(await owned.fetchGog(game,0)).map(item=>({...item,sourceLabel:'GOG · changelog'})));}
    }
    let seed=[game.newsUrl,game.updateWatchUrl,game.website].map(value=>value&&publicNewsUrl(value)).find(Boolean)||'';
    if(seed) {
      const url=new URL(seed),host=url.hostname;
      // Store hubs, communities and search pages aren't publisher feeds.
      if(!game.newsUrl && /(^|\.)(steampowered\.com|steamcommunity\.com|gog\.com|epicgames\.com|google\.com|youtube\.com|wikipedia\.org)$/.test(host))seed='';
      if(seed&&host.endsWith('.itch.io')&&url.pathname!=='/')seed=url.origin+url.pathname.replace(/\/+$/,'').replace(/\/devlog(?:\.rss)?$/i,'')+'/devlog.rss';
    }
    if(seed && (entries.length<10||game.newsUrl)) {
      let requests=0;const visited=new Set();let queue=[seed];
      while(queue.length&&requests<4) {
        const url=queue.shift();if(visited.has(url))continue;visited.add(url);requests++;
        const body=await attempt(()=>http.text(url));if(body==null)continue;
        const page=parsePage(body,url,game);
        entries.push(...page.entries.map(item=>({...item,platform:new URL(seed).hostname.endsWith('.itch.io')?'itch':'publisher',sourceLabel:game.newsUrl?'Selected source · '+new URL(url).hostname:new URL(url).hostname})));
        // One same-publisher feed/hub at a time, no recursive site crawl.
        if(!page.entries.length||entries.length<10)queue.push(...page.feeds,...(url===seed?page.hubs:[]));
        if(normalizeEntries(entries,game,now()).length>=10)break;
      }
    }
    let items=normalizeEntries(entries,game,now());
    if(!items.length&&press) {const coverage=await press.fetch(game,{force});items=coverage.items;failed=failed||coverage.unavailable;attempts++;}
    return {ok:true,items,fetchedAt:now(),cached:false,stale:false,unavailable:failed&&!items.length,noSource:attempts===0};
  }
  async function fetch({game={},force=false}={}) {
    const identity=key(game),previous=cache.get(identity),age=now()-(previous?.checkedAt||0);
    if(previous&&age<(force?30000:cacheMs))return {...previous.result,cached:true};
    if(pending.has(identity))return pending.get(identity);
    if(pending.size>=16)return previous?{...previous.result,cached:true,stale:true}:{ok:true,items:[],fetchedAt:now(),cached:false,stale:false,unavailable:true,noSource:false};
    const work=slot(()=>load(game,force)).catch(()=>({ok:true,items:[],fetchedAt:now(),cached:false,stale:false,unavailable:true,noSource:false})).then(result=>{
      if(result.unavailable&&previous?.result.items.length)result={...previous.result,cached:true,stale:true,unavailable:true};
      cache.delete(identity);cache.set(identity,{checkedAt:now(),result});while(cache.size>100)cache.delete(cache.keys().next().value);
      return result;
    }).finally(()=>pending.delete(identity));
    pending.set(identity,work);return work;
  }
  return {fetch};
}
module.exports={createGameHistoryService};
