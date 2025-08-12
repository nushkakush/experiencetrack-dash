import { useState, useEffect, useCallback } from 'react';
import { Scholarship } from '@/types/fee';
import { FeeValidationService } from '../utils/feeValidation';

interface UseScholarshipManagementProps {
  scholarships: Scholarship[];
  onScholarshipsChange: (scholarships: Scholarship[]) => void;
  errors: Record<string, string>;
}

export const useScholarshipManagement = ({
  scholarships,
  onScholarshipsChange,
  errors
}: UseScholarshipManagementProps) => {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [hasInitialized, setHasInitialized] = useState(false);

  // Validate scholarships for overlaps and individual field errors
  const validateScholarships = useCallback((scholarshipList: Scholarship[]): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    for (let i = 0; i < scholarshipList.length; i++) {
      const current = scholarshipList[i];
      
      // Check for overlaps with other scholarships
      for (let j = 0; j < scholarshipList.length; j++) {
        if (i === j) continue; // Skip self-comparison
        
        const other = scholarshipList[j];
        
        // Check if ranges overlap
        const currentStart = current.start_percentage;
        const currentEnd = current.end_percentage;
        const otherStart = other.start_percentage;
        const otherEnd = other.end_percentage;
        
        // Overlap condition: (start1 <= end2) AND (start2 <= end1)
        if (currentStart <= otherEnd && otherStart <= currentEnd) {
          const errorKey = `scholarship-${i}-overlap`;
          newErrors[errorKey] = `Overlaps with "${other.name}" (${other.start_percentage}%-${other.end_percentage}%). Scholarship ranges cannot overlap.`;
          break; // Only show first overlap error per scholarship
        }
      }
      
      // Validate individual scholarship fields
      if (!current.name?.trim()) {
        newErrors[`scholarship-${i}-name`] = 'Scholarship name is required';
      }
      
      if (!current.amount_percentage || current.amount_percentage <= 0) {
        newErrors[`scholarship-${i}-amount`] = 'Amount percentage must be greater than 0';
      }
      
      if (current.amount_percentage > 100) {
        newErrors[`scholarship-${i}-amount`] = 'Amount percentage cannot exceed 100%';
      }
      
      if (current.start_percentage >= current.end_percentage) {
        newErrors[`scholarship-${i}-range`] = 'Start percentage must be less than end percentage';
      }
    }
    
    return newErrors;
  }, []);

  // Update validation when scholarships change
  useEffect(() => {
    const validationErrors = validateScholarships(scholarships);
    setLocalErrors(validationErrors);
  }, [scholarships, validateScholarships]);

  // Initialize with one scholarship if none exist
  useEffect(() => {
    if (!hasInitialized && scholarships.length === 0) {
      const initialScholarship: Scholarship = {
        id: `temp-${Date.now()}`,
        cohort_id: '',
        name: '',
        description: '',
        amount_percentage: 0,
        start_percentage: 0,
        end_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      onScholarshipsChange([initialScholarship]);
      setHasInitialized(true);
    } else if (scholarships.length > 0) {
      // Mark as initialized if we have scholarships (either from existing data or manual addition)
      setHasInitialized(true);
    }
  }, [scholarships.length, hasInitialized, onScholarshipsChange]);

  // Add new scholarship
  const addScholarship = useCallback(() => {
    const newScholarship: Scholarship = {
      id: `temp-${Date.now()}`,
      cohort_id: '',
      name: '',
      description: '',
      amount_percentage: 0,
      start_percentage: 0,
      end_percentage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    onScholarshipsChange([...scholarships, newScholarship]);
  }, [scholarships, onScholarshipsChange]);

  // Remove scholarship by index
  const removeScholarship = useCallback((index: number) => {
    const updatedScholarships = scholarships.filter((_, i) => i !== index);
    onScholarshipsChange(updatedScholarships);
  }, [scholarships, onScholarshipsChange]);

  // Update scholarship field
  const updateScholarship = useCallback((index: number, field: keyof Scholarship, value: string) => {
    const updatedScholarships = scholarships.map((scholarship, i) => {
      if (i === index) {
        // Convert string inputs to numbers for percentage fields
        if (field === 'amount_percentage' || field === 'start_percentage' || field === 'end_percentage') {
          const numValue = parseFloat(value) || 0;
          return { ...scholarship, [field]: numValue };
        }
        return { ...scholarship, [field]: value };
      }
      return scholarship;
    });
    onScholarshipsChange(updatedScholarships);
  }, [scholarships, onScholarshipsChange]);

  // Check if there are overlapping scholarships
  const hasOverlappingScholarships = Object.keys(localErrors).some(key => key.includes('overlap'));

  // Get error for specific scholarship field
  const getFieldError = useCallback((scholarshipIndex: number, field: string): string | undefined => {
    return localErrors[`scholarship-${scholarshipIndex}-${field}`];
  }, [localErrors]);

  // Get overlap error for specific scholarship
  const getOverlapError = useCallback((scholarshipIndex: number): string | undefined => {
    return localErrors[`scholarship-${scholarshipIndex}-overlap`];
  }, [localErrors]);

  return {
    localErrors,
    hasOverlappingScholarships,
    addScholarship,
    removeScholarship,
    updateScholarship,
    getFieldError,
    getOverlapError,
    validateScholarships
  };
};
