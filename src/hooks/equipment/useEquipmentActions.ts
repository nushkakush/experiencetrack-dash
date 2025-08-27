import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EquipmentService } from '@/services/equipment.service';
import { toast } from 'sonner';

export const useMarkEquipmentAsLost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (equipmentId: string) =>
      EquipmentService.markEquipmentAsLost(equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment marked as lost successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark equipment as lost: ${error.message}`);
    },
  });
};

export const useMarkEquipmentAsDamaged = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (equipmentId: string) =>
      EquipmentService.markEquipmentAsDamaged(equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment marked as damaged successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark equipment as damaged: ${error.message}`);
    },
  });
};

export const useMarkEquipmentAsActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (equipmentId: string) =>
      EquipmentService.markEquipmentAsActive(equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment marked as active successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark equipment as active: ${error.message}`);
    },
  });
};

export const useMarkEquipmentAsRetired = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (equipmentId: string) =>
      EquipmentService.markEquipmentAsRetired(equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment marked as retired successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark equipment as retired: ${error.message}`);
    },
  });
};
