import alpine from '../../assets/lounge/scene-alpine-horizon.png';
import orbit from '../../assets/lounge/scene-orbit-blue.png';
import coast from '../../assets/lounge/scene-sunlit-coast.png';

export const LOUNGE_SCENE_ART = Object.freeze({ alpine, orbit, coast });

export function loungeSceneArt(id) {
  return LOUNGE_SCENE_ART[id] || '';
}
