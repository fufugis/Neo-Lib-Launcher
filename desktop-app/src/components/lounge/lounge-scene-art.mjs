import alpine from '../../assets/lounge/scene-alpine-horizon.png';
import orbit from '../../assets/lounge/scene-orbit-blue.png';
import coast from '../../assets/lounge/scene-sunlit-coast.png';
import neon from '../../assets/lounge/scene-neon-gallery.jpg';
import starlit from '../../assets/lounge/scene-starlit-road.jpg';
import solar from '../../assets/lounge/scene-solar-grove.png';
import rainlight from '../../assets/lounge/scene-rainlight-city.png';

export const LOUNGE_SCENE_ART = Object.freeze({ alpine, orbit, coast, neon, starlit, solar, rainlight });

export function loungeSceneArt(id) {
  return LOUNGE_SCENE_ART[id] || '';
}
