import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentTransactionService } from '@/services/paymentTransaction.service';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => ({
            count: 'exact',
            head: true,
          })),
        })),
      })),
    })),
  },
}));

describe('PaymentTransactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPendingVerificationCount', () => {
    it('should return count of pending verification transactions for a cohort', async () => {
      const mockCount = 5;
      const mockSupabase = await import('@/integrations/supabase/client');

      // Mock the count response
      const mockCountResponse = {
        count: mockCount,
        error: null,
      };

      // Mock the subquery response
      const mockSubqueryResponse = {
        data: [{ id: 'payment1' }, { id: 'payment2' }],
        error: null,
      };

      // Setup the mock chain
      const mockFrom = vi.fn();
      const mockSelect = vi.fn();
      const mockEq = vi.fn();
      const mockIn = vi.fn();

      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            in: mockIn.mockReturnValue({
              count: 'exact',
              head: true,
            }),
          }),
        }),
      });

      mockSupabase.supabase.from = mockFrom;

      // Mock the count result
      mockIn.mockResolvedValue(mockCountResponse);

      const result =
        await paymentTransactionService.getPendingVerificationCount(
          'cohort-123'
        );

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockCount);
      expect(result.error).toBe(null);
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Database error');
      const mockSupabase = await import('@/integrations/supabase/client');

      const mockFrom = vi.fn();
      const mockSelect = vi.fn();
      const mockEq = vi.fn();
      const mockIn = vi.fn();

      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            in: mockIn.mockReturnValue({
              count: 'exact',
              head: true,
            }),
          }),
        }),
      });

      mockSupabase.supabase.from = mockFrom;

      // Mock the error response
      mockIn.mockResolvedValue({
        count: null,
        error: mockError,
      });

      const result =
        await paymentTransactionService.getPendingVerificationCount(
          'cohort-123'
        );

      expect(result.success).toBe(false);
      expect(result.data).toBe(null);
      expect(result.error).toBe(mockError.message);
    });
  });
});
