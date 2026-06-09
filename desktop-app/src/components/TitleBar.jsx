import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Square, X, Library } from 'lucide-react';

export default function TitleBar({ onSearch, search, setSearch }) {
  const [maximized, setMaximized] = React.useState(false);

  React.useEffect(() => {
    if (window.api?.onMaximizeChange) window.api.onMaximizeChange(setMaximized);
  }, []);

  return (
    <div
      className="titlebar-drag relative z-50 flex h-11 items-center gap-3 border-b hairline glass px-3"
      data-testid="app-titlebar"
    >
      <div className="flex items-center gap-2">
        <motion.div
          initial={{ rotate: -8, scale: 0.8, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="grid h-6 w-6 place-items-center rounded-md bg-accent/15 text-accent"
        >
          <Library size={14} strokeWidth={2.2} />
        </motion.div>
        <span className="font-display text-[13px] font-semibold tracking-wide">
          GAME<span className="text-accent">·</span>LIBRARY
        </span>
      </div>

      <div className="titlebar-nodrag relative ml-4 flex-1 max-w-md">
        <input
          data-testid="library-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search library…"
          className="w-full h-7 rounded-md bg-panel/60 hairline px-3 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent/60 transition-colors"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 kbd">⌘K</span>
      </div>

      <div className="flex-1" />

      <div className="titlebar-nodrag flex items-center">
        <WinBtn onClick={() => window.api?.minimize()} testid="titlebar-min">
          <Minus size={13} />
        </WinBtn>
        <WinBtn onClick={() => window.api?.toggleMaximize()} testid="titlebar-max">
          <Square size={11} />
        </WinBtn>
        <WinBtn onClick={() => window.api?.close()} testid="titlebar-close" danger>
          <X size={13} />
        </WinBtn>
      </div>
    </div>
  );
}

function WinBtn({ children, onClick, danger, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={
        'grid h-8 w-11 place-items-center text-muted transition-colors ' +
        (danger
          ? 'hover:bg-red-500/80 hover:text-white'
          : 'hover:bg-panel hover:text-ink')
      }
    >
      {children}
    </button>
  );
}
