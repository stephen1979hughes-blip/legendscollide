import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Icon } from './Icon';
import { SHELL_WIDTH, ShellWidth } from './PageShell';

interface HeaderProps {
  showBack?: boolean;
  rightButton?: { label: string; onClick: () => void };
  /** Handed down by PageShell so the logo lines up with the page content. */
  width?: ShellWidth;
}

const MENU_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Daily', path: '/daily' },
  { label: 'Campaign', path: '/campaign' },
  { label: 'My collection', path: '/collection' },
  { label: 'Trivia', path: '/trivia' },
  { label: 'Teams', path: '/teams' },
  { label: 'Rankings', path: '/rankings' },
  { label: 'Custom XI', path: '/custom-xi' },
  { label: 'Saved XIs', path: '/saved-xis' },
];

export const Header: React.FC<HeaderProps> = ({ showBack, rightButton, width = 'default' }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape — the old dropdown did neither, so it
  // stayed open behind whatever you clicked next.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ground/85 backdrop-blur">
      <div className={`${SHELL_WIDTH[width]} flex items-center justify-between gap-4 py-3`}>
        <Link
          to="/"
          className="flex-shrink-0 rounded-ctl transition-opacity duration-150 hover:opacity-75"
        >
          {/*
            The shield PNG is matted on solid black, which shows as a visible
            box against the #0B0D10 ground. `screen` drops pure black to the
            backdrop and leaves everything lighter untouched, so the mark sits
            on the bar instead of in a rectangle.
          */}
          <img
            src="/images/logo-shield.png"
            alt="Legends Collide"
            className="h-10 w-auto mix-blend-screen md:h-11"
          />
        </Link>

        <nav className="flex items-center gap-1">
          {showBack && (
            <button onClick={() => navigate(-1)} className="btn-ghost btn-sm">
              <Icon name="left" />
              Back
            </button>
          )}

          {rightButton && (
            <button onClick={rightButton.onClick} className="btn-ghost btn-sm">
              {rightButton.label}
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen(!open)}
              className="btn-ghost btn-sm"
              aria-expanded={open}
              aria-haspopup="menu"
            >
              <Icon name={open ? 'close' : 'menu'} />
              Menu
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-52 animate-fadeIn overflow-hidden rounded-card border border-line bg-surface p-1 shadow-pop"
              >
                {MENU_ITEMS.map((item) => {
                  const active = pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      role="menuitem"
                      onClick={() => go(item.path)}
                      className={`flex w-full items-center justify-between rounded-ctl px-3 py-2 text-left font-heading text-sm font-medium transition-colors duration-150 ${
                        active ? 'bg-raised text-accent' : 'text-ink-2 hover:bg-raised hover:text-ink'
                      }`}
                    >
                      {item.label}
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
