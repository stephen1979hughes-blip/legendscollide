import React from 'react';
import { Link } from 'react-router-dom';
import { SHELL_WIDTH, ShellWidth } from './PageShell';

export const Footer: React.FC<{ width?: ShellWidth }> = ({ width = 'default' }) => (
  <footer className="mt-page border-t border-line bg-surface/60">
    <div className={`${SHELL_WIDTH[width]} flex flex-col gap-5 py-8`}>
      <div className="space-y-2">
        <p className="font-heading text-sm font-semibold text-ink">
          Legends Collide — Football's Greatest Teams, One Pitch
        </p>
        <p className="max-w-[64ch] text-xs leading-relaxed text-ink-3">
          Player ratings and team rosters are curated for simulation purposes only. Not affiliated
          with FIFA, UEFA, or any football body.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-5 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Legends Collide. All rights reserved.</p>
        <div className="flex items-center gap-5">
          <Link to="/about" className="rounded transition-colors hover:text-ink">About</Link>
          <a
            href="https://github.com/stephen1979hughes-blip/legendscollide"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded transition-colors hover:text-ink"
          >
            Contact
          </a>
          <Link to="/privacy" className="rounded transition-colors hover:text-ink">Privacy</Link>
        </div>
      </div>
    </div>
  </footer>
);
