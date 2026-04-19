import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TeamSummary } from '../types';
import { api } from '../services/api';

interface HeaderProps {
  showBack?: boolean;
  rightButton?: { label: string; onClick: () => void };
}

export const Header: React.FC<HeaderProps> = ({ showBack, rightButton }) => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    api.getTeams().then(setTeams);
  }, []);

  const handleTeamSelect = (teamId: string) => {
    setShowDropdown(false);
    navigate(`/team/${teamId}`);
  };

  return (
    <header className="bg-primary shadow-lg text-white">
      <div className="max-w-6xl mx-auto flex items-end justify-between px-6 py-1">
        {/* Logo */}
        <Link to="/" className="hover:opacity-80 transition">
          <img
            src="/images/logo-clean.png"
            alt="Legends Collide"
            className="h-36 w-auto"
          />
        </Link>

        {/* Navigation */}
        <nav className="flex items-end gap-8">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="text-secondary hover:opacity-80 transition font-semibold"
            >
              ← Back
            </button>
          )}

          <Link to="/" className="hover:text-secondary transition font-semibold">
            Home
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="hover:text-secondary transition font-semibold flex items-center gap-2"
            >
              Teams
              <span
                className={`transform transition-transform ${
                  showDropdown ? 'rotate-180' : ''
                }`}
              >
                ▼
              </span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg z-50">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleTeamSelect(team.id)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition border-b last:border-b-0"
                  >
                    <p className="font-semibold">{team.name}</p>
                    <p className="text-xs text-gray-500">{team.year}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {rightButton && (
            <button
              onClick={rightButton.onClick}
              className="text-secondary hover:opacity-80 transition font-semibold"
            >
              {rightButton.label}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};