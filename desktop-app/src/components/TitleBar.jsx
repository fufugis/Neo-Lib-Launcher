import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Square, X } from 'lucide-react';

export default function TitleBar({ search, setSearch }) {
  return (
    <div
      className="titlebar-drag relative z-50 flex h-11 items-center gap-3 border-b hairline glass px-3"
      data-testid="app-titlebar"
    >
      <Logo />

      <div className="titlebar-nodrag relative ml-4 flex-1 max-w-md">
        <input
          data-testid="library-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search library…"
          className="w-full h-7 rounded-md bg-panel/60 hairline px-3 text-xs placeholder:text-muted/80 focus:outline-none focus:border-accent/70 transition-colors"
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

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        className="relative grid h-7 w-7 place-items-center"
        title="NEO-LIB"
      >
        <img
          src="./app-icon.png"
          alt="NEO-LIB"
          className="h-7 w-7 rounded-md object-cover drop-shadow-[0_0_8px_rgb(var(--accent)/0.55)]"
          draggable={false}
        />
        <span className="pointer-events-none absolute inset-0 rounded-md bg-[rgb(var(--accent)/0.18)] blur-md -z-10" />
      </motion.div>
      <span className="font-display text-[12.5px] font-extrabold tracking-[0.32em] neon-text">
        NEO<span className="text-[rgb(var(--accent-2))] neon-text-cyan">·</span>LIB
      </span>
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
