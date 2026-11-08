import { primaryLaunchRoute } from '../lib/game-launch-routes-model.mjs';
const local = value => typeof value==='string' && /^(?:[a-z]:[\\/]|\/(?!\/))/i.test(value) ? value : '';
export function gamePathTarget(game) {
  game=game&&typeof game==='object'?game:{};
  const route=primaryLaunchRoute(game.launchRoutes);
  return {id:game.id,filePath:local(game.romPath || (route?.targetType==='uri'?'':route?.target||game.exePath)),folderPath:local(game.installDir || game.installdir || game.workingDirectory),rom:Boolean(game.romPath)};
}
export const sameGamePath = (game, target) => {const current=gamePathTarget(game);return current.filePath===target.filePath&&current.folderPath===target.folderPath;};
export function removeGameEntries(library, ids) {
  const removed=new Set(ids);
  return {...library,games:(library.games||[]).filter(game=>!removed.has(game.id)),gameOrderByCategory:Object.fromEntries(Object.entries(library.gameOrderByCategory||{}).map(([id,order])=>[id,Array.isArray(order)?order.filter(key=>!removed.has(key)):[]]))};
}
export function relocatedGame(game, patch) {
  const previous=gamePathTarget(game);
  const workingDirectory=patch.installDir&&(!game.workingDirectory||game.workingDirectory===previous.folderPath)?patch.installDir:game.workingDirectory;
  return {...game,...patch,workingDirectory,launchRoutes:Array.isArray(game.launchRoutes)?game.launchRoutes.map(route=>!game.romPath&&route.target===previous.filePath?{...route,target:patch.exePath||route.target,workingDirectory:patch.installDir||route.workingDirectory}:route):game.launchRoutes};
}
