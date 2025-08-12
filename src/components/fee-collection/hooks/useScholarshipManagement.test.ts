import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useScholarshipManagement } from './useScholarshipManagement';
import { Scholarship } from '@/types/fee';

describe('useScholarshipManagement', () => {
  const mockOnScholarshipsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should automatically create one scholarship when initialized with empty array', () => {
    const { result } = renderHook(() =>
      useScholarshipManagement({
        scholarships: [],
        onScholarshipsChange: mockOnScholarshipsChange,
        errors: {}
      })
    );

    // The effect should trigger and create one scholarship
    expect(mockOnScholarshipsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringMatching(/^temp-/),
          name: '',
          description: '',
          amount_percentage: 0,
          start_percentage: 0,
          end_percentage: 0
        })
      ])
    );
  });

  it('should not create additional scholarships when scholarships already exist', () => {
    const existingScholarships: Scholarship[] = [
      {
        id: 'existing-1',
        cohort_id: 'cohort-1',
        name: 'Existing Scholarship',
        description: 'Test scholarship',
        amount_percentage: 10,
        start_percentage: 80,
        end_percentage: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    const { result } = renderHook(() =>
      useScholarshipManagement({
        scholarships: existingScholarships,
        onScholarshipsChange: mockOnScholarshipsChange,
        errors: {}
      })
    );

    // Should not call onScholarshipsChange since scholarships already exist
    expect(mockOnScholarshipsChange).not.toHaveBeenCalled();
  });

  it('should add new scholarship when addScholarship is called', () => {
    const existingScholarships: Scholarship[] = [
      {
        id: 'existing-1',
        cohort_id: 'cohort-1',
        name: 'Existing Scholarship',
        description: 'Test scholarship',
        amount_percentage: 10,
        start_percentage: 80,
        end_percentage: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    const { result } = renderHook(() =>
      useScholarshipManagement({
        scholarships: existingScholarships,
        onScholarshipsChange: mockOnScholarshipsChange,
        errors: {}
      })
    );

    act(() => {
      result.current.addScholarship();
    });

    expect(mockOnScholarshipsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        ...existingScholarships,
        expect.objectContaining({
          id: expect.stringMatching(/^temp-/),
          name: '',
          description: '',
          amount_percentage: 0,
          start_percentage: 0,
          end_percentage: 0
        })
      ])
    );
  });
});
