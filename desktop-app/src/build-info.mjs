const developmentInfo = Object.freeze({
  id: 'development', fingerprint: '', revision: 'working-source', builtAt: '', architecture: 'Development source',
});

export const BUILD_INFO = typeof __NEOLIB_BUILD_INFO__ === 'undefined'
  ? developmentInfo
  : __NEOLIB_BUILD_INFO__;
