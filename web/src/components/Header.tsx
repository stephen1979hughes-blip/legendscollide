import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface HeaderProps {
  showBack?: boolean;
  rightButton?: { label: string; onClick: () => void };
}

export const Header: React.FC<HeaderProps> = ({ showBack, rightButton }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const menuItems = [
    { label: 'HOME', path: '/' },
    { label: 'TEAMS', path: '/teams' },
    { label: 'RANKINGS', path: '/rankings' },
    { label: 'CUSTOM XI', path: '/custom-xi' },
    { label: 'SAVED XIS', path: '/saved-xis' }
  ];

  const handleMenuClick = (path: string) => {
    navigate(path);
    setDropdownOpen(false);
  };

  return (
    <header className="bg-black/80 backdrop-blur text-white border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-screen-lg mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="hover:opacity-80 transition-opacity duration-200 flex-shrink-0">
          <img
            src="/images/logo-shield.png"
            alt="Legends Collide"
            className="h-12 md:h-14 w-auto"
          />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2 md:gap-6">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="text-white/70 hover:text-white transition-colors duration-200 font-semibold text-xs md:text-sm uppercase tracking-wide whitespace-nowrap"
            >
              ← Back
            </button>
          )}

          {/* Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="text-white/70 hover:text-white transition-colors duration-200 font-semibold text-xs md:text-sm uppercase tracking-wide px-3 py-2"
            >
              ☰ MENU
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-black/95 border border-white/20 rounded-lg shadow-lg z-50">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleMenuClick(item.path)}
                    className="w-full text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200 font-semibold text-sm uppercase tracking-wide border-b border-white/10 last:border-b-0"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {rightButton && (
            <button
              onClick={rightButton.onClick}
              className="text-white/70 hover:text-white transition-colors duration-200 font-semibold text-xs md:text-sm uppercase tracking-wide whitespace-nowrap"
            >
              {rightButton.label}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};