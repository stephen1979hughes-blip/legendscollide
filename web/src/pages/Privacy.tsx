import React from 'react';
import { PageShell, PageHeading } from '../components/PageShell';

const SECTIONS = [
  {
    heading: 'No accounts, no server-side storage',
    body: (
      <>
        There's no login and no backend. The app is a static site — team data ships with it, and
        every match is simulated in your browser. Nothing you do here is sent to or stored on a
        server.
      </>
    ),
  },
  {
    heading: "What's stored locally",
    body: (
      <>
        Custom XIs you build, and (once the daily fixture ships) your prediction streak, are saved in
        your browser's{' '}
        <code className="rounded bg-raised px-1.5 py-0.5 text-[13px] text-ink">localStorage</code>.
        That data stays on your device — it's never transmitted anywhere, and clearing your browser
        data clears it.
      </>
    ),
  },
  {
    heading: 'Analytics',
    body: (
      <>
        This site uses Cloudflare Web Analytics, which is cookieless and doesn't track you across
        sites or build a profile of you. It reports aggregate page-view counts only — that's why
        there's no cookie-consent banner here.
      </>
    ),
  },
];

export const Privacy: React.FC = () => (
  <PageShell width="narrow" showBack>
    <PageHeading eyebrow="Legends Collide" title="Privacy" />

    <div className="space-y-section">
      {SECTIONS.map((section) => (
        <section key={section.heading} className="space-y-2">
          <h2 className="text-lg font-semibold md:text-xl">{section.heading}</h2>
          <p className="text-[15px] leading-relaxed text-ink-2">{section.body}</p>
        </section>
      ))}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold md:text-xl">Questions</h2>
        <p className="text-[15px] leading-relaxed text-ink-2">
          Open an issue on{' '}
          <a
            href="https://github.com/stephen1979hughes-blip/legendscollide"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
          >
            GitHub
          </a>
          .
        </p>
      </section>
    </div>
  </PageShell>
);
