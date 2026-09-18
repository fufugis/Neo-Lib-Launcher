function registerSystemIpc({ registerIpc, systemHealth }) {
  if (typeof registerIpc !== 'function' || typeof systemHealth?.read !== 'function') {
    throw new TypeError('registerSystemIpc requires registerIpc and systemHealth.');
  }
  registerIpc('system:health', guardResult(() => systemHealth.read(), result => isPlainObject(result)
    && isNumberBetween(result.cpuPercent, 0, 100)
    && isNumberBetween(result.ramPercent, 0, 100)
    && isNumberBetween(result.memoryUsedGb, 0, Number.MAX_SAFE_INTEGER, { required: true })
    && isNumberBetween(result.memoryFreeGb, 0, Number.MAX_SAFE_INTEGER, { required: true })
    && isNumberBetween(result.memoryTotalGb, 0, Number.MAX_SAFE_INTEGER, { required: true }),
  { cpuPercent: null, ramPercent: null, memoryUsedGb: 0, memoryFreeGb: 0, memoryTotalGb: 0, code: 'INVALID_RESPONSE' }));
}

module.exports = { registerSystemIpc };
const { guardResult, isNumberBetween, isPlainObject } = require('./contract-guards.cjs');
