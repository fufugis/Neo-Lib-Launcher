const PROCESS_PATH_SCRIPT = 'Get-CimInstance -ClassName Win32_Process | Where-Object { $_.ExecutablePath } | Select-Object ProcessId,ExecutablePath,@{Name="StartedAtMs";Expression={try { ([DateTimeOffset]$_.CreationDate).ToUnixTimeMilliseconds() } catch { 0 }}} | ConvertTo-Json -Compress';

function createExternalGameWatchService({
  execFile,path,platform=process.platform,normalWinPath,isLikelyGameExe,
  getRunningGameKeys,sendExternalState,sendSession=()=>{},now=Date.now,makeSessionId,
  setTimer=setTimeout,clearTimer=clearTimeout,
}) {
  if(typeof execFile!=='function'||!path||typeof normalWinPath!=='function'||typeof isLikelyGameExe!=='function')throw new TypeError('createExternalGameWatchService requires process, path and game-filter dependencies.');
  const bootAt=now(),state={games:[],timer:null,checking:false,activeId:null,paused:false,generation:0};
  const sessions=new Map();let serial=0;
  const playable=name=>isLikelyGameExe(name)&&!/(launcher|helper|assistant|updater|crash|reporter)/i.test(name)&&!/^(steam|battle\.?net|agent|eadesktop|eabackgroundservice|origin|ubisoftconnect|upc|riotclientservices|riotclientux|rockstargameslauncher|galaxyclient|gamingservices|explorer|cmd|powershell|pwsh|rundll32|conhost|wscript|cscript)\.exe$/i.test(name);
  function runningProcesses() {
    return new Promise(resolve=>{
      if(platform!=='win32')return resolve({ok:false,processes:[]});
      execFile('powershell.exe',['-NoProfile','-NonInteractive','-Command',PROCESS_PATH_SCRIPT],{windowsHide:true,timeout:8000,maxBuffer:8*1024*1024},(error,stdout)=>{
        if(error||!stdout)return resolve({ok:false,processes:[]});
        try{const parsed=JSON.parse(stdout),records=parsed==null?[]:Array.isArray(parsed)?parsed:[parsed];
          if(records.some(v=>!v||typeof v.ExecutablePath!=='string'))return resolve({ok:false,processes:[]});
          resolve({ok:true,processes:records.map(v=>({path:normalWinPath(v.ExecutablePath),name:path.basename(normalWinPath(v.ExecutablePath)),startedAt:Number(v.StartedAtMs)||0})).filter(v=>v.path)});
        }catch{resolve({ok:false,processes:[]});}
      });
    });
  }
  function schedule(delay){
    if(state.timer)clearTimer(state.timer);state.timer=null;
    if(!state.games.length||state.paused)return;
    state.timer=setTimer(()=>{state.timer=null;check();},delay);
  }
  function credit(session,at){
    const gap=at-session.observedAt;
    if(session.observedAt!=null&&gap>=0&&gap<=45000)session.totalMs+=gap;
    session.observedAt=at;
  }
  function checkpoint(session,at,{final=false,force=false}={}){
    if(!force&&!final&&at-session.checkpointAt<60000)return;
    const payload={gameId:String(session.gameId),sessionId:session.id,totalSeconds:Math.floor(session.totalMs/1000),basePlaytime:session.basePlaytime,startedAt:session.startedAt,at,final};
    session.checkpointAt=at;session.lastPayload=payload;sendSession(payload);
  }
  function finish(id,at,{creditTail=true}={}){
    const session=sessions.get(id);if(!session)return;
    const uncertain=session.observedAt==null;
    if(creditTail&&!uncertain)credit(session,at);
    checkpoint(session,uncertain?session.seenAt:at,{final:true});sessions.delete(id);
  }
  function publish(active){
    const nextId=active?.id||null;if(nextId===state.activeId)return;
    state.activeId=nextId;sendExternalState({active:Boolean(active),gameId:nextId,name:active?.name||''});
  }
  async function check(){
    if(state.checking||!state.games.length||state.paused)return {ok:false,busy:true};
    state.checking=true;const generation=state.generation;
    try{
      const result=await runningProcesses(),at=now();
      if(state.paused||generation!==state.generation)return {ok:false,busy:true};
      if(!result.ok){for(const session of sessions.values()){checkpoint(session,session.seenAt,{force:true});session.observedAt=null;}return {ok:false,busy:true};}
      const launchedHere=new Set([...getRunningGameKeys()].map(v=>String(v).toLowerCase()));
      const trackedHere=state.games.filter(g=>launchedHere.has(String(g.id).toLowerCase())||launchedHere.has(g.exePath));
      const eligible=state.games.filter(g=>!launchedHere.has(String(g.id).toLowerCase())&&!launchedHere.has(g.exePath));
      const found=new Map();
      for(const process of result.processes){
        if(!playable(process.name))continue;
        if(trackedHere.some(g=>g.exePath===process.path||g.fallbackRoot&&process.path.startsWith(g.fallbackRoot)))continue;
        const exact=eligible.find(g=>g.exePath===process.path);
        const fallback=exact?null:eligible.filter(g=>g.fallbackRoot&&process.path.startsWith(g.fallbackRoot)).sort((a,b)=>b.fallbackRoot.length-a.fallbackRoot.length)[0];
        const game=exact||fallback;if(game&&!found.has(game.id))found.set(game.id,{game,process});
      }
      for(const [id,session] of sessions){
        if(launchedHere.has(String(id).toLowerCase())){finish(id,session.seenAt,{creditTail:false});continue;}
        const game=found.get(id)?.game;
        if(!game||!game.trackingEnabled||game.resetAt!==session.resetAt)finish(id,at);
      }
      for(const {game,process} of found.values()){
        if(!game.trackingEnabled)continue;
        let session=sessions.get(game.id);
        if(!session){
          const startedAt=Math.max(bootAt,game.resetAt,at-30000,Math.min(at,process.startedAt||at));
          session={id:makeSessionId?.()||'external-'+bootAt+'-'+(++serial),gameId:game.id,basePlaytime:game.playtime,resetAt:game.resetAt,startedAt,totalMs:at-startedAt,observedAt:at,seenAt:at,checkpointAt:at};sessions.set(game.id,session);
          checkpoint(session,at,{force:true});
        }else{credit(session,at);session.seenAt=at;checkpoint(session,at);}
      }
      const active=[...found.values()][0]?.game||null;publish(active);
      return {ok:true,active:Boolean(active),gameId:active?.id||null,name:active?.name||''};
    }finally{state.checking=false;schedule(state.activeId?8000:30000);}
  }
  async function watch({games=[]}={}){
    state.generation++;
    const candidates=games.map(g=>{
      const exePath=normalWinPath(g?.exePath),supplied=normalWinPath(g?.installDir),installDir=path.isAbsolute(supplied)?normalWinPath(path.resolve(supplied)):'';
      const safeRoot=installDir&&path.dirname(installDir)!==installDir&&!/^(games|common|steamapps|program files(?: \(x86\))?|applications|programs)$/i.test(path.basename(installDir));
      return {id:g?.id,name:String(g?.name||'Game'),exePath,fallbackRoot:safeRoot?installDir.replace(/[\\/]+$/,'')+'\\':'',hasInstallDir:Boolean(installDir),trackingEnabled:g?.trackingEnabled!==false,playtime:Number.isFinite(g?.playtime)?Math.max(0,g.playtime):0,resetAt:Number(g?.playtimeResetAt)||0};
    });
    state.games=candidates.filter(g=>g.id&&g.exePath&&path.isAbsolute(g.exePath)&&(playable(path.basename(g.exePath))||g.hasInstallDir));
    for(const id of sessions.keys())if(!state.games.some(g=>g.id===id&&g.trackingEnabled))finish(id,now());
    if(!state.games.length){publish(null);if(state.timer)clearTimer(state.timer);state.timer=null;}
    else if(!state.timer&&!state.checking&&!state.paused)check();
    return {ok:true,watching:state.games.length,ignored:candidates.length-state.games.length};
  }
  function suspend(){
    for(const session of sessions.values()){const at=now();credit(session,at);session.seenAt=at;checkpoint(session,at,{force:true});session.observedAt=null;}
    state.paused=true;if(state.timer)clearTimer(state.timer);state.timer=null;
  }
  function resume(){state.paused=false;for(const session of sessions.values())session.observedAt=now();check();}
  function shutdown(){for(const id of [...sessions.keys()])finish(id,now());if(state.timer)clearTimer(state.timer);state.timer=null;state.paused=true;}
  return Object.freeze({watch,scanNow:check,suspend,resume,shutdown});
}
module.exports={createExternalGameWatchService};
