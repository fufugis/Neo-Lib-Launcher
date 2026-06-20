import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Square, X, DownloadCloud, MessageCircle } from 'lucide-react';

const DISCORD_INVITE = 'https://discord.gg/spk6QWREk8';

export default function TitleBar({ search, setSearch, currentVersion, updateAvailable, latestVersion, onClickUpdate }) {
  const openDiscord = () => {
    if (typeof window !== 'undefined' && window.api?.openExternal) window.api.openExternal(DISCORD_INVITE);
    else window.open(DISCORD_INVITE, '_blank');
  };
  return (
    <div
      className="titlebar-drag relative z-50 flex h-11 items-center gap-3 border-b hairline glass px-3"
      data-testid="app-titlebar"
    >
      <Logo />

      {/* Current version pill — always visible so users know what they're on */}
      {currentVersion && (
        <span
          data-testid="titlebar-current-version"
          className="titlebar-nodrag inline-flex items-center gap-1 rounded-full hairline px-2 h-5 text-[10px] font-mono text-muted/80 bg-panel/40"
          title={`Current version v${currentVersion}`}
        >
          v{currentVersion}
        </span>
      )}

      {/* Join Discord — submit bugs & suggestions, stay updated */}
      <button
        data-testid="titlebar-discord-btn"
        onClick={openDiscord}
        title="Join the NEO-LIB Discord — submit bugs, suggest features, stay updated"
        className="titlebar-nodrag group inline-flex items-center gap-1.5 rounded-full px-2.5 h-6 text-[10.5px] font-bold transition-all hover:scale-[1.04]"
        style={{
          background: 'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
          color: '#fff',
          boxShadow: '0 0 10px -3px rgba(88,101,242,0.6)',
        }}
      >
        <MessageCircle size={11} className="transition-transform group-hover:rotate-[-6deg]" />
        Discord
      </button>

      <div className="titlebar-nodrag relative ml-2 flex-1 max-w-md">
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

      {/* Update available pill — only shown when GitHub releases reports a newer tag.
          The custom `update-pulse` class keeps it gently blinking so it's hard to miss. */}
      {updateAvailable && (
        <motion.button
          data-testid="titlebar-update-pill"
          onClick={onClickUpdate}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="titlebar-nodrag update-pulse flex items-center gap-1.5 rounded-full px-2.5 h-6 text-[10.5px] font-bold transition-all hover:scale-[1.04]"
          style={{
            background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
            color: 'rgb(var(--surface))',
          }}
          title={`Update available — click to open the v${latestVersion} release on GitHub`}
        >
          <DownloadCloud size={11} />
          v{latestVersion}
        </motion.button>
      )}

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
