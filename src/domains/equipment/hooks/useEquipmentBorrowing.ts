import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentBorrowingService } from '@/services/equipment/equipmentBorrowing.service';
import { toast } from 'sonner';
import {
  CreateBorrowingFormData,
  ReturnEquipmentData,
  EquipmentBorrowing,
  EquipmentReturn,
} from '../types';
import { equipmentKeys } from './queryKeys';

// Borrowing queries
export const useBorrowings = (
  page: number = 1,
  limit: number = 10,
  filters: {
    student_id?: string;
    equipment_id?: string;
    status?: string;
    cohort_id?: string;
    date_from?: string;
    date_to?: string;
    isOverdue?: boolean;
  } = {}
) => {
  const queryKey = equipmentKeys.borrowings();

  return useQuery({
    queryKey: [...queryKey, { page, limit, filters }],
    queryFn: () =>
      equipmentBorrowingService.getBorrowings(page, limit, filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useOverdueBorrowings = () => {
  return useQuery({
    queryKey: equipmentKeys.overdueBorrowings(),
    queryFn: () => equipmentBorrowingService.getOverdueBorrowings(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Borrowing mutations
export const useCreateBorrowing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBorrowingFormData) =>
      equipmentBorrowingService.createBorrowing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.borrowings() });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.overdueBorrowings(),
      });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      toast.success('Equipment borrowed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to borrow equipment: ${error.message}`);
    },
  });
};

export const useReturnEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReturnEquipmentData) =>
      equipmentBorrowingService.returnEquipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.borrowings() });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.overdueBorrowings(),
      });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      toast.success('Equipment returned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to return equipment: ${error.message}`);
    },
  });
};

export const useDeleteBorrowing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (borrowingId: string) =>
      equipmentBorrowingService.deleteBorrowing(borrowingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.borrowings() });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.overdueBorrowings(),
      });
      toast.success('Borrowing record deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete borrowing record: ${error.message}`);
    },
  });
};
