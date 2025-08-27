import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentDamageService } from '@/services/equipment/equipmentDamage.service';
import { toast } from 'sonner';
import { CreateDamageReportData, EquipmentDamageReport } from '../types';
import { equipmentKeys } from './queryKeys';

// Damage report queries
export const useDamageReports = () => {
  return useQuery({
    queryKey: equipmentKeys.damageReports(),
    queryFn: () => equipmentDamageService.getDamageReports(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEquipmentDamageReports = (equipmentId: string) => {
  return useQuery({
    queryKey: [...equipmentKeys.damageReports(), equipmentId],
    queryFn: () =>
      equipmentDamageService.getDamageReportsByEquipment(equipmentId),
    enabled: !!equipmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Damage report mutations
export const useCreateDamageReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDamageReportData) =>
      equipmentDamageService.createDamageReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.damageReports(),
      });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
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
      equipmentDamageService.updateDamageReportStatus(
        reportId,
        status,
        resolvedBy
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.damageReports(),
      });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      toast.success('Damage report status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update damage report status: ${error.message}`);
    },
  });
};

export const useDeleteDamageReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) =>
      equipmentDamageService.deleteDamageReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.damageReports(),
      });
      toast.success('Damage report deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete damage report: ${error.message}`);
    },
  });
};
