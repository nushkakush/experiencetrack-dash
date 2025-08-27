import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EquipmentService } from '@/services/equipment.service';
import { toast } from 'sonner';
import {
  Equipment,
  EquipmentCategory,
  EquipmentLocation,
  CreateEquipmentFormData,
  CreateCategoryFormData,
  CreateLocationFormData,
  CreateBorrowingFormData,
  ReturnEquipmentData,
  CreateDamageReportData,
  CreateBlacklistData,
  EquipmentReturn,
} from '@/types/equipment';

// Query keys
export const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (filters: any) => [...equipmentKeys.lists(), filters] as const,
  details: () => [...equipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentKeys.details(), id] as const,
  categories: () => [...equipmentKeys.all, 'categories'] as const,
  locations: () => [...equipmentKeys.all, 'locations'] as const,
  stats: () => [...equipmentKeys.all, 'stats'] as const,
  recentBorrowings: () => [...equipmentKeys.all, 'recentBorrowings'] as const,
  borrowings: () => [...equipmentKeys.all, 'borrowings'] as const,
  overdueBorrowings: () => [...equipmentKeys.all, 'overdueBorrowings'] as const,
};

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

  // Debug logging
  console.log('useEquipment - queryKey:', queryKey);
  console.log('useEquipment - search:', search);
  console.log('useEquipment - category_id:', category_id);
  console.log('useEquipment - availability_status:', availability_status);

  return useQuery({
    queryKey,
    queryFn: () =>
      EquipmentService.getEquipment(
        page,
        limit,
        search,
        category_id,
        availability_status
      ),
    staleTime: search ? 0 : undefined, // Disable stale time for search queries
  });
};

export const useEquipmentById = (id: string) => {
  return useQuery({
    queryKey: equipmentKeys.detail(id),
    queryFn: () => EquipmentService.getEquipmentById(id),
    enabled: !!id,
  });
};

// Equipment mutations
export const useCreateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'create'],
    mutationFn: (data: CreateEquipmentFormData) =>
      EquipmentService.createEquipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
      toast.success('Equipment created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create equipment: ${error.message}`);
    },
  });
};

export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'update'],
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateEquipmentFormData>;
    }) => EquipmentService.updateEquipment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
      toast.success('Equipment updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update equipment: ${error.message}`);
    },
  });
};

export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'delete'],
    mutationFn: (id: string) => EquipmentService.deleteEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
      toast.success('Equipment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete equipment: ${error.message}`);
    },
  });
};

// Category queries
export const useCategories = () => {
  return useQuery({
    queryKey: equipmentKeys.categories(),
    queryFn: () => EquipmentService.getCategories(),
  });
};

// Category mutations
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'category', 'create'],
    mutationFn: (data: CreateCategoryFormData) =>
      EquipmentService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.categories() });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'category', 'update'],
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCategoryFormData>;
    }) => EquipmentService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.categories() });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'category', 'delete'],
    mutationFn: (id: string) => EquipmentService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.categories() });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });
};

// Location queries
export const useLocations = () => {
  return useQuery({
    queryKey: equipmentKeys.locations(),
    queryFn: () => EquipmentService.getLocations(),
  });
};

// Location mutations
export const useCreateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'location', 'create'],
    mutationFn: (data: CreateLocationFormData) =>
      EquipmentService.createLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.locations() });
      toast.success('Location created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create location: ${error.message}`);
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'location', 'update'],
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateLocationFormData>;
    }) => EquipmentService.updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.locations() });
      toast.success('Location updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update location: ${error.message}`);
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'location', 'delete'],
    mutationFn: (id: string) => EquipmentService.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.locations() });
      toast.success('Location deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete location: ${error.message}`);
    },
  });
};

// Statistics and recent borrowings
export const useEquipmentStats = () => {
  return useQuery({
    queryKey: equipmentKeys.stats(),
    queryFn: () => EquipmentService.getEquipmentStats(),
  });
};

export const useRecentBorrowings = (limit: number = 5) => {
  return useQuery({
    queryKey: equipmentKeys.recentBorrowings(),
    queryFn: () => EquipmentService.getRecentBorrowings(limit),
  });
};

