import { supabase } from '@/integrations/supabase/client';
import type { PaymentPlan as AppPaymentPlan } from '@/types/fee';

export type PaymentPlan = AppPaymentPlan;

export interface PaymentEngineParams {
  studentId?: string;
  cohortId: string;
  paymentPlan?: PaymentPlan;
  scholarshipId?: string | null;
  additionalDiscountPercentage?: number;
  startDate?: string; // YYYY-MM-DD
}

export async function getPaymentBreakdown(params: PaymentEngineParams) {
  const { data, error } = await supabase.functions.invoke('payment-engine', {
    body: { action: 'breakdown', ...params },
  });
  if (error) throw error;
  return data;
}

export async function getPaymentStatus(params: PaymentEngineParams) {
  const { data, error } = await supabase.functions.invoke('payment-engine', {
    body: { action: 'status', ...params },
  });
  if (error) throw error;
  return data;
}

export async function getFullPaymentView(params: PaymentEngineParams) {
  const { data, error } = await supabase.functions.invoke('payment-engine', {
    body: { action: 'full', ...params },
  });
  if (error) throw error;
  return data;
}


