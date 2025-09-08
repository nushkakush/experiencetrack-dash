import { supabase } from '@/integrations/supabase/client';
import type { PaymentPlan as AppPaymentPlan } from '@/types/fee';

export type PaymentPlan = AppPaymentPlan;

export interface PaymentEngineParams {
  studentId?: string;
  cohortId: string;
  paymentPlan?: PaymentPlan;
  scholarshipId?: string | null;
  additionalDiscountPercentage?: number;
  // startDate removed - dates come from database only
  customDates?: Record<string, string>; // For preview with custom dates
  feeStructureData?: {
    // For preview mode when no saved structure exists
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    program_fee_includes_gst: boolean;
    equal_scholarship_distribution: boolean;
    // Custom dates configuration

    one_shot_dates?: Record<string, string>; // JSON data for one-shot payment dates
    sem_wise_dates?: Record<string, unknown>; // JSON data for semester-wise payment dates
    instalment_wise_dates?: Record<string, unknown>; // JSON data for installment-wise payment dates
  };
}

export async function getPaymentBreakdown(params: PaymentEngineParams) {
  const { data, error } = await supabase.functions.invoke('payment-engine', {
    body: { action: 'breakdown', ...params },
  });
  if (error) throw error;
  return data; // Now includes both breakdown and feeStructure
}

export async function getPaymentStatus(params: PaymentEngineParams) {
  const { data, error } = await supabase.functions.invoke('payment-engine', {
    body: { action: 'status', ...params },
  });
  if (error) throw error;
  return data; // Now includes aggregate and feeStructure
}

export async function getFullPaymentView(params: PaymentEngineParams) {
  const { data, error } = await supabase.functions.invoke('payment-engine', {
    body: { action: 'full', ...params },
  });
  if (error) throw error;
  return data; // Now includes breakdown, feeStructure, and aggregate
}

export async function getBatchPaymentSummary(params: {
  cohortId: string;
  studentIds: string[];
  feeStructureData?: PaymentEngineParams['feeStructureData'];
}) {
  const { data, error } = await supabase.functions.invoke('payment-engine', {
    body: {
      action: 'batch_summary',
      cohortId: params.cohortId,
      studentIds: params.studentIds,
      feeStructureData: params.feeStructureData,
    },
  });
  if (error) throw error;
  return data; // Returns batch results with feeStructure and scholarships
}
