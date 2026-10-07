import alpine from '../../assets/lounge/scene-alpine-horizon.png';
import orbit from '../../assets/lounge/scene-orbit-blue.png';
import coast from '../../assets/lounge/scene-sunlit-coast.png';
import neon from '../../assets/lounge/scene-neon-gallery.jpg';
import starlit from '../../assets/lounge/scene-starlit-road.jpg';
import solar from '../../assets/lounge/scene-solar-grove.png';
import rainlight from '../../assets/lounge/scene-rainlight-city.png';
import steampunk from '../../assets/lounge/scene-steampunk.png';
import animeWinter from '../../assets/lounge/scene-anime-winter.png';
import moonlitArcana from '../../themes/stock/moonlit-arcana/assets/scene.jpg';
import cosmicCitadel from '../../themes/stock/cosmic-citadel/assets/scene.jpg';

export const LOUNGE_SCENE_ART = Object.freeze({ alpine, orbit, coast, neon, starlit, solar, rainlight, steampunk, 'anime-winter': animeWinter, 'moonlit-arcana': moonlitArcana, 'cosmic-citadel': cosmicCitadel });

export function loungeSceneArt(id) {
  return LOUNGE_SCENE_ART[id] || '';
}
