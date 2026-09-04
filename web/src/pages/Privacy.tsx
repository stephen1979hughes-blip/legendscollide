import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
      <Header showBack />
      <main className="flex-1 max-w-screen-md mx-auto px-4 py-12 w-full space-y-6 text-white/80">
        <h1 className="text-white text-4xl font-black tracking-tight">Privacy</h1>

        <section className="space-y-2">
          <h2 className="text-white text-xl font-bold">No accounts, no server-side storage</h2>
          <p>
            There's no login and no backend. The app is a static site — team data ships with it, and
            every match is simulated in your browser. Nothing you do here is sent to or stored on a
            server.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white text-xl font-bold">What's stored locally</h2>
          <p>
            Custom XIs you build, and (once the daily fixture ships) your prediction streak, are saved
            in your browser's <code className="text-white/60">localStorage</code>. That data stays on
            your device — it's never transmitted anywhere, and clearing your browser data clears it.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white text-xl font-bold">Analytics</h2>
          <p>
            This site uses Cloudflare Web Analytics, which is cookieless and doesn't track you across
            sites or build a profile of you. It reports aggregate page-view counts only — that's why
            there's no cookie-consent banner here.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white text-xl font-bold">Questions</h2>
          <p>
            Open an issue on{' '}
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
        </section>
      </main>
      <Footer />
    </div>
  );
};
