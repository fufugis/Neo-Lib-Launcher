import React from 'react';
import {historyGame,historyEntries} from './game-history-model.mjs';
const empty = {items:[],loading:false,error:false,stale:false,noSource:false,fetchedAt:0};
const cache=new Map(),pending=new Map();
export default function useGameHistory(game) {
  const payload=historyGame(game),key=JSON.stringify(payload);
  const [request,setRequest]=React.useState({key:'',nonce:0,force:false});
  const [state,setState]=React.useState({...empty,key});
  const refresh=React.useCallback((force=true)=>setRequest(value=>({key,nonce:value.nonce+1,force})),[key]);
  React.useEffect(()=>{
    if(!game?.id||game.libraryToolId!=null||game.managedTool||!window.api?.gameNewsHistory)return;
    const check=(force=false)=>{if(document.visibilityState!=='hidden')refresh(force);};
    const timer=setInterval(()=>check(true),30*60000);
    const focus=()=>{const current=cache.get(key);if(!current||Date.now()-current.receivedAt>=5*60000)check();};
    window.addEventListener('focus',focus);
    return()=>{clearInterval(timer);window.removeEventListener('focus',focus);};
  },[key,refresh]);
  React.useEffect(()=>{
    let alive=true;const current=cache.get(key),api=window.api?.gameNewsHistory;
    if(!game?.id||game.libraryToolId!=null||game.managedTool||!api){setState({...empty,key,error:!api,noSource:!api});return;}
    const force=request.key===key&&request.force;
    if(!force&&current&&Date.now()-current.receivedAt<5*60000){setState({...current,key,loading:false});return;}
    setState({...empty,...current,key,loading:true,error:false});
    // Rapid carousel/Library selection must not start a crawl for every row.
    const timer=setTimeout(()=>{
      let work=pending.get(key);
      if(!work){work=Promise.resolve().then(()=>api({game:JSON.parse(key),force})).finally(()=>pending.delete(key));pending.set(key,work);}
      work.then(result=>{
        if(!result?.ok)throw new Error('History unavailable');
        const next={items:historyEntries(result.items),loading:false,error:result.unavailable===true,stale:result.stale===true,noSource:result.noSource===true,fetchedAt:result.fetchedAt,receivedAt:Date.now()};
        cache.delete(key);cache.set(key,next);while(cache.size>80)cache.delete(cache.keys().next().value);
        if(alive)setState({...next,key});
      }).catch(()=>{if(alive)setState({...empty,...current,key,loading:false,error:true,stale:Boolean(current?.items.length)});});
    },200);
    return()=>{alive=false;clearTimeout(timer);};
  },[key,request.nonce]);
  return {...(state.key===key?state:{...empty,loading:true}),refresh:()=>refresh(true)};
}
