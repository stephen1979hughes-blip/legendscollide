import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-white py-6 px-6 mt-12">
      <div className="max-w-4xl mx-auto flex justify-center gap-8">
        <a href="#about" className="hover:text-secondary transition">
          About
        </a>
        <a href="#legal" className="hover:text-secondary transition">
          Legal
        </a>
        <a href="#contact" className="hover:text-secondary transition">
          Contact
        </a>
      </div>
      <p className="text-center text-muted text-sm mt-4">
        © 2026 Legends Collide. All rights reserved.
      </p>
    </footer>
  );
};
