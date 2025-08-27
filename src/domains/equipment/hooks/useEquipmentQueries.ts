import { useQuery } from '@tanstack/react-query';
import { equipmentService } from '../services/equipment.service';
import { equipmentKeys } from './queryKeys';

// Equipment queries
export const useEquipment = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  category_id?: string,
  availability_status?: string
) => {
  const queryKey = equipmentKeys.list({
    page,
    limit,
    search,
    category_id,
    availability_status,
  });

  console.log('useEquipment - hook called with params:', {
    page,
    limit,
    search,
    category_id,
    availability_status,
  });

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('useEquipment - queryFn executing');
      const result = await equipmentService.getEquipment(
        page,
        limit,
        search,
        category_id,
        availability_status
      );
      console.log('useEquipment - queryFn result:', result);
      return result;
    },
    staleTime: search ? 0 : undefined, // Disable stale time for search queries
  });

  console.log('useEquipment - query state:', {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    data: query.data,
    equipmentCount: query.data?.equipment?.length || 0,
  });

  return query;
};

export const useEquipmentById = (id: string) => {
  return useQuery({
    queryKey: equipmentKeys.detail(id),
    queryFn: () => equipmentService.getEquipmentById(id),
    enabled: !!id,
  });
};

export const useEquipmentCategories = () => {
  console.log('useEquipmentCategories - hook called');
  const query = useQuery({
    queryKey: equipmentKeys.categories(),
    queryFn: async () => {
      console.log('useEquipmentCategories - queryFn executing');
      const result = await equipmentService.getCategories();
      console.log('useEquipmentCategories - queryFn result:', result);
      return result;
    },
  });

  console.log('useEquipmentCategories - query state:', {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    data: query.data,
    dataLength: query.data?.categories?.length || 0,
  });

  return query;
};

export const useEquipmentLocations = () => {
  console.log('useEquipmentLocations - hook called');
  const query = useQuery({
    queryKey: equipmentKeys.locations(),
    queryFn: async () => {
      console.log('useEquipmentLocations - queryFn executing');
      const result = await equipmentService.getLocations();
      console.log('useEquipmentLocations - queryFn result:', result);
      return result;
    },
  });

  console.log('useEquipmentLocations - query state:', {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    data: query.data,
    dataLength: query.data?.locations?.length || 0,
  });

  return query;
};

export const useEquipmentStats = () => {
  return useQuery({
    queryKey: equipmentKeys.stats(),
    queryFn: () => equipmentService.getEquipmentStats(),
  });
};

export const useRecentBorrowings = (limit: number = 5) => {
  return useQuery({
    queryKey: equipmentKeys.recentBorrowings(),
    queryFn: () => equipmentService.getRecentBorrowings(limit),
  });
};

export const useOverdueBorrowings = () => {
  return useQuery({
    queryKey: equipmentKeys.overdueBorrowings(),
    queryFn: () => equipmentService.getOverdueBorrowings(),
  });
};

export const useAvailableEquipment = () => {
  return useQuery({
    queryKey: equipmentKeys.list({ availability_status: 'available' }),
    queryFn: () =>
      equipmentService.getEquipment(1, 1000, undefined, undefined, 'available'),
  });
};
