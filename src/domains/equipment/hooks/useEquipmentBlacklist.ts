import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentBlacklistService } from '@/services/equipment/equipmentBlacklist.service';
import { toast } from 'sonner';
import { CreateBlacklistData, EquipmentBlacklist } from '../types';
import { CohortStudent } from '@/types/cohort';
import { equipmentKeys } from './queryKeys';

// Blacklist queries
export const useBlacklistedStudents = () => {
  return useQuery({
    queryKey: equipmentKeys.blacklistedStudents(),
    queryFn: () => equipmentBlacklistService.getBlacklistedStudents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCohortStudents = (cohortId: string) => {
  return useQuery({
    queryKey: ['cohortStudents', cohortId],
    queryFn: () => equipmentBlacklistService.getCohortStudents(cohortId),
    enabled: !!cohortId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useIsStudentBlacklisted = (studentId: string) => {
  return useQuery({
    queryKey: ['isStudentBlacklisted', studentId],
    queryFn: () => equipmentBlacklistService.isStudentBlacklisted(studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Blacklist mutations
export const useBlacklistStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBlacklistData) =>
      equipmentBlacklistService.blacklistStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.blacklistedStudents(),
      });
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
      equipmentBlacklistService.removeFromBlacklist(blacklistId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.blacklistedStudents(),
      });
      toast.success('Student removed from blacklist');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove from blacklist: ${error.message}`);
    },
  });
};
