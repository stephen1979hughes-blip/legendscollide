import { CustomXI } from '../types/customXI';

const STORAGE_KEY = 'legends_collide_custom_xis';
const ACTIVE_KEY = 'legends_collide_active_xi'; // For backward compatibility - stores currently active XI

export const customXIStorage = {
  // Save a custom XI (adds to collection or updates if ID exists)
  save: (xi: CustomXI): void => {
    try {
      const all = customXIStorage.loadAll();
      const existingIndex = all.findIndex(x => x.id === xi.id);

      if (existingIndex >= 0) {
        all[existingIndex] = xi;
      } else {
        all.push(xi);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      // Also save as active for backward compatibility
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(xi));
    } catch (error) {
      console.error('Failed to save custom XI:', error);
    }
  },

  // Load all custom XIs
  loadAll: (): CustomXI[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load custom XIs:', error);
      return [];
    }
  },

  // Load a specific custom XI by ID
  loadById: (id: string): CustomXI | null => {
    try {
      const all = customXIStorage.loadAll();
      return all.find(x => x.id === id) || null;
    } catch (error) {
      console.error('Failed to load custom XI by ID:', error);
      return null;
    }
  },

  // Load the active/last saved custom XI (for backward compatibility)
  load: (): CustomXI | null => {
    try {
      const data = localStorage.getItem(ACTIVE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load active custom XI:', error);
      return null;
    }
  },

  // Delete a custom XI by ID
  deleteById: (id: string): void => {
    try {
      const all = customXIStorage.loadAll();
      const filtered = all.filter(x => x.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

      // If the deleted XI was the active one, clear it
      const active = customXIStorage.load();
      if (active && active.id === id) {
        localStorage.removeItem(ACTIVE_KEY);
      }
    } catch (error) {
      console.error('Failed to delete custom XI:', error);
    }
  },

  // Clear all custom XIs
  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_KEY);
    } catch (error) {
      console.error('Failed to clear custom XIs:', error);
    }
  },

  // Check if any custom XIs exist
  exists: (): boolean => {
    return customXIStorage.loadAll().length > 0;
  }
};
