function createGamePathAuditService({ fsp, path }) {
  async function audit(rows) {
    if(!Array.isArray(rows)||rows.length>100)return [];
    const roots = new Map();
    const stat = async name => {
      let timer;
      try { const value = await Promise.race([fsp.stat(name), new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(Error('timeout'),{code:'ETIMEDOUT'})),1500)})]); return { exists:true, file:value.isFile(), directory:value.isDirectory() }; }
      catch(error){return {exists:false,missing:['ENOENT','ENOTDIR'].includes(error?.code)};}
      finally { clearTimeout(timer); }
    };
    const inspect = async (name, folder) => {
      if (!name) return 'skip';
      if (!path.isAbsolute(name) || /^(?:\\\\|\/\/|\\\?\\)/.test(name)) return 'unsupported';
      const root=path.parse(name).root;
      if(!roots.has(root))roots.set(root,stat(root));
      if(!(await roots.get(root)).directory)return 'unavailable';
      const value=await stat(name);
      return value.exists ? (folder?value.directory:value.file)?'present':'missing' : value.missing?'missing':'unavailable';
    };
    const results=new Array(rows.length);let cursor=0;
    await Promise.all(Array.from({length:Math.min(8,rows.length)},async()=>{
      while(cursor<rows.length){const index=cursor++,row=rows[index];
        const file=await inspect(row.filePath,false),folder=await inspect(row.folderPath,true);
        const status=[file,folder].includes('unavailable')?'unavailable':[file,folder].includes('missing')?'missing':[file,folder].includes('present')?'present':'unsupported';
        results[index]={id:row.id,status,file,folder,filePath:row.filePath||'',folderPath:row.folderPath||''};
      }
    }));
    return results;
  }
  return {audit};
}
module.exports={createGamePathAuditService};
