const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoundedArray, isBoundedString, isJsonObjectWithin, isPlainObject } = require('./contract-guards.cjs');

const validApiKey = value => isBoundedString(value, { max: 4096 });
const validModel = value => isBoundedString(value, { max: 200 });
const validHistory = history => history == null || isBoundedArray(history, 16, entry => isPlainObject(entry)
  && (entry.role == null || entry.role === 'user' || entry.role === 'assistant')
  && isBoundedString(entry.text, { required: true, max: 1600 }));
const isErrorResult = result => isPlainObject(result) && result.ok === false
  && isBoundedString(result.error, { required: true, max: 4000 });
const isModel = value => isBoundedString(value, { required: true, max: 200 });

function registerGeminiIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerGeminiIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("gemini:assistant", guardResult(guardHandler(
    requireService(services, "gemini:assistant"),
    payload => isPlainObject(payload)
      && validApiKey(payload.apiKey)
      && isBoundedString(payload.message, { max: 1800 })
      && validModel(payload.model)
      && validHistory(payload.history)
      && isBoundedString(payload.libraryContext, { max: 24000 }),
    invalidRequest('The Fungist AI request was malformed.'),
  ), result => isErrorResult(result) || (isPlainObject(result) && result.ok === true
    && isModel(result.model) && isBoundedString(result.text, { required: true, max: 4000 })),
  invalidResponse('Fungist AI returned an invalid result.')));
  registerIpc("gemini:test", guardResult(guardHandler(
    requireService(services, "gemini:test"),
    payload => isPlainObject(payload) && validApiKey(payload.apiKey) && validModel(payload.model),
    invalidRequest('The Gemini connection-test request was malformed.'),
  ), result => isErrorResult(result) || (isPlainObject(result) && result.ok === true
    && isModel(result.model) && isBoundedString(result.name, { required: true, max: 500 })),
  invalidResponse('The Gemini connection test returned an invalid result.')));
  registerIpc("gemini:metadata", guardResult(guardHandler(
    requireService(services, "gemini:metadata"),
    payload => isPlainObject(payload)
      && validApiKey(payload.apiKey)
      && isBoundedString(payload.query, { required: true, max: 500 })
      && validModel(payload.model),
    invalidRequest('The Gemini metadata request was malformed.'),
  ), result => isErrorResult(result) || (isPlainObject(result) && result.ok === true
    && isModel(result.model)
    && isJsonObjectWithin(result.metadata, { maxDepth: 10, maxEntries: 1000, maxString: 50000 })
    && isBoundedString(result.metadata.name, { required: true, max: 500 })),
  invalidResponse('Gemini metadata returned an invalid result.')));
}

module.exports = { registerGeminiIpc };
