import React from 'react';
import { gamePathTarget } from '../../state/missing-games-model.mjs';

const labels={missing:'Missing file or folder',unavailable:'Drive offline or access unavailable',unsupported:'No local path to verify',present:'Found'};
export default function MissingGamesPanel({games=[],onRemove,onRelocate}) {
  const [rows,setRows]=React.useState([]),[selected,setSelected]=React.useState([]),[busy,setBusy]=React.useState(false),[status,setStatus]=React.useState('');
  const [scanning,setScanning]=React.useState(false);
  const run=React.useRef(0);
  const safeGames=Array.isArray(games)?games.filter(game=>game&&typeof game==='object'&&game.id):[];
  const allowedIds=new Set(safeGames.map(game=>game.id));
  const displayRows=rows.filter(row=>allowedIds.has(row.id));
  React.useEffect(()=>()=>{run.current++;},[]);
  const scan=async()=>{
    const token=++run.current;setBusy(true);setScanning(true);setRows([]);setSelected([]);
    try{
      if(!window.api?.auditGamePaths)throw Error('The installed app is required to check local files.');
      const targets=safeGames.map(gamePathTarget),byId=new Map(safeGames.map(game=>[game.id,game]));let found=[];
      for(let index=0;index<targets.length;index+=100){
        setStatus(`Checking ${index} of ${targets.length} games…`);
        const batch=targets.slice(index,index+100);
        const result=await window.api.auditGamePaths(batch);
        if(token!==run.current)return;
        if(!Array.isArray(result)||result.length!==batch.length)throw Error('The scan did not finish safely. No entries were removed.');
        found=[...found,...result.map(row=>({...row,name:byId.get(row.id)?.name||'Game',rom:Boolean(byId.get(row.id)?.romPath)}))];
        setRows(found.filter(row=>row.status!=='present'));
      }
      setStatus(`Checked ${targets.length} games · ${found.filter(row=>row.status==='missing').length} missing · ${found.filter(row=>row.status==='unavailable').length} unavailable. Nothing removed automatically.`);
    }catch(error){if(token===run.current)setStatus(error.message||'The scan failed.');}
    finally{if(token===run.current){setBusy(false);setScanning(false);}}
  };
  const locate=async(row,folder)=>{
    const token=run.current;setBusy(true);
    try{
      const chosen=await (folder?window.api?.pickDirectory?.():window.api?.pickExe?.());if(!chosen)return;
      const previous=row.filePath.replace(/\\/g,'/').split('/').at(-1);
      const filePath=folder?(previous?chosen.replace(/[\\/]+$/,'')+'/'+previous:''):chosen;
      const folderPath=folder?chosen:chosen.replace(/[\\/][^\\/]+$/,'');
      const [checked]=await window.api.auditGamePaths([{id:row.id,filePath,folderPath}]);
      if(token!==run.current)return;
      if(checked?.status!=='present'){setStatus('That location does not contain the expected file, or cannot be accessed. Choose the executable directly if it was renamed.');return;}
      const patch={installDir:folderPath,...(row.rom?{romPath:filePath}:filePath?{exePath:filePath}:{} )};
      if(await onRelocate?.(row,patch)){setRows(current=>current.filter(item=>item.id!==row.id));setSelected(current=>current.filter(id=>id!==row.id));setStatus('Location updated. Your game metadata and playtime were kept.');}
    }catch(error){if(token===run.current)setStatus(error.message||'Could not update this location.');}
    finally{if(token===run.current)setBusy(false);}
  };
  return <section className="mt-4 rounded-lg hairline bg-panel/30 p-3 space-y-3" data-testid="wizard-missing-games">
    <h3 className="text-sm font-bold">Find missing games</h3>
    <p className="text-xs text-muted">Quick file/folder checks only—no folder crawl or game launches. Disconnected drives and access errors are not treated as uninstalled games. Locked private entries are excluded.</p>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} data-testid="missing-games-scan" onClick={scan} className="rounded hairline px-3 py-2 text-xs">{busy?'Working…':'Quick scan Library'}</button>
      <button type="button" disabled={busy||!displayRows.some(row=>row.status==='missing')} onClick={()=>setSelected(displayRows.filter(row=>row.status==='missing').map(row=>row.id))} className="rounded hairline px-3 py-2 text-xs">Select missing</button>
      {busy&&scanning&&<button type="button" onClick={()=>{run.current++;setBusy(false);setScanning(false);setStatus('Stopped. Nothing was removed.');}} className="rounded hairline px-3 py-2 text-xs">Stop</button>}
      <button type="button" disabled={busy||!selected.length||!onRemove} data-testid="missing-games-remove" onClick={async()=>{
        const token=run.current;setBusy(true);
        try{const removed=await onRemove(displayRows.filter(row=>selected.includes(row.id)))||[];if(token===run.current){setRows(current=>current.filter(row=>!removed.includes(row.id)));setSelected([]);setStatus(removed.length?`Removed ${removed.length} Library entries only. No installed files were deleted.`:'Nothing removed. Entries may have changed or their drive may be unavailable.');}}
        catch(error){if(token===run.current)setStatus(error.message||'Could not remove entries.');}
        finally{if(token===run.current)setBusy(false);}
      }} className="rounded border border-rose-400/50 px-3 py-2 text-xs">Remove selected ({selected.length})</button>
    </div>
    {status&&<p role="status" className="text-xs text-muted">{status}</p>}
    <div className="max-h-80 space-y-2 overflow-auto">{displayRows.map(row=><div key={row.id} className="rounded hairline p-2 text-xs" data-missing-game={row.id}>
      <div className="flex items-center gap-2"><input type="checkbox" aria-label={`Select ${row.name}`} disabled={busy||row.status!=='missing'} checked={selected.includes(row.id)} onChange={event=>setSelected(current=>event.target.checked?[...current,row.id]:current.filter(id=>id!==row.id))}/><b className="min-w-0 flex-1 break-words">{row.name}</b><span>{labels[row.status]}</span></div>
      <p className="mt-1 break-all text-muted">{row.filePath||row.folderPath||'Launcher or virtual game—no local target configured'}</p>
      <div className="mt-2 flex gap-2">{!row.rom&&<button type="button" disabled={busy} onClick={()=>locate(row,false)} className="rounded hairline px-2 py-1">Locate executable</button>}<button type="button" disabled={busy} onClick={()=>locate(row,true)} className="rounded hairline px-2 py-1">Locate folder</button></div>
    </div>)}</div>
  </section>;
}
