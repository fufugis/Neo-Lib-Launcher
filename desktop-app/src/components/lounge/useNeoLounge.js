import React from 'react';

// Fullscreen is deliberately session-only: a saved setting never reopens it at startup.
export function useNeoLounge(nativeApi, resting) {
  const [active, setActive] = React.useState(false);
  React.useEffect(() => nativeApi?.onLoungeFullscreenChange?.((fullscreen) => {
    if (!fullscreen) setActive(false);
  }), [nativeApi]);
  const enter = React.useCallback(async () => {
    if (resting || !nativeApi?.enterLounge) return false;
    try {
      const fullscreen = await nativeApi.enterLounge();
      if (fullscreen === true) setActive(true);
      return fullscreen === true;
    } catch { return false; }
  }, [nativeApi, resting]);
  const exit = React.useCallback(async () => {
    try {
      const exited = await nativeApi?.exitLounge?.();
      if (exited === true) setActive(false);
      return exited === true;
    } catch { return false; }
  }, [nativeApi]);
  React.useEffect(() => {
    if (active && resting) void exit();
  }, [active, resting, exit]);
  React.useEffect(() => nativeApi?.onWindowVisibility?.(({ visible }) => {
    if (active && visible === false) void exit();
  }), [nativeApi, active, exit]);
  return { active, enter, exit };
}
