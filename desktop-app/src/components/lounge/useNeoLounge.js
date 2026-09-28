import React from 'react';

// Fullscreen is deliberately session-only: a saved setting never reopens it at startup.
export function useNeoLounge(nativeApi, gameRunning) {
  const [active, setActive] = React.useState(false);
  const preserveForGame = React.useRef(false);
  React.useEffect(() => nativeApi?.onLoungeFullscreenChange?.((fullscreen) => {
    if (!fullscreen) { preserveForGame.current = false; setActive(false); }
  }), [nativeApi]);
  const enter = React.useCallback(async () => {
    if (!nativeApi?.enterLounge) return false;
    try {
      const fullscreen = await nativeApi.enterLounge();
      if (fullscreen === true) setActive(true);
      return fullscreen === true;
    } catch { return false; }
  }, [nativeApi]);
  const exit = React.useCallback(async () => {
    try {
      const exited = await nativeApi?.exitLounge?.();
      if (exited === true) { preserveForGame.current = false; setActive(false); }
      return exited === true;
    } catch { return false; }
  }, [nativeApi]);
  React.useEffect(() => nativeApi?.onWindowVisibility?.(({ visible }) => {
    if (active && visible === false && !gameRunning && !preserveForGame.current) void exit();
  }), [nativeApi, active, gameRunning, exit]);
  return { active, enter, exit,
    preserveGameLaunch: () => { preserveForGame.current = true; },
    cancelGameLaunch: () => { preserveForGame.current = false; },
  };
}
