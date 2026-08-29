import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { customXIStorage } from '../utils/customXIStorage';
import { CustomXI } from '../types/customXI';

export const SavedCustomXIs: React.FC = () => {
  const navigate = useNavigate();
  const [savedXIs, setSavedXIs] = useState<CustomXI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadXIs = async () => {
      try {
        const allXIs = customXIStorage.loadAll();
        setSavedXIs(allXIs);
      } catch (error) {
        console.error('Failed to load saved XIs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadXIs();
  }, []);

  const getAverageRating = (xi: CustomXI): number => {
    if (xi.players.length === 0) return 0;
    const sum = xi.players.reduce((acc, p) => acc + p.overallRating, 0);
    return sum / xi.players.length;
  };

  const handleLoadXI = (xi: CustomXI) => {
    customXIStorage.save(xi);
    navigate('/custom-xi');
  };

  const handleDeleteXI = (xiId: string) => {
    if (window.confirm('Are you sure you want to delete this custom XI?')) {
      customXIStorage.deleteById(xiId);
      setSavedXIs(savedXIs.filter(xi => xi.id !== xiId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
        <Header showBack />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-white/70">Loading custom XIs...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
      <Header showBack />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="mb-12">
          <h1 className="text-5xl font-heading font-bold text-white mb-2">Saved Custom XIs</h1>
          <p className="text-white/70">{savedXIs.length} saved all-time eleven{savedXIs.length !== 1 ? 's' : ''}</p>
        </div>

        {savedXIs.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-12 text-center">
            <p className="text-white/70 mb-6">You haven't created any custom XIs yet.</p>
            <button
              onClick={() => navigate('/custom-xi')}
              className="bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition"
            >
              Create Your First XI
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedXIs.map((xi) => (
              <div
                key={xi.id}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 hover:bg-white/10 transition space-y-4"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white">{xi.clubName}</h2>
                  <p className="text-white/60 text-sm">Formation: {xi.formation}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-white/10">
                  <div>
                    <p className="text-white/60 text-xs mb-1">Players</p>
                    <p className="text-2xl font-bold text-white">{xi.players.length}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs mb-1">Avg Rating</p>
                    <p className="text-2xl font-bold text-white">{getAverageRating(xi).toFixed(1)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-white/60 text-xs font-semibold">Squad</p>
                  <div className="text-xs text-white/70 space-y-1 max-h-32 overflow-y-auto">
                    {xi.players.sort((a, b) => a.slotIndex - b.slotIndex).map((player) => (
                      <div key={player.slotIndex} className="flex justify-between">
                        <span className="truncate">{player.playerName}</span>
                        <span className="ml-2 flex-shrink-0">⭐ {player.overallRating}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleLoadXI(xi)}
                    className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg hover:opacity-90 transition text-sm"
                  >
                    Load XI
                  </button>
                  <button
                    onClick={() => handleDeleteXI(xi.id)}
                    className="flex-1 bg-red-500/20 text-red-400 border border-red-500/50 font-semibold py-2 rounded-lg hover:bg-red-500/30 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
