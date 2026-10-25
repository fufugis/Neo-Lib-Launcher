export const HISTORY_GAME_FIELDS = ['id','name','appid','gogId','website','newsUrl','updateWatchUrl','launcher','source'];
export const historyGame = game => Object.fromEntries(HISTORY_GAME_FIELDS.filter(key=>game?.[key]!=null).map(key=>[key,game[key]]));
export function newsSourceUrl(value) {
  if(!value?.trim())return '';
  try {const url=new URL(value.trim()),host=url.hostname.toLowerCase();
    if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443')||!host.includes('.')||/^\[|^[\d.]+$/.test(host)||/(^|\.)(localhost|local|internal)$/.test(host))return null;
    return url.href;
  }catch{return null;}
}
export function historyEntries(items) {
  const seen=new Set();
  return (Array.isArray(items)?items:[]).filter(item=>{
    if(!item||typeof item.title!=='string'||!item.title.trim()||!Number.isFinite(item.date)||item.date<=0||item.date>Date.now()+86400000||!newsSourceUrl(item.url))return false;
    const key=item.url+'|'+item.title.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;
}).sort((a,b)=>b.date-a.date).slice(0,10).map(item=>({...item,title:item.title.slice(0,240),snippet:typeof item.snippet==='string'?item.snippet.slice(0,360):'',sourceLabel:typeof item.sourceLabel==='string'?item.sourceLabel.slice(0,160):'Public source',kind:['News','Patch','Devblog','Event','Coverage'].includes(item.kind)?item.kind:'News',id:typeof item.id==='string'?item.id:item.url}));
}