// Equipment Borrowing Hooks
export const useBorrowings = (
  page: number = 1,
  limit: number = 10,
  filters?: {
    student_id?: string;
    equipment_id?: string;
    status?: string;
    cohort_id?: string;
    date_from?: string;
    date_to?: string;
    isOverdue?: boolean;
  }
) => {
  return useQuery({
    queryKey: ['borrowings', page, limit, filters],
    queryFn: () => EquipmentService.getBorrowings(page, limit, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateBorrowing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBorrowingFormData) =>
      EquipmentService.createBorrowing(data),
    mutationKey: ['createBorrowing'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment issued successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to issue equipment: ${error.message}`);
    },
  });
};

export const useReturnEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      returnData: ReturnEquipmentData
    ): Promise<EquipmentReturn> => {
      return EquipmentService.returnEquipment(returnData);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch borrowings
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });

      // Add the return record to the cache
      queryClient.setQueryData(['equipment-returns', data.borrowing_id], data);
    },
    onError: error => {
      console.error('Error returning equipment:', error);
    },
  });
};

export const useExtendBorrowing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'borrowing', 'extend'],
    mutationFn: ({
      borrowingId,
      newReturnDate,
    }: {
      borrowingId: string;
      newReturnDate: string;
    }) => EquipmentService.extendBorrowing(borrowingId, newReturnDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.borrowings() });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.overdueBorrowings(),
      });
      toast.success('Borrowing extended successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to extend borrowing: ${error.message}`);
    },
  });
};

export const useDeleteBorrowing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'borrowing', 'delete'],
    mutationFn: (borrowingId: string) =>
      EquipmentService.deleteBorrowing(borrowingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.borrowings() });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.overdueBorrowings(),
      });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() }); // Refresh equipment list to update availability
      toast.success('Borrowing record deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete borrowing: ${error.message}`);
    },
  });
};

export const useOverdueBorrowings = () => {
  return useQuery({
    queryKey: ['overdueBorrowings'],
    queryFn: () => EquipmentService.getOverdueBorrowings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStudentBorrowingHistory = (studentId: string) => {
  return useQuery({
    queryKey: ['studentBorrowingHistory', studentId],
    queryFn: () => EquipmentService.getStudentBorrowingHistory(studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAvailableEquipment = () => {
  return useQuery({
    queryKey: ['availableEquipment'],
    queryFn: () => EquipmentService.getAvailableEquipment(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Equipment Blacklist Hooks
export const useBlacklistedStudents = () => {
  return useQuery({
    queryKey: ['blacklistedStudents'],
    queryFn: () => EquipmentService.getBlacklistedStudents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCohortStudents = (cohortId: string) => {
  return useQuery({
    queryKey: ['cohortStudents', cohortId],
    queryFn: () => EquipmentService.getCohortStudents(cohortId),
    enabled: !!cohortId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBlacklistStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBlacklistData) =>
      EquipmentService.blacklistStudent(data),
    mutationKey: ['blacklistStudent'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklistedStudents'] });
      toast.success('Student blacklisted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to blacklist student: ${error.message}`);
    },
  });
};

export const useRemoveFromBlacklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blacklistId: string) =>
      EquipmentService.removeFromBlacklist(blacklistId),
    mutationKey: ['removeFromBlacklist'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklistedStudents'] });
      toast.success('Student removed from blacklist');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove from blacklist: ${error.message}`);
    },
  });
};

// Equipment Damage Report Hooks
export const useDamageReports = () => {
  return useQuery({
    queryKey: ['damageReports'],
    queryFn: () => EquipmentService.getDamageReports(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEquipmentDamageReports = (equipmentId: string) => {
  return useQuery({
    queryKey: ['equipmentDamageReports', equipmentId],
    queryFn: () => EquipmentService.getDamageReports(),
    enabled: !!equipmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: reports =>
      reports.filter(report => report.equipment_id === equipmentId),
  });
};

export const useCreateDamageReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDamageReportData) =>
      EquipmentService.createDamageReport(data),
    mutationKey: ['createDamageReport'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damageReports'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Damage report created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create damage report: ${error.message}`);
    },
  });
};

export const useUpdateDamageReportStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reportId,
      status,
      resolvedBy,
    }: {
      reportId: string;
      status: string;
      resolvedBy?: string;
    }) =>
      EquipmentService.updateDamageReportStatus(reportId, status, resolvedBy),
    mutationKey: ['updateDamageReportStatus'],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damageReports'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Damage report status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update damage report status: ${error.message}`);
    },
  });
};
