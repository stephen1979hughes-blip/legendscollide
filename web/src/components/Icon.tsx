import React from 'react';

/**
 * The app's icon set. Replaces the emoji that used to stand in for icons —
 * emoji sit off the baseline, change shape per operating system, and cannot
 * take the surrounding text colour.
 *
 * Every glyph is drawn on a 24x24 grid, strokes only unless a solid shape
 * carries meaning (the ball, a booking). They inherit `currentColor` and size
 * from the `size` prop, so an icon in a button matches that button's text.
 */
export type IconName =
  | 'ball' | 'boot' | 'whistle' | 'card' | 'sub' | 'save'
  | 'check' | 'cross' | 'star' | 'trophy' | 'token' | 'gift'
  | 'lock' | 'unlock' | 'bolt' | 'sparkle' | 'chart' | 'map'
  | 'menu' | 'close' | 'left' | 'right' | 'share' | 'list'
  | 'cards' | 'swords' | 'play' | 'pause' | 'reset' | 'people'
  | 'globe' | 'download' | 'upload' | 'disk' | 'search' | 'plus';

interface IconProps {
  name: IconName;
  /** Pixel size; defaults to 1em so an icon tracks its button's font size. */
  size?: number | string;
  className?: string;
  /** Set when the icon is the only content of a control. */
  title?: string;
}

const P: Record<IconName, React.ReactNode> = {
  ball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.4l3.9 2.8-1.5 4.6H9.6L8.1 9.2z" fill="currentColor" stroke="none" />
      <path d="M12 3v3.4M4.3 9.4l3.8-.2M19.7 9.4l-3.8-.2M7.2 19.6l2.4-5.8M16.8 19.6l-2.4-5.8" />
    </>
  ),
  boot: <path d="M4 5v9a2 2 0 002 2h11.5a3 3 0 002.9-2.2l.2-.8-8-3.2V5z" />,
  whistle: (
    <>
      <path d="M3 10.5A2.5 2.5 0 015.5 8H13l7-3v10.5a3.5 3.5 0 01-3.5 3.5h-8A5.5 5.5 0 013 13.5z" />
      <circle cx="8.5" cy="13" r="1.6" />
    </>
  ),
  card: <rect x="7" y="3" width="10" height="18" rx="1.5" fill="currentColor" stroke="none" />,
  sub: <path d="M4 8h11l-3-3M20 16H9l3 3" />,
  save: (
    <>
      <path d="M6 20c-1.5-2.5-2-5-1.4-7.4C5.4 9 8 6.5 11.6 6.5c3.6 0 6.2 2.5 7 6.1.6 2.4.1 4.9-1.4 7.4" />
      <path d="M9 13.5v3M12 12.5v4M15 13.5v3" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5 10-11" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  star: <path d="M12 3.5l2.6 5.6 6 .8-4.4 4.3 1.1 6.1L12 17.4l-5.3 2.9 1.1-6.1L3.4 9.9l6-.8z" />,
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 01-10 0z" />
      <path d="M7 5.5H4.5V7A3 3 0 007.6 10M17 5.5h2.5V7a3 3 0 01-3.1 3" />
      <path d="M12 14v3M8.5 20h7l-.7-3h-5.6z" />
    </>
  ),
  token: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="10" width="17" height="10.5" rx="1.5" />
      <path d="M2.5 6.5h19V10h-19zM12 6.5v14" />
      <path d="M12 6.5S10.6 3 8.6 3a2 2 0 000 3.5zM12 6.5S13.4 3 15.4 3a2 2 0 010 3.5z" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 018 0v3" />
    </>
  ),
  unlock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 017.7-1.5" />
    </>
  ),
  bolt: <path d="M13.5 2.5L5 13.5h5.5l-.8 8L18.5 10H13z" />,
  sparkle: (
    <>
      <path d="M11 3.5l1.8 4.7L17.5 10l-4.7 1.8L11 16.5 9.2 11.8 4.5 10l4.7-1.8z" />
      <path d="M18 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </>
  ),
  chart: <path d="M4 20V4M4 20h16M8 20v-6M12.5 20V8.5M17 20v-9" />,
  map: <path d="M3.5 6.5l5.5-2.5 6 2.5 5.5-2.5v13l-5.5 2.5-6-2.5-5.5 2.5zM9 4v13M15 6.5v13" />,
  menu: <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  left: <path d="M20 12H4.5M11 5.5L4.5 12l6.5 6.5" />,
  right: <path d="M4 12h15.5M13 5.5l6.5 6.5-6.5 6.5" />,
  share: <path d="M12 15.5V3.5M8 7l4-3.5L16 7M5 13.5v5A2 2 0 007 20.5h10a2 2 0 002-2v-5" />,
  list: <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12M3.5 6.5h.01M3.5 12h.01M3.5 17.5h.01" />,
  cards: (
    <>
      <rect x="3" y="6.5" width="11" height="14.5" rx="1.8" />
      <path d="M7.5 4.2l8.6-1.5a1.8 1.8 0 012.1 1.5l2 11.3a1.8 1.8 0 01-1.5 2.1l-1.2.2" />
    </>
  ),
  swords: <path d="M3.5 3.5h3.5l9 9-3.5 3.5-9-9zM20.5 3.5H17l-4.4 4.4M8.7 12.3L4 17v3.5h3.5l4.7-4.7M15 15l5.5 5.5" />,
  play: <path d="M7 4.5l12 7.5-12 7.5z" />,
  pause: <path d="M8.5 4.5v15M15.5 4.5v15" />,
  reset: <path d="M4 12a8 8 0 108-8 8 8 0 00-5.7 2.4L4 8.6M4 4v4.6h4.6" />,
  people: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20.5a6.5 6.5 0 0113 0" />
      <path d="M16 5a3.5 3.5 0 010 6.6M17.5 14.6a6.5 6.5 0 014 5.9" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.3 2.5 3.5 5.4 3.5 8.5s-1.2 6-3.5 8.5c-2.3-2.5-3.5-5.4-3.5-8.5S9.7 6 12 3.5z" />
    </>
  ),
  download: <path d="M12 3.5v12M8 11.5l4 4 4-4M4.5 19.5h15" />,
  upload: <path d="M12 20.5v-12M8 12.5l4-4 4 4M4.5 4.5h15" />,
  disk: (
    <>
      <path d="M4.5 3.5h12L20.5 7.5v13h-16z" />
      <path d="M8 3.5v6h8v-6M8 20.5v-6h8v6" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5l5 5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
};

export const Icon: React.FC<IconProps> = ({ name, size = '1em', className, title }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
    aria-label={title}
    focusable="false"
  >
    {title && <title>{title}</title>}
    {P[name]}
  </svg>
);
