import {recordPlaytimeDays} from './playtime-days.mjs';
import {isEmulatorEntry} from '../lib/emulator-profile-model.mjs';
import {sessionResult} from './playtime-state.mjs';
const valid=e=>e&&typeof e.sessionId==='string'&&e.sessionId.length<=128&&[e.totalSeconds,e.basePlaytime,e.at,e.startedAt].every(Number.isFinite)&&e.totalSeconds>=0&&e.totalSeconds<=366*86400&&e.basePlaytime>=0&&e.startedAt>0&&e.at>=e.startedAt;
export function externalSessionResult(game,event) {
  if(!game||!valid(event)||String(game.id)!==String(event.gameId)||game.trackingMethod==='manual'||isEmulatorEntry(game)||event.startedAt<Number(game.playtimeResetAt||0))return {patch:null,shouldPromptRating:false};
  const receipts=Object.fromEntries(Object.entries(game.externalPlaytimeSessions||{}).filter(([,value])=>value&&Number.isFinite(value.totalSeconds)&&Number.isFinite(value.basePlaytime)&&Number.isFinite(value.at)));
  const previous=receipts[event.sessionId];
  if(previous&&(previous.totalSeconds>event.totalSeconds||previous.final&&!event.final||previous.totalSeconds===event.totalSeconds&&(!event.final||previous.final)))return {patch:null,shouldPromptRating:false};
  const delta=Math.max(0,event.totalSeconds-(previous?.totalSeconds||0)),base=previous?.basePlaytime??event.basePlaytime;
  receipts[event.sessionId]={totalSeconds:event.totalSeconds,basePlaytime:base,at:event.at,startedAt:event.startedAt,final:event.final===true};
  const patch={externalPlaytimeSessions:Object.fromEntries(Object.entries(receipts).sort((a,b)=>a[1].at-b[1].at).slice(-64)),
    // Anchored totals reconcile an absolute Steam import without adding its
    // already-observed minutes again at the next external checkpoint.
    playtime:Math.max(Number(game.playtime)||0,base+event.totalSeconds/60)};
  if(delta>0){patch.lastPlayedAt=Math.max(Number(game.lastPlayedAt)||0,event.at);patch.playtimeDays=recordPlaytimeDays(game.playtimeDays,delta,event.at);}
  return {patch,shouldPromptRating:event.final===true&&!previous?.final&&sessionResult(game,event.totalSeconds,event.at).shouldPromptRating};
}
export function applyExternalSession(library,event) {
  const game=(library.games||[]).find(item=>String(item.id)===String(event?.gameId));
  const result=externalSessionResult(game,event);if(!result.patch)return library;
  return {...library,games:library.games.map(item=>item===game?{...item,...result.patch}:item)};
}
