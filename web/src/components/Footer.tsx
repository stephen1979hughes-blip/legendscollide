import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-white py-6 px-6 mt-12">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-secondary font-semibold text-sm mb-2" style={{textShadow: '0 0 3px white, 0 0 6px white, -1px -1px 1px white, 1px -1px 1px white, -1px 1px 1px white, 1px 1px 1px white'}}>
          Legends Collide — Football's Greatest Teams, One Pitch
        </p>
        <p className="text-muted text-xs">
          Player ratings and team rosters are curated for simulation purposes only. Not affiliated with FIFA, UEFA or any football body.
        </p>
        <p className="text-muted text-xs mt-3">
          © {new Date().getFullYear()} Legends Collide. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
