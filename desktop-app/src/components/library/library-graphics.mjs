import cyberRings from '../../assets/library-graphics/cyber-rings.webp';
import prismShards from '../../assets/library-graphics/prism-shards.webp';
import liquidChrome from '../../assets/library-graphics/liquid-chrome.webp';
import ringsThumb from '../../assets/library-graphics/cyber-rings-thumb.webp';
import shardsThumb from '../../assets/library-graphics/prism-shards-thumb.webp';
import chromeThumb from '../../assets/library-graphics/liquid-chrome-thumb.webp';
import starTrails from '../../assets/library-graphics/star-trails.webp';
import dragonSketches from '../../assets/library-graphics/dragon-sketches.webp';
import retroDoodles from '../../assets/library-graphics/retro-doodles.webp';
import starsThumb from '../../assets/library-graphics/star-trails-thumb.webp';
import dragonsThumb from '../../assets/library-graphics/dragon-sketches-thumb.webp';
import retroThumb from '../../assets/library-graphics/retro-doodles-thumb.webp';
import carbonWeave from '../../assets/library-graphics/carbon-weave.webp';
import obsidianSlate from '../../assets/library-graphics/obsidian-slate.webp';
import hammeredTitanium from '../../assets/library-graphics/hammered-titanium.webp';
import carbonThumb from '../../assets/library-graphics/carbon-weave-thumb.webp';
import slateThumb from '../../assets/library-graphics/obsidian-slate-thumb.webp';
import titaniumThumb from '../../assets/library-graphics/hammered-titanium-thumb.webp';

export const LIBRARY_GRAPHICS = Object.freeze([
  { id: 'cyber-rings', label: 'Cyber Rings', art: cyberRings, thumbnail: ringsThumb },
  { id: 'prism-shards', label: 'Prism Shards', art: prismShards, thumbnail: shardsThumb },
  { id: 'liquid-chrome', label: 'Liquid Chrome', art: liquidChrome, thumbnail: chromeThumb },
  { id: 'star-trails', label: 'Star Trails', art: starTrails, thumbnail: starsThumb, fullHeight: true },
  { id: 'dragon-sketches', label: 'Dragon Sketches', art: dragonSketches, thumbnail: dragonsThumb, fullHeight: true },
  { id: 'retro-doodles', label: 'Retro Doodles', art: retroDoodles, thumbnail: retroThumb, fullHeight: true },
  { id: 'carbon-weave', label: 'Carbon Weave', art: carbonWeave, thumbnail: carbonThumb, fullHeight: true, material: true },
  { id: 'obsidian-slate', label: 'Obsidian Slate', art: obsidianSlate, thumbnail: slateThumb, fullHeight: true, material: true },
  { id: 'hammered-titanium', label: 'Hammered Titanium', art: hammeredTitanium, thumbnail: titaniumThumb, fullHeight: true, material: true },
]);
export function libraryGraphicStyle(id, preview = false) {
  const graphic = LIBRARY_GRAPHICS.find(item => item.id === id);
  return graphic ? { backgroundImage: `url(${JSON.stringify(preview ? graphic.thumbnail : graphic.art)})`,
    backgroundSize: graphic.fullHeight ? '100% 100%' : preview ? 'cover' : 'auto 100%', backgroundPosition: preview || graphic.fullHeight ? 'center' : 'left center', backgroundRepeat: 'no-repeat' } : null;
}
export const LIBRARY_GRAPHIC_PATTERNS = Object.fromEntries(LIBRARY_GRAPHICS.map(item => [item.id, libraryGraphicStyle(item.id)]));
