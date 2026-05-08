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
    <header className="bg-primary text-white border-b-4 border-secondary" style={{boxShadow: '0 6px 0px rgba(0, 0, 0, 0.2)'}}>
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="hover:opacity-80 transition">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-retro.svg"
              alt="Legends Collide"
              className="h-20 w-20"
            />
            <div className="hidden sm:block">
              <h1 className="text-white font-heading text-2xl font-black tracking-wider">LEGENDS COLLIDE</h1>
              <p className="text-secondary text-xs tracking-widest uppercase font-bold">Football Simulator</p>
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-8">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="text-secondary hover:text-white transition font-bold font-heading text-sm uppercase tracking-wide"
              style={{textShadow: '0 0 3px white, 0 0 6px white, -1px -1px 1px white, 1px -1px 1px white, -1px 1px 1px white, 1px 1px 1px white'}}
            >
              ← Back
            </button>
          )}

          <Link to="/" className="text-secondary hover:text-white transition font-bold font-heading text-sm uppercase tracking-wide" style={{textShadow: '0 0 3px white, 0 0 6px white, -1px -1px 1px white, 1px -1px 1px white, -1px 1px 1px white, 1px 1px 1px white'}}>
            Home
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-secondary hover:text-white transition font-bold font-heading text-sm uppercase tracking-wide flex items-center gap-2"
              style={{textShadow: '0 0 3px white, 0 0 6px white, -1px -1px 1px white, 1px -1px 1px white, -1px 1px 1px white, 1px 1px 1px white'}}
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
              <div className="absolute right-0 mt-2 w-48 bg-white text-black border-4 border-primary z-50" style={{boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.2)'}}>
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleTeamSelect(team.id)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-100 transition border-b border-primary last:border-b-0 font-body"
                  >
                    <p className="font-bold text-primary">{team.name}</p>
                    <p className="text-xs text-gray-600">{team.year}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {rightButton && (
            <button
              onClick={rightButton.onClick}
              className="text-secondary hover:text-white transition font-bold font-heading text-sm uppercase tracking-wide"
              style={{textShadow: '0 0 3px white, 0 0 6px white, -1px -1px 1px white, 1px -1px 1px white, -1px 1px 1px white, 1px 1px 1px white'}}
            >
              {rightButton.label}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};