import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * The one layout shell. Every page renders inside it.
 *
 * Before this existed each page picked its own container — nine different
 * `max-w` values across the app, with `px-4` and `px-6` mixed on top — while
 * the header was pinned to a tenth. The result was that the logo and the page
 * heading started at different x-positions on almost every screen. The width
 * lives here now and the header and footer are handed the same one, so they
 * always agree.
 */
export type ShellWidth = 'narrow' | 'default' | 'wide';

/**
 * Full class strings, not composed at runtime — Tailwind only sees literals.
 * narrow: prose. default: most screens. wide: builders and tables.
 */
export const SHELL_WIDTH: Record<ShellWidth, string> = {
  narrow: 'mx-auto w-full max-w-[720px] px-5',
  default: 'mx-auto w-full max-w-[1120px] px-5',
  wide: 'mx-auto w-full max-w-[1400px] px-5',
};

interface PageShellProps {
  children: React.ReactNode;
  width?: ShellWidth;
  showBack?: boolean;
  rightButton?: { label: string; onClick: () => void };
  /** Centres the content block vertically — for loading and error states. */
  centered?: boolean;
  hideFooter?: boolean;
}

export const PageShell: React.FC<PageShellProps> = ({
  children,
  width = 'default',
  showBack,
  rightButton,
  centered,
  hideFooter,
}) => (
  <div className="flex min-h-screen flex-col bg-ground">
    <Header width={width} showBack={showBack} rightButton={rightButton} />

    <main
      className={
        centered
          ? 'flex flex-1 items-center justify-center px-5 py-page'
          : `${SHELL_WIDTH[width]} flex-1 py-10 md:py-14`
      }
    >
      {children}
    </main>

    {!hideFooter && <Footer width={width} />}
  </div>
);

/**
 * Page heading. One treatment, used by every screen, so headings stop being
 * re-invented per page (there were four different h1 treatments).
 */
export const PageHeading: React.FC<{
  title: string;
  eyebrow?: string;
  lede?: string;
  action?: React.ReactNode;
}> = ({ title, eyebrow, lede, action }) => (
  <div className="mb-section flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
    <div className="space-y-1.5">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      {lede && <p className="max-w-[60ch] text-[15px] leading-relaxed text-ink-2">{lede}</p>}
    </div>
    {action}
  </div>
);
