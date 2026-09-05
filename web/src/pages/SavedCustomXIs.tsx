import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell, PageHeading } from '../components/PageShell';
import { Icon } from '../components/Icon';
import { customXIStorage } from '../utils/customXIStorage';
import { CustomXI } from '../types/customXI';

export const SavedCustomXIs: React.FC = () => {
  const navigate = useNavigate();
  const [savedXIs, setSavedXIs] = useState<CustomXI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setSavedXIs(customXIStorage.loadAll());
    } catch (error) {
      console.error('Failed to load saved XIs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAverageRating = (xi: CustomXI): number => {
    if (xi.players.length === 0) return 0;
    return xi.players.reduce((acc, p) => acc + p.overallRating, 0) / xi.players.length;
  };

  const handleLoadXI = (xi: CustomXI) => {
    customXIStorage.save(xi);
    navigate('/custom-xi');
  };

  const handleDeleteXI = (xiId: string) => {
    if (window.confirm('Delete this custom XI? This cannot be undone.')) {
      customXIStorage.deleteById(xiId);
      setSavedXIs(savedXIs.filter((xi) => xi.id !== xiId));
    }
  };

  if (loading) {
    return (
      <PageShell showBack centered>
        <p className="text-sm text-ink-3">Loading custom XIs…</p>
      </PageShell>
    );
  }

  return (
    <PageShell showBack>
      <PageHeading
        eyebrow="Your squads"
        title="Saved custom XIs"
        lede={`${savedXIs.length} saved all-time eleven${savedXIs.length !== 1 ? 's' : ''}.`}
        action={
          savedXIs.length > 0 ? (
            <button onClick={() => navigate('/custom-xi')} className="btn-quiet btn-sm">
              <Icon name="plus" />
              New XI
            </button>
          ) : undefined
        }
      />

      {savedXIs.length === 0 ? (
        <div className="panel flex flex-col items-center gap-4 p-12 text-center">
          <p className="text-sm text-ink-2">You haven't created any custom XIs yet.</p>
          <button onClick={() => navigate('/custom-xi')} className="btn-accent">
            <Icon name="sparkle" />
            Create your first XI
          </button>
        </div>
      ) : (
        <div className="grid gap-block sm:grid-cols-2 lg:grid-cols-3">
          {savedXIs.map((xi) => (
            <div key={xi.id} className="card flex flex-col gap-4">
              <div className="space-y-0.5">
                <h2 className="display text-xl">{xi.clubName}</h2>
                <p className="num text-xs text-ink-3">{xi.formation}</p>
              </div>

              <dl className="grid grid-cols-2 gap-2">
                <div className="inset px-3 py-2">
                  <dt className="eyebrow">Players</dt>
                  <dd className="num text-xl font-semibold text-ink">{xi.players.length}</dd>
                </div>
                <div className="inset px-3 py-2">
                  <dt className="eyebrow">Avg rating</dt>
                  <dd className="num text-xl font-semibold text-ink">
                    {getAverageRating(xi).toFixed(1)}
                  </dd>
                </div>
              </dl>

              <div className="space-y-1.5">
                <p className="rule-heading">Squad</p>
                <div className="max-h-36 space-y-0 overflow-y-auto">
                  {[...xi.players]
                    .sort((a, b) => a.slotIndex - b.slotIndex)
                    .map((player) => (
                      <div
                        key={player.slotIndex}
                        className="flex justify-between gap-2 border-b border-line py-1.5 text-xs last:border-b-0"
                      >
                        <span className="truncate text-ink-2">{player.playerName}</span>
                        <span className="num flex-shrink-0 font-semibold text-ink">
                          {player.overallRating}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-auto flex gap-2 border-t border-line pt-4">
                <button onClick={() => handleLoadXI(xi)} className="btn-accent btn-sm flex-1">
                  Load XI
                </button>
                <button
                  onClick={() => handleDeleteXI(xi.id)}
                  className="btn-ghost btn-sm text-danger hover:bg-danger/10 hover:text-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
};
