/**
 * useLocation Hook
 * Custom hook for managing state and city selection
 */

import { useState, useEffect, useCallback } from 'react';
import { locationService, State, City } from '@/services/location.service';

export interface UseLocationOptions {
  initialStateId?: string;
  initialCityId?: string;
  enableSearch?: boolean;
}

export interface UseLocationReturn {
  // States
  states: State[];
  cities: City[];
  selectedState: State | null;
  selectedCity: City | null;
  loading: boolean;
  error: string | null;

  // Actions
  setSelectedState: (stateId: string | null) => void;
  setSelectedCity: (cityId: string | null) => void;
  searchCities: (query: string) => Promise<City[]>;
  clearSelection: () => void;
  refresh: () => Promise<void>;
}

export const useLocation = (
  options: UseLocationOptions = {}
): UseLocationReturn => {
  const { initialStateId, initialCityId, enableSearch = false } = options;

  // State
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedState, setSelectedStateState] = useState<State | null>(null);
  const [selectedCity, setSelectedCityState] = useState<City | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load states on mount
  useEffect(() => {
    loadStates();
  }, []);

  // Load cities when state changes
  useEffect(() => {
    if (selectedState) {
      loadCities(selectedState.id);
    } else {
      setCities([]);
      setSelectedCityState(null);
    }
  }, [selectedState]);

  // Set initial values
  useEffect(() => {
    if (initialStateId && states.length > 0) {
      const state = states.find(s => s.id === initialStateId);
      if (state) {
        setSelectedStateState(state);
      }
    }
  }, [initialStateId, states]);

  useEffect(() => {
    if (initialCityId && cities.length > 0) {
      const city = cities.find(c => c.id === initialCityId);
      if (city) {
        setSelectedCityState(city);
      }
    }
  }, [initialCityId, cities]);

  // Load states
  const loadStates = async () => {
    try {
      setLoading(true);
      setError(null);
      const statesData = await locationService.getStates();
      setStates(statesData);
    } catch (err) {
      setError('Failed to load states');
      console.error('Error loading states:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load cities for selected state
  const loadCities = async (stateId: string) => {
    try {
      setLoading(true);
      setError(null);
      const citiesData = await locationService.getCitiesByState(stateId);
      setCities(citiesData);
    } catch (err) {
      setError('Failed to load cities');
      console.error('Error loading cities:', err);
    } finally {
      setLoading(false);
    }
  };

  // Set selected state
  const setSelectedState = useCallback(
    (stateId: string | null) => {
      if (!stateId) {
        setSelectedStateState(null);
        setSelectedCityState(null);
        return;
      }

      const state = states.find(s => s.id === stateId);
      if (state) {
        setSelectedStateState(state);
      }
    },
    [states]
  );

  // Set selected city
  const setSelectedCity = useCallback(
    (cityId: string | null) => {
      if (!cityId) {
        setSelectedCityState(null);
        return;
      }

      const city = cities.find(c => c.id === cityId);
      if (city) {
        setSelectedCityState(city);
      }
    },
    [cities]
  );

  // Search cities
  const searchCities = useCallback(
    async (query: string): Promise<City[]> => {
      if (!enableSearch || !query || query.length < 2) {
        return [];
      }

      try {
        return await locationService.searchCities(query, selectedState?.id);
      } catch (err) {
        console.error('Error searching cities:', err);
        return [];
      }
    },
    [enableSearch, selectedState]
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedStateState(null);
    setSelectedCityState(null);
    setCities([]);
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    locationService.clearCache();
    await loadStates();
  }, []);

  return {
    states,
    cities,
    selectedState,
    selectedCity,
    loading,
    error,
    setSelectedState,
    setSelectedCity,
    searchCities,
    clearSelection,
    refresh,
  };
};

export default useLocation;
