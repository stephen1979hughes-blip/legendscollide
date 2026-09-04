import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
      <Header showBack />
      <main className="flex-1 max-w-screen-md mx-auto px-4 py-12 w-full space-y-6 text-white/80">
        <h1 className="text-white text-4xl font-black tracking-tight">About Legends Collide</h1>
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
            className="text-primary hover:underline"
          >
            GitHub
          </a>
          .
        </p>
      </main>
      <Footer />
    </div>
  );
};
