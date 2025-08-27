import { useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentService } from '../services/equipment.service';
import { equipmentKeys } from './queryKeys';
import { toast } from 'sonner';
import {
  CreateEquipmentFormData,
  CreateCategoryFormData,
  CreateLocationFormData,
} from '../types';

// Equipment mutations
export const useCreateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'create'],
    mutationFn: (data: CreateEquipmentFormData) =>
      equipmentService.createEquipment(data),
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
    }) => equipmentService.updateEquipment(id, data),
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
    mutationFn: (id: string) => equipmentService.deleteEquipment(id),
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

// Category mutations
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'category', 'create'],
    mutationFn: (data: CreateCategoryFormData) =>
      equipmentService.createCategory(data),
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
    }) => equipmentService.updateCategory(id, data),
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
    mutationFn: (id: string) => equipmentService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.categories() });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });
};

// Location mutations
export const useCreateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['equipment', 'location', 'create'],
    mutationFn: (data: CreateLocationFormData) =>
      equipmentService.createLocation(data),
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
    }) => equipmentService.updateLocation(id, data),
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
    mutationFn: (id: string) => equipmentService.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.locations() });
      toast.success('Location deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete location: ${error.message}`);
    },
  });
};
