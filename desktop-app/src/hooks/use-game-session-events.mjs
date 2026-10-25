import React from 'react';
import {applyGameSession} from '../state/library-state.mjs';
import {sessionResult} from '../state/playtime-state.mjs';
import {applyExternalSession,externalSessionResult} from '../state/external-playtime-state.mjs';

export default function useGameSessionEvents(options) {
  const latest=React.useRef(options);
  React.useLayoutEffect(()=>{latest.current=options;});
  const {enabled,nativeApi}=options;
  React.useEffect(()=>{
    if(!enabled||!nativeApi)return;
    const timers=new Set(),rated=new Set();
    const prompt=(game,seconds,key)=>{
      if(!game||rated.has(key))return;rated.add(key);while(rated.size>128)rated.delete(rated.values().next().value);
      const timer=setTimeout(()=>{timers.delete(timer);latest.current.setRatingPromptGame({game,seconds});},650);timers.add(timer);
    };
    const exited=nativeApi.onGameExited?.(({gameId,seconds,trackingDisabled})=>{
      const current=latest.current;current.setRunningGame(active=>!gameId||active?.id===gameId?null:active);
      if(!gameId||trackingDisabled)return;
      const game=current.libraryRef.current.games.find(item=>item.id===gameId);
      if(sessionResult(game,seconds,Date.now()).shouldPromptRating)prompt(game,Number(seconds),'native-'+gameId+'-'+Date.now());
      current.setLibrary(library=>applyGameSession(library,gameId,seconds,Date.now()));
      if(Number(seconds)>0&&Number(seconds)<8)current.recordLaunchProblem(gameId,'closed immediately');
    });
    const external=nativeApi.onExternalPlaytime?.(event=>{
      const current=latest.current,game=current.libraryRef.current.games.find(item=>String(item.id)===String(event?.gameId));
      const result=externalSessionResult(game,event);
      if(!result.patch)return;
      current.setLibrary(library=>applyExternalSession(library,event));
      if(result.shouldPromptRating&&!event.replayed)prompt(game,event.totalSeconds,event.sessionId);
    });
    return()=>{if(typeof exited==='function')exited();if(typeof external==='function')external();for(const timer of timers)clearTimeout(timer);};
  },[enabled,nativeApi]);
}
