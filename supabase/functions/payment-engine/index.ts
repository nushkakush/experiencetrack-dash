import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Import types and modules
import type { EdgeRequest, EdgeResponse, PaymentPlan, Transaction } from './types.ts';
import { generateFeeStructureReview } from './business-logic.ts';
import { enrichWithStatuses } from './status-management.ts';
import { 
  calculatePartialPaymentSummary, 
  processAdminPartialApproval, 
  updatePartialPaymentConfig, 
  getPartialPaymentConfig 
} from './partial-payments.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Main handler function
const handleRequest = async (request: EdgeRequest): Promise<EdgeResponse> => {
  const {
    action = 'full',
    studentId,
    cohortId,
    paymentPlan,
    scholarshipId,
    scholarshipData,
    additionalDiscountPercentage = 0,
    customDates,
    feeStructureData,
    // Partial payment fields
    installmentId,
    approvedAmount,
    transactionId,
    approvalType,
    adminNotes,
    rejectionReason,
    allowPartialPayments,
  } = request;

  console.log('🚀 Edge function called with:', {
    action,
    studentId,
    cohortId,
    paymentPlan,
    scholarshipId,
    scholarshipData,
    additionalDiscountPercentage,
    customDates,
  });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Handle partial payment specific actions
  if (action === 'partial_calculation') {
    if (!studentId || !installmentId) {
      throw new Error('studentId and installmentId are required for partial calculation');
    }
    
    const result = await calculatePartialPaymentSummary(supabase, studentId, installmentId);
    return { success: true, data: result };
  }

  if (action === 'admin_partial_approval') {
    if (!transactionId || !approvalType) {
      throw new Error('transactionId and approvalType are required for admin approval');
    }
    
    const result = await processAdminPartialApproval(
      supabase,
      transactionId,
      approvalType,
      approvedAmount,
      adminNotes,
      rejectionReason
    );
    return { success: true, data: result };
  }

  if (action === 'partial_config') {
    console.log('🔧 [partial_config] Starting with:', { studentId, installmentId, allowPartialPayments });
    
    if (!studentId || !installmentId) {
      throw new Error('studentId and installmentId are required for partial payment config');
    }

    // Get student payment ID
    const { data: studentPayment, error: studentPaymentError } = await supabase
      .from('student_payments')
      .select('id')
      .eq('student_id', studentId)
      .single();

    if (studentPaymentError) {
      throw new Error(`Student payment lookup failed: ${studentPaymentError.message}`);
    }

    if (!studentPayment) {
      throw new Error('Student payment record not found');
    }

    if (allowPartialPayments !== undefined) {
      // Update partial payment setting
      const result = await updatePartialPaymentConfig(
        supabase, 
        studentPayment.id, 
        installmentId, 
        allowPartialPayments
      );
      
      // Verify the update was successful
      const verifyResult = await getPartialPaymentConfig(
        supabase, 
        studentPayment.id, 
        installmentId
      );
      
      return { 
        success: true, 
        data: { 
          ...result, 
          verified: verifyResult,
          allowPartialPayments: verifyResult.allowPartialPayments 
        } 
      };
    } else {
      // Get partial payment setting
      const result = await getPartialPaymentConfig(
        supabase, 
        studentPayment.id, 
        installmentId
      );
      return { success: true, data: result };
    }
  }

  // Handle fee structure logic
  if (!cohortId) throw new Error('cohortId is required');
  if (!paymentPlan) throw new Error('paymentPlan is required for preview mode');

  // Resolve payment plan and payment record if student is provided
  let resolvedPlan: PaymentPlan | undefined = paymentPlan;
  let studentPaymentId: string | null = null;
  let effectiveScholarshipId = scholarshipId;

  if (studentId) {
    const { data: sp } = await supabase
      .from('student_payments')
      .select('id, payment_plan, scholarship_id')
      .eq('student_id', studentId)
      .eq('cohort_id', cohortId)
      .maybeSingle();
    if (sp) {
      studentPaymentId = sp.id;
      if (!resolvedPlan && sp.payment_plan)
        resolvedPlan = sp.payment_plan as PaymentPlan;
      if (!effectiveScholarshipId && sp.scholarship_id)
        effectiveScholarshipId = sp.scholarship_id as string;
    }
  }

  if (!resolvedPlan) {
    throw new Error('paymentPlan is required when no student payment record exists');
  }

  // Build breakdown and fee structure
  const { breakdown, feeStructure } = await generateFeeStructureReview(
    supabase,
    cohortId,
    resolvedPlan,
    effectiveScholarshipId,
    additionalDiscountPercentage || 0,
    studentId,
    customDates,
    feeStructureData,
    scholarshipData
  );

  if (action === 'breakdown') {
    return { success: true, breakdown, feeStructure };
  }

  // Load transactions if we need statuses/aggregates
  let transactions: Transaction[] = [];
  if (studentPaymentId) {
    const { data: tx } = await supabase
      .from('payment_transactions')
      .select('amount, verification_status, installment_id, semester_number')
      .eq('payment_id', studentPaymentId);
    transactions = Array.isArray(tx) ? (tx as unknown[]) : [];
  }

  const { breakdown: enriched, aggregate } = enrichWithStatuses(
    breakdown,
    transactions,
    resolvedPlan
  );

  if (action === 'status') {
    return { success: true, aggregate, feeStructure };
  }

  // Full response with debug info
  return {
    success: true,
    breakdown: enriched,
    feeStructure,
    aggregate,
    debug: {
      receivedFeeStructureData: !!feeStructureData,
      customDatesEnabled: feeStructureData?.custom_dates_enabled,
      oneShotDatesFromRequest: feeStructureData?.one_shot_dates,
      paymentPlan: resolvedPlan,
      finalOneShotDate: enriched?.oneShotPayment?.paymentDate,
    },
  };
};

// Main serve function
serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request: EdgeRequest = await req.json();
    const response = await handleRequest(request);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('payment-engine error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
