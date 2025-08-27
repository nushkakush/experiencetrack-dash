import { useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentService } from '../services/equipment.service';
import { equipmentKeys } from './queryKeys';
import { toast } from 'sonner';

// Equipment status actions
export const useMarkEquipmentAsLost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'mark-lost'],
    mutationFn: (id: string) => equipmentService.markAsLost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
      toast.success('Equipment marked as lost');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark equipment as lost: ${error.message}`);
    },
  });
};

export const useMarkEquipmentAsDamaged = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'mark-damaged'],
    mutationFn: (id: string) => equipmentService.markAsDamaged(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
      toast.success('Equipment marked as damaged');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark equipment as damaged: ${error.message}`);
    },
  });
};

export const useMarkEquipmentAsActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'mark-active'],
    mutationFn: (id: string) => equipmentService.markAsActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
      toast.success('Equipment marked as active');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark equipment as active: ${error.message}`);
    },
  });
};

export const useMarkEquipmentAsRetired = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'mark-retired'],
    mutationFn: (id: string) => equipmentService.markAsRetired(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
      toast.success('Equipment marked as retired');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark equipment as retired: ${error.message}`);
    },
  });
};

// Equipment cloning
export const useCloneEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'clone'],
    mutationFn: (id: string) => equipmentService.cloneEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.stats() });
      toast.success('Equipment cloned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to clone equipment: ${error.message}`);
    },
  });
};
