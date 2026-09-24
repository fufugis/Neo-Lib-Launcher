const { guardHandler, guardResult, isBoolean, isBoundedArray, isBoundedString, isHttpUrl, isIdentifier, isJsonObjectWithin, isPath, isPlainObject } = require('./contract-guards.cjs');

const METADATA_SOURCES = new Set(['steam', 'gog', 'itch', 'dlsite', 'vndb', 'ryuugames', 'f95zone', 'google', 'ai']);
const validSecret = value => isBoundedString(value, { max: 4096 });
const isMetadata = value => value === null || (isJsonObjectWithin(value, { maxDepth: 12, maxEntries: 2000, maxString: 50000 })
  && isBoundedString(value.source, { required: true, max: 100 })
  && isBoundedString(value.name, { required: true, max: 500 }));
const isCandidate = candidate => isJsonObjectWithin(candidate, { maxDepth: 10, maxEntries: 1000, maxString: 50000 })
  && METADATA_SOURCES.has(candidate.source)
  && isIdentifier(candidate.id)
  && isBoundedString(candidate.name, { required: true, max: 500 })
  && isBoundedString(candidate.image, { max: 4096 })
  && isBoundedString(candidate.year, { max: 20 })
  && isBoundedString(candidate.shortDescription, { max: 5000 });
const isCandidateList = result => isPlainObject(result)
  && isBoundedArray(result.candidates, 100, isCandidate)
  && isBoundedString(result.error, { max: 4000 });
const isHint = hint => isPlainObject(hint)
  && isBoundedString(hint.query, { required: true, max: 100 })
  && isBoundedString(hint.evidence, { required: true, max: 500 });
const isArtworkResult = result => isPlainObject(result)
  && isBoolean(result.ok, { required: true })
  && isBoundedString(result.error, { max: 4000 })
  && (result.games == null || isBoundedArray(result.games, 12, game => isPlainObject(game) && isIdentifier(game.id) && isBoundedString(game.name, { required: true, max: 300 }) && isBoolean(game.verified) && isBoundedArray(game.types, 12, type => isBoundedString(type, { required: true, max: 80 }))))
  && (result.assets == null || isBoundedArray(result.assets, 36, asset => isPlainObject(asset) && isIdentifier(asset.id) && isHttpUrl(asset.url) && isHttpUrl(asset.thumb) && isBoundedString(asset.author, { required: true, max: 120 }) && isBoundedString(asset.style, { max: 80 }) && isBoolean(asset.nsfw) && isBoolean(asset.humor)));

function registerMetadataIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerMetadataIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("metadata:auto", guardResult(guardHandler(
    requireService(services, "metadata:auto"),
    payload => isPlainObject(payload)
      && isBoundedString(payload.query, { required: true, max: 500 })
      && (payload.skipSources == null || isBoundedArray(payload.skipSources, 20, source => isBoundedString(source, { required: true, max: 50 })))
      && validSecret(payload.geminiKey)
      && isBoundedString(payload.aiModel, { max: 200 })
      && isIdentifier(payload.lockedAppid, { required: false })
      && isBoundedString(payload.launcher, { max: 200 })
      && isIdentifier(payload.launcherProductId, { required: false })
      && isBoolean(payload.force),
    null,
  ), isMetadata, null));
  registerIpc("metadata:expandCandidate", guardResult(guardHandler(
    requireService(services, "metadata:expandCandidate"),
    payload => isPlainObject(payload)
      && isJsonObjectWithin(payload.candidate, { maxDepth: 10, maxEntries: 1000, maxString: 50000 })
      && METADATA_SOURCES.has(payload.candidate.source),
    null,
  ), isMetadata, null));
  registerIpc("metadata:listCandidates", guardResult(guardHandler(
    requireService(services, "metadata:listCandidates"),
    payload => isPlainObject(payload)
      && METADATA_SOURCES.has(payload.source)
      && isBoundedString(payload.query, { required: true, max: 500 })
      && validSecret(payload.geminiKey)
      && isBoundedString(payload.aiModel, { max: 200 }),
    { candidates: [], error: 'The metadata candidate request was malformed.' },
  ), isCandidateList, { candidates: [], error: 'The metadata candidate service returned an invalid result.', code: 'INVALID_RESPONSE' }));
  registerIpc("metadata:deriveHints", guardResult(guardHandler(
    requireService(services, "metadata:deriveHints"),
    payload => isPlainObject(payload)
      && isPath(payload.exePath, { required: false })
      && isBoundedString(payload.currentName, { max: 500 }),
    { hints: [] },
  ), result => isPlainObject(result) && isBoundedArray(result.hints, 10, isHint), { hints: [], error: 'Metadata hints returned an invalid result.', code: 'INVALID_RESPONSE' }));
  registerIpc('artwork:steamGridDb', guardResult(guardHandler(
    requireService(services, 'artwork:steamGridDb'),
    payload => isPlainObject(payload)
      && validSecret(payload.apiKey)
      && ['search', 'assets'].includes(payload.action)
      && isBoundedString(payload.query, { max: 300 })
      && isIdentifier(payload.gameId, { required: false })
      && isBoundedString(payload.kind, { max: 20 }),
    { ok: false, code: 'INVALID_REQUEST', error: 'The artwork request was malformed.' },
  ), isArtworkResult, { ok: false, code: 'INVALID_RESPONSE', error: 'SteamGridDB returned an invalid artwork response.' }));
}

module.exports = { registerMetadataIpc };
