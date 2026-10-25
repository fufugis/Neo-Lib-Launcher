// Local write-ahead snapshots: IDs/times, never executable paths or inventories.
function createExternalSessionJournal({fs,path,file}) {
  let loaded=false,dirty=false,primaryValid=false,entries=new Map();
  const valid=v=>v&&typeof v.gameId==='string'&&v.gameId.length>0&&v.gameId.length<=500&&typeof v.sessionId==='string'&&v.sessionId.length>0&&v.sessionId.length<=128&&[v.totalSeconds,v.basePlaytime,v.at,v.startedAt].every(Number.isFinite)&&v.totalSeconds>=0&&v.totalSeconds<=366*86400&&v.basePlaytime>=0&&v.at>=v.startedAt&&v.startedAt>0;
  const clean=v=>({gameId:v.gameId,sessionId:v.sessionId,totalSeconds:v.totalSeconds,basePlaytime:v.basePlaytime,startedAt:v.startedAt,at:v.at,final:v.final===true});
  function load(){if(loaded)return;loaded=true;for(const name of [file(),file()+'.bak'])try{const data=JSON.parse(fs.readFileSync(name,'utf8'));if(data.version!==1||!Array.isArray(data.entries))continue;entries=new Map(data.entries.filter(valid).slice(-64).map(v=>[v.sessionId,clean(v)]));primaryValid=name===file();break;}catch{}}
  function record(v){
    load();if(!valid(v))return false;const old=entries.get(v.sessionId);
    const stale=old&&(old.totalSeconds>v.totalSeconds||old.final&&!v.final||old.totalSeconds===v.totalSeconds&&old.final===Boolean(v.final));
    if(!stale){entries.delete(v.sessionId);entries.set(v.sessionId,clean(v));while(entries.size>64)entries.delete(entries.keys().next().value);dirty=true;}
    if(!dirty)return true;
    try{const target=file();fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target+'.tmp',JSON.stringify({version:1,entries:[...entries.values()]}),'utf8');if(primaryValid&&fs.existsSync(target))fs.copyFileSync(target,target+'.bak');fs.renameSync(target+'.tmp',target);dirty=false;primaryValid=true;return true;}catch{return false;}
  }
  return {record,entries:()=>{load();return [...entries.values()].map(v=>({...v}));}};
}
module.exports={createExternalSessionJournal};
