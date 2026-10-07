const { guardHandler, guardResult, invalidRequest, invalidResponse, isPlainObject } = require('./contract-guards.cjs');
const source = value => ['screenscraper', 'romm'].includes(value);
const id = value => typeof value === 'string' && /^\d{1,12}$/.test(value) && Number(value) > 0;
const string = (value, max, optional = false) => (optional && value === undefined) || (typeof value === 'string' && value.length <= max && !/[\x00]/.test(value));
const object = value => isPlainObject(value);
const jsonBound = value => { try { return object(value) && typeof value.ok === 'boolean' && Buffer.byteLength(JSON.stringify(value)) <= 8 * 1024 * 1024; } catch { return false; } };
function registerRetroSourcesIpc({ registerIpc, retro }) {
  const guard = (handler, validate) => guardResult(guardHandler(handler, validate, invalidRequest('Invalid retro-source request.')), jsonBound, invalidResponse('Retro source did not return a safe result.'));
  registerIpc('retro-sources:status', guard(() => retro.status(), value => value === undefined));
  registerIpc('retro-sources:configure', guard((_event, value) => retro.configure(value), value => object(value) && source(value.source) && (value.forget === true || (object(value.values) && Object.keys(value.values).length <= 8 && Object.entries(value.values).every(([key, entry]) => ['developerId','developerPassword','username','password','region','language','url','token'].includes(key) ? string(entry, 4096) : key === 'allowInsecure' && typeof entry === 'boolean')))));
  registerIpc('retro-sources:platforms', guard((_event, value) => retro.platforms(value.source), value => object(value) && source(value.source)));
  registerIpc('retro-sources:search', guard((_event, value) => retro.search(value), value => object(value) && source(value.source) && string(value.query, 160, true) && (value.systemId === undefined || value.systemId === '' || id(value.systemId)) && (value.offset === undefined || Number.isSafeInteger(value.offset) && value.offset >= 0 && value.offset <= 100000)));
  registerIpc('retro-sources:details', guard((_event, value) => retro.details(value), value => object(value) && source(value.source) && id(value.id) && (value.slot === undefined || ['all','cover','icon','logo','hero','background'].includes(value.slot))));
  registerIpc('retro-sources:identify', guard((_event, value) => retro.identify(value), value => object(value) && string(value.gameId, 160) && id(value.systemId) && typeof value.consent === 'boolean'));
  registerIpc('retro-sources:gamelist', guard((event, value) => retro.gamelist(event, value), value => object(value) && string(value.profileId, 64) && value.profileId.length > 0));
  registerIpc('retro-sources:prepareGamelist', guard((_event, value) => retro.prepareGamelist(value), value => object(value) && string(value.profileId, 64) && object(value.paths) && Object.keys(value.paths).length <= 2 && Object.entries(value.paths).every(([role, file]) => ['image','logo'].includes(role) && string(file, 32767))));
  registerIpc('retro-sources:download', guard((_event, value) => retro.download(value), value => object(value) && id(value.id) && id(value.systemId) && Number.isSafeInteger(value.revision) && value.revision >= 0 && typeof value.consent === 'boolean'));
  registerIpc('retro-sources:cancelDownload', guard((_event, value) => retro.cancelDownload(value), value => object(value) && id(value.id)));
  registerIpc('retro-sources:media', guard((_event, value) => retro.media(value), value => object(value) && source(value.source) && id(value.id) && ['manual','video'].includes(value.kind)));
}
module.exports = { registerRetroSourcesIpc };
