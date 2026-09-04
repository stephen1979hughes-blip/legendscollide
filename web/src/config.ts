/**
 * The site's own URL, for anything that needs an absolute link back to
 * itself: share text, permalinks, and the static og:url/og:image baked into
 * index.html at build time (see the %VITE_SITE_URL% placeholders there).
 *
 * Sourced from VITE_SITE_URL so the same value drives both the JS bundle and
 * the HTML template from one place. web/.env.production commits a working
 * default (the expected Cloudflare Pages *.pages.dev URL); override it with
 * a real build-time env var once a custom domain is attached — no code
 * change needed either way.
 */
export const SITE_URL: string = import.meta.env.VITE_SITE_URL ?? 'https://legendscollide.pages.dev';
