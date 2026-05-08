const ADMIN_BASE_URL = 'http://localhost:3000/api/admin';

export const adminApi = {
  // Get all data
  async getData() {
    const response = await fetch(`${ADMIN_BASE_URL}/data`);
    if (!response.ok) throw new Error('Failed to load admin data');
    return response.json();
  },

  // ========== PLAYER OPERATIONS ==========

  async createPlayer(player: any) {
const response = await fetch(`${ADMIN_BASE_URL}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create player');
    }
    return response.json();
  },

  async updatePlayer(id: string, player: any) {
    const response = await fetch(`${ADMIN_BASE_URL}/players/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update player');
    }
    return response.json();
  },

  async deletePlayer(id: string) {
    const response = await fetch(`${ADMIN_BASE_URL}/players/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete player');
    }
  },

  // ========== CLUB OPERATIONS ==========

  async createClub(club: any) {
    const response = await fetch(`${ADMIN_BASE_URL}/clubs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(club)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create club');
    }
    return response.json();
  },

  async updateClub(id: string, club: any) {
    const response = await fetch(`${ADMIN_BASE_URL}/clubs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(club)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update club');
    }
    return response.json();
  },

  async deleteClub(id: string) {
    const response = await fetch(`${ADMIN_BASE_URL}/clubs/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete club');
    }
  },

  // ========== COUNTRY OPERATIONS ==========

  async createCountry(country: any) {
    const response = await fetch(`${ADMIN_BASE_URL}/countries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(country)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create country');
    }
    return response.json();
  },

  async updateCountry(id: string, country: any) {
    const response = await fetch(`${ADMIN_BASE_URL}/countries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(country)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update country');
    }
    return response.json();
  },

  async deleteCountry(id: string) {
    const response = await fetch(`${ADMIN_BASE_URL}/countries/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete country');
    }
  },

  // ========== CLASSIC TEAM OPERATIONS ==========

  async createClassicTeam(team: any) {
    const response = await fetch(`${ADMIN_BASE_URL}/classic-teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create classic team');
    }
    return response.json();
  },

  async updateClassicTeam(id: string, team: any) {
    const response = await fetch(`${ADMIN_BASE_URL}/classic-teams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update classic team');
    }
    return response.json();
  },

  async deleteClassicTeam(id: string) {
    const response = await fetch(`${ADMIN_BASE_URL}/classic-teams/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete classic team');
    }
  },

  // ========== VALIDATION & EXPORT ==========

  async validate() {
    const response = await fetch(`${ADMIN_BASE_URL}/validate`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to validate data');
    return response.json();
  },

  async exportData() {
    const response = await fetch(`${ADMIN_BASE_URL}/export`);
    if (!response.ok) throw new Error('Failed to export data');
    return response.json();
  },

  async importData(data: any) {
    const response = await fetch(`${ADMIN_BASE_URL}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to import data');
    }
    return response.json();
  }
};
