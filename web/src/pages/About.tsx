import React from 'react';
import { PageShell, PageHeading } from '../components/PageShell';

export const About: React.FC = () => (
  <PageShell width="narrow" showBack>
    <PageHeading eyebrow="Legends Collide" title="About" />

    <div className="space-y-4 text-[15px] leading-relaxed text-ink-2">
      <p>
        Legends Collide is a football match simulator. Pick two classic teams from across football
        history — Manchester United '68, Brazil '70, the Class of '92, Barcelona's tiki-taka side —
        and watch a deterministic engine simulate the match minute by minute as a live broadcast,
        complete with commentary, goals, and a full match report.
      </p>
      <p>
        Every match is seeded: the same two teams and the same seed always produce the exact same
        result, down to the scorers and the commentary. That's what makes a match shareable — a
        permalink doesn't store anything, it just replays the same deterministic simulation.
      </p>
      <p>
        Player ratings and team rosters are curated for simulation purposes only. This project isn't
        affiliated with FIFA, UEFA, or any football body.
      </p>
      <p>
        The source is public on{' '}
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
    </div>
  </PageShell>
);
