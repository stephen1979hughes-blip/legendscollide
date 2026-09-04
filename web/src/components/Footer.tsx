import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-black/40 backdrop-blur text-white/70 py-8 px-4 mt-16">
      <div className="max-w-screen-lg mx-auto">
        <div className="text-center space-y-2">
          <p className="text-white font-semibold text-sm">
            Legends Collide — Football's Greatest Teams, One Pitch
          </p>
          <p className="text-white/60 text-xs leading-relaxed max-w-2xl mx-auto">
            Player ratings and team rosters are curated for simulation purposes only. Not affiliated with FIFA, UEFA, or any football body.
          </p>
        </div>
        <div className="border-t border-white/5 my-6"></div>
        <div className="flex flex-col md:flex-row items-center justify-between text-xs space-y-4 md:space-y-0">
          <p className="text-white/60">
            © {new Date().getFullYear()} Legends Collide. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-white/60">
            <Link to="/about" className="hover:text-white transition-colors duration-200">About</Link>
            <span className="text-white/20">•</span>
            <a
              href="https://github.com/stephen1979hughes-blip/legendscollide"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors duration-200"
            >
              Contact
            </a>
            <span className="text-white/20">•</span>
            <Link to="/privacy" className="hover:text-white transition-colors duration-200">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
