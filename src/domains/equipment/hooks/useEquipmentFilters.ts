import { useState, useMemo } from 'react';
import { Equipment } from '../types';

export interface EquipmentFilters {
  category_id?: string;
  availability_status?: string;
  condition_status?: string;
  location_id?: string;
  price_min?: number;
  price_max?: number;
  date_from?: string;
  date_to?: string;
}

export const useEquipmentFilters = (equipmentData: Equipment[] | undefined) => {
  const [activeTab, setActiveTab] = useState('available');
  const [filters, setFilters] = useState<EquipmentFilters>({});

  const filteredEquipment = useMemo(() => {
    if (!equipmentData) return [];

    let equipment = equipmentData;

    // Apply tab filter
    if (activeTab === 'available') {
      equipment = equipment.filter(
        item => item.availability_status === 'available'
      );
    } else if (activeTab === 'borrowed') {
      equipment = equipment.filter(
        item => item.availability_status === 'borrowed'
      );
    } else if (activeTab === 'maintenance') {
      equipment = equipment.filter(
        item => item.availability_status === 'maintenance'
      );
    } else if (activeTab === 'retired') {
      equipment = equipment.filter(
        item => item.availability_status === 'retired'
      );
    }

    // Apply additional filters
    if (filters.condition_status) {
      equipment = equipment.filter(
        item => item.condition_status === filters.condition_status
      );
    }

    if (filters.location_id) {
      equipment = equipment.filter(
        item => item.location_id === filters.location_id
      );
    }

    if (filters.price_min !== undefined) {
      equipment = equipment.filter(
        item => (item.purchase_cost || 0) >= filters.price_min!
      );
    }

    if (filters.price_max !== undefined) {
      equipment = equipment.filter(
        item => (item.purchase_cost || 0) <= filters.price_max!
      );
    }

    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      equipment = equipment.filter(
        item => new Date(item.created_at) >= fromDate
      );
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      equipment = equipment.filter(item => new Date(item.created_at) <= toDate);
    }

    return equipment;
  }, [equipmentData, activeTab, filters]);

  const updateFilters = (newFilters: Partial<EquipmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getFilteredCount = (status: string) => {
    if (!equipmentData) return 0;
    return equipmentData.filter(item => item.availability_status === status)
      .length;
  };

  return {
    activeTab,
    setActiveTab,
    filters,
    updateFilters,
    clearFilters,
    filteredEquipment,
    getFilteredCount,
  };
};
