import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { adminApi } from '../services/adminApi';
import { NormalizedData, ValidationResult, AdminPlayerForm, AdminClubForm, AdminCountryForm, AdminClassicTeamForm } from '../types/admin';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'players' | 'clubs' | 'countries' | 'teams' | 'validation' | 'import-export'>('players');
  const [data, setData] = useState<NormalizedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedData = await adminApi.getData();
      setData(loadedData);
    } catch (err) {
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBack />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted">Loading admin panel...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showBack />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <h1 className="text-4xl font-bold text-primary mb-8">Admin Panel</h1>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto">
          {[
            { id: 'players' as const, label: '👥 Players' },
            { id: 'clubs' as const, label: '⚽ Clubs' },
            { id: 'countries' as const, label: '🌍 Countries' },
            { id: 'teams' as const, label: '🏆 Classic Teams' },
            { id: 'validation' as const, label: '✓ Validate Data' },
            { id: 'import-export' as const, label: '💾 Import/Export' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'border-b-2 border-transparent text-gray-600 hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {data && (
          <div>
            {activeTab === 'players' && (
              <PlayersTab data={data} onRefresh={loadData} onSuccess={(msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }} />
            )}
            {activeTab === 'clubs' && (
              <ClubsTab data={data} onRefresh={loadData} onSuccess={(msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }} />
            )}
            {activeTab === 'countries' && (
              <CountriesTab data={data} onRefresh={loadData} onSuccess={(msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }} />
            )}
            {activeTab === 'teams' && (
              <TeamsTab data={data} onRefresh={loadData} onSuccess={(msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }} />
            )}
            {activeTab === 'validation' && (
              <ValidationTab />
            )}
            {activeTab === 'import-export' && (
              <ImportExportTab onSuccess={(msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }} onRefresh={loadData} />
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

// ========== PLAYERS TAB ==========
const PlayersTab: React.FC<{ data: NormalizedData; onRefresh: () => void; onSuccess: (msg: string) => void }> = ({ data, onRefresh, onSuccess }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdminPlayerForm>({
    id: '',
    name: '',
    position: 'MF',
    overallRating: 75,
    attackRating: 75,
    defenceRating: 75,
    stamina: 85,
    countryId: '',
    clubs: [],
    classicTeams: []
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlayers = data.players.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminApi.updatePlayer(editingId, formData);
        onSuccess('Player updated successfully');
      } else {
        await adminApi.createPlayer(formData);
        onSuccess('Player created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        id: '',
        name: '',
        position: 'MF',
        overallRating: 75,
        attackRating: 75,
        defenceRating: 75,
        stamina: 85,
        countryId: '',
        clubs: [],
        classicTeams: []
      });
      onRefresh();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (player: any) => {
    // Ensure clubs and classicTeams are initialized as arrays
    const playerData = {
      ...player,
      clubs: player.clubs || [],
      classicTeams: player.classicTeams || []
    };
    setFormData(playerData);
    setEditingId(player.id);
    setShowForm(true);
    // Scroll form into view
    setTimeout(() => {
      document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete player ${id}?`)) return;
    try {
      await adminApi.deletePlayer(id);
      onSuccess('Player deleted successfully');
      onRefresh();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 mr-4">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
        >
          {showForm ? 'Cancel' : '+ Add Player'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Player ID"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              disabled={!!editingId}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              required
            />
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="GK">GK</option>
              <option value="DF">DF</option>
              <option value="MF">MF</option>
              <option value="FW">FW</option>
            </select>
            <select
              value={formData.countryId}
              onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Country</option>
              {data.countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Overall Rating"
              value={formData.overallRating}
              onChange={(e) => setFormData({ ...formData, overallRating: parseInt(e.target.value) })}
              min="0"
              max="99"
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="number"
              placeholder="Attack Rating"
              value={formData.attackRating}
              onChange={(e) => setFormData({ ...formData, attackRating: parseInt(e.target.value) })}
              min="0"
              max="99"
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Defence Rating"
              value={formData.defenceRating}
              onChange={(e) => setFormData({ ...formData, defenceRating: parseInt(e.target.value) })}
              min="0"
              max="99"
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Stamina"
              value={formData.stamina}
              onChange={(e) => setFormData({ ...formData, stamina: parseInt(e.target.value) })}
              min="0"
              max="99"
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Clubs Multi-Select */}
          <div className="mt-6 pt-6 border-t">
            <label className="block text-sm font-semibold mb-3">Assign to Clubs</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded p-3 bg-gray-50">
              {data.clubs.length === 0 ? (
                <p className="text-sm text-gray-500">No clubs available</p>
              ) : (
                data.clubs.map(club => (
                  <label key={club.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.clubs || []).includes(club.id)}
                      onChange={(e) => {
                        const currentClubs = formData.clubs || [];
                        let updatedClubs: string[];
                        if (currentClubs.includes(club.id)) {
                          updatedClubs = currentClubs.filter(c => c !== club.id);
                        } else {
                          updatedClubs = [...currentClubs, club.id];
                        }
                        setFormData({ ...formData, clubs: updatedClubs });
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm">{club.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Classic Teams Multi-Select */}
          <div className="mt-4 pt-4 border-t">
            <label className="block text-sm font-semibold mb-3">Assign to Classic Teams</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded p-3 bg-gray-50">
              {data.classicTeams.length === 0 ? (
                <p className="text-sm text-gray-500">No classic teams available</p>
              ) : (
                data.classicTeams.map(team => (
                  <label key={team.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.classicTeams || []).includes(team.id)}
                      onChange={() => {
                        const teams = formData.classicTeams || [];
                        if (teams.includes(team.id)) {
                          setFormData({ ...formData, classicTeams: teams.filter(t => t !== team.id) });
                        } else {
                          setFormData({ ...formData, classicTeams: [...teams, team.id] });
                        }
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm">{team.name} ({team.year})</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <button type="submit" className="w-full px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 mt-6">
            {editingId ? 'Update Player' : 'Create Player'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Position</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Country</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Overall</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map(player => (
              <tr key={player.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm">{player.id}</td>
                <td className="px-6 py-3 text-sm font-semibold">{player.name}</td>
                <td className="px-6 py-3 text-sm">{player.position}</td>
                <td className="px-6 py-3 text-sm">{data.countries.find(c => c.id === player.countryId)?.name || 'N/A'}</td>
                <td className="px-6 py-3 text-sm">⭐ {player.overallRating}</td>
                <td className="px-6 py-3 text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(player)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(player.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredPlayers.length} of {data.players.length} players
      </div>
    </div>
  );
};

// ========== CLUBS TAB ==========
const ClubsTab: React.FC<{ data: NormalizedData; onRefresh: () => void; onSuccess: (msg: string) => void }> = ({ data, onRefresh, onSuccess }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdminClubForm>({
    id: '',
    name: '',
    shortName: '',
    countryId: '',
    roster: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminApi.updateClub(editingId, formData);
        onSuccess('Club updated successfully');
      } else {
        await adminApi.createClub(formData);
        onSuccess('Club created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ id: '', name: '', shortName: '', countryId: '', roster: [] });
      onRefresh();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (club: any) => {
    setFormData(club);
    setEditingId(club.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete club ${id}?`)) return;
    try {
      await adminApi.deleteClub(id);
      onSuccess('Club deleted successfully');
      onRefresh();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const togglePlayer = (playerId: string) => {
    if (formData.roster.includes(playerId)) {
      setFormData({ ...formData, roster: formData.roster.filter(p => p !== playerId) });
    } else {
      setFormData({ ...formData, roster: [...formData.roster, playerId] });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
        >
          {showForm ? 'Cancel' : '+ Add Club'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Club ID"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              disabled={!!editingId}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              required
            />
            <input
              type="text"
              placeholder="Club Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Short Name"
              value={formData.shortName}
              onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <select
              value={formData.countryId}
              onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Country</option>
              {data.countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Select Players for Roster:</h4>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded p-3">
              {data.players.map(player => (
                <label key={player.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roster.includes(player.id)}
                    onChange={() => togglePlayer(player.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{player.name} ({player.position})</span>
                </label>
              ))}
            </div>
            <div className="text-sm text-gray-600 mt-2">{formData.roster.length} players selected</div>
          </div>

          <button type="submit" className="w-full px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
            {editingId ? 'Update Club' : 'Create Club'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.clubs.map(club => (
          <div key={club.id} className="bg-white rounded-lg shadow p-4 space-y-2">
            <h3 className="font-bold text-lg text-primary">{club.name}</h3>
            <p className="text-sm text-gray-600">{club.shortName} • {data.countries.find(c => c.id === club.countryId)?.name}</p>
            <p className="text-sm text-gray-600">Players: {club.roster?.length || 0}</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleEdit(club)}
                className="flex-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(club.id)}
                className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== COUNTRIES TAB ==========
const CountriesTab: React.FC<{ data: NormalizedData; onRefresh: () => void; onSuccess: (msg: string) => void }> = ({ data, onRefresh, onSuccess }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdminCountryForm>({
    id: '',
    name: '',
    code: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminApi.updateCountry(editingId, formData);
        onSuccess('Country updated successfully');
      } else {
        await adminApi.createCountry(formData);
        onSuccess('Country created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ id: '', name: '', code: '' });
      onRefresh();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (country: any) => {
    setFormData(country);
    setEditingId(country.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete country ${id}?`)) return;
    try {
      await adminApi.deleteCountry(id);
      onSuccess('Country deleted successfully');
      onRefresh();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
        >
          {showForm ? 'Cancel' : '+ Add Country'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <input
            type="text"
            placeholder="Country ID"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            disabled={!!editingId}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            required
          />
          <input
            type="text"
            placeholder="Country Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Code (e.g., EN, BR)"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            maxLength={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <button type="submit" className="w-full px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
            {editingId ? 'Update Country' : 'Create Country'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Players</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.countries.map(country => (
              <tr key={country.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm">{country.id}</td>
                <td className="px-6 py-3 text-sm font-semibold">{country.name}</td>
                <td className="px-6 py-3 text-sm">{country.code}</td>
                <td className="px-6 py-3 text-sm">{data.players.filter(p => p.countryId === country.id).length}</td>
                <td className="px-6 py-3 text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(country)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(country.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ========== TEAMS TAB ==========
const TeamsTab: React.FC<{ data: NormalizedData; onRefresh: () => void; onSuccess: (msg: string) => void }> = ({ data, onRefresh, onSuccess }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdminClassicTeamForm>({
    id: '',
    name: '',
    countryId: '',
    year: new Date().getFullYear(),
    season: '',
    description: '',
    players: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminApi.updateClassicTeam(editingId, formData);
        onSuccess('Classic team updated successfully');
      } else {
        await adminApi.createClassicTeam(formData);
        onSuccess('Classic team created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        id: '',
        name: '',
        countryId: '',
        year: new Date().getFullYear(),
        season: '',
        description: '',
        players: []
      });
      onRefresh();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (team: any) => {
    setFormData(team);
    setEditingId(team.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete team ${id}?`)) return;
    try {
      await adminApi.deleteClassicTeam(id);
      onSuccess('Classic team deleted successfully');
      onRefresh();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const addPlayer = () => {
    setFormData({
      ...formData,
      players: [...formData.players, { playerId: '', position: 'MF' }]
    });
  };

  const removePlayer = (index: number) => {
    setFormData({
      ...formData,
      players: formData.players.filter((_, i) => i !== index)
    });
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
        >
          {showForm ? 'Cancel' : '+ Add Classic Team'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Team ID"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              disabled={!!editingId}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              required
            />
            <input
              type="text"
              placeholder="Team Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <select
              value={formData.countryId}
              onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Country</option>
              {data.countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Season (optional)"
              value={formData.season}
              onChange={(e) => setFormData({ ...formData, season: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg col-span-2"
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg col-span-2"
              rows={2}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">Team Roster (11 Players):</h4>
              <button type="button" onClick={addPlayer} className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                + Add Player
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {formData.players.map((tp, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={tp.playerId}
                    onChange={(e) => {
                      const newPlayers = [...formData.players];
                      newPlayers[idx].playerId = e.target.value;
                      setFormData({ ...formData, players: newPlayers });
                    }}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Select Player</option>
                    {data.players.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                    ))}
                  </select>
                  <select
                    value={tp.position}
                    onChange={(e) => {
                      const newPlayers = [...formData.players];
                      newPlayers[idx].position = e.target.value;
                      setFormData({ ...formData, players: newPlayers });
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm w-24"
                  >
                    <option value="GK">GK</option>
                    <option value="DF">DF</option>
                    <option value="MF">MF</option>
                    <option value="FW">FW</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removePlayer(idx)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600 mt-2">{formData.players.length}/11 players</div>
          </div>

          <button type="submit" className="w-full px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
            {editingId ? 'Update Team' : 'Create Team'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {data.classicTeams.map(team => (
          <div key={team.id} className="bg-white rounded-lg shadow p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-primary">{team.name}</h3>
                <p className="text-sm text-gray-600">{team.year} {team.season && `• ${team.season}`}</p>
                {team.description && <p className="text-sm text-gray-700">{team.description}</p>}
              </div>
              <p className="text-sm text-gray-600">{team.players.length} players</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleEdit(team)}
                className="flex-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(team.id)}
                className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== VALIDATION TAB ==========
const ValidationTab: React.FC = () => {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    setLoading(true);
    try {
      const result = await adminApi.validate();
      setValidation(result);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleValidate}
        disabled={loading}
        className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Validating...' : 'Validate Data'}
      </button>

      {validation && (
        <div className="mt-6 space-y-4">
          {validation.valid && validation.warnings.length === 0 && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <p className="text-green-700 font-semibold">✓ All data is valid!</p>
            </div>
          )}

          {!validation.valid && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 space-y-2">
              <p className="text-red-700 font-semibold">✗ {validation.errors.length} validation error(s) found:</p>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx} className="text-red-600 text-sm">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 space-y-2">
              <p className="text-yellow-700 font-semibold">
                ⚠ {validation.warnings.length} thing{validation.warnings.length === 1 ? '' : 's'} worth double-checking:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx} className="text-yellow-700 text-sm">{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ========== IMPORT/EXPORT TAB ==========
const ImportExportTab: React.FC<{ onSuccess: (msg: string) => void; onRefresh: () => void }> = ({ onSuccess, onRefresh }) => {
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      const data = await adminApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'teams-data-normalized.json';
      a.click();
      onSuccess('Data exported successfully');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await adminApi.importData(data);
      onSuccess('Data imported successfully');
      onRefresh();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Invalid JSON file'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-primary mb-4">Export Data</h3>
        <p className="text-gray-600 mb-4">Download the current data as a JSON file</p>
        <button
          onClick={handleExport}
          className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
        >
          📥 Download JSON
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-primary mb-4">Import Data</h3>
        <p className="text-gray-600 mb-4">Upload a JSON file to replace the current data</p>
        <label className="inline-block">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing}
            className="hidden"
          />
          <span className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 cursor-pointer inline-block disabled:opacity-50">
            {importing ? 'Importing...' : '📤 Upload JSON'}
          </span>
        </label>
      </div>
    </div>
  );
};
