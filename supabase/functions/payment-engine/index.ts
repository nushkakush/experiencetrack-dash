import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Import types and modules
import type {
  EdgeRequest,
  EdgeResponse,
  PaymentPlan,
  Transaction,
} from './types.ts';
import { generateFeeStructureReview } from './business-logic.ts';
import { enrichWithStatuses } from './status-management.ts';
import {
  calculatePartialPaymentSummary,
  processAdminPartialApproval,
  updatePartialPaymentConfig,
  getPartialPaymentConfig,
} from './partial-payments.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
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
      throw new Error(
        'studentId and installmentId are required for partial calculation'
      );
    }

    const result = await calculatePartialPaymentSummary(
      supabase,
      studentId,
      installmentId
    );
    return { success: true, data: result };
  }

  if (action === 'admin_partial_approval') {
    if (!transactionId || !approvalType) {
      throw new Error(
        'transactionId and approvalType are required for admin approval'
      );
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
    console.log('🔧 [partial_config] Starting with:', {
      studentId,
      installmentId,
      allowPartialPayments,
    });

    if (!studentId || !installmentId) {
      throw new Error(
        'studentId and installmentId are required for partial payment config'
      );
    }

    // Get student payment ID
    const { data: studentPayment, error: studentPaymentError } = await supabase
      .from('student_payments')
      .select('id')
      .eq('student_id', studentId)
      .single();

    if (studentPaymentError) {
      throw new Error(
        `Student payment lookup failed: ${studentPaymentError.message}`
      );
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
          allowPartialPayments: verifyResult.allowPartialPayments,
        },
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
    console.log('🔍 [PAYMENT ENGINE] Looking for student_payments record:', {
      studentId,
      cohortId,
    });

    const { data: sp, error: spError } = await supabase
      .from('student_payments')
      .select('id, payment_plan, scholarship_id')
      .eq('student_id', studentId)
      .eq('cohort_id', cohortId)
      .maybeSingle();

    console.log('🔍 [PAYMENT ENGINE] Student payments query result:', {
      sp,
      spError,
      hasStudentPayment: !!sp,
    });

    if (sp) {
      studentPaymentId = sp.id;
      console.log('✅ [PAYMENT ENGINE] Found student payment record:', {
        studentPaymentId: sp.id,
        payment_plan: sp.payment_plan,
        scholarship_id: sp.scholarship_id,
      });

      if (!resolvedPlan && sp.payment_plan)
        resolvedPlan = sp.payment_plan as PaymentPlan;
      if (!effectiveScholarshipId && sp.scholarship_id)
        effectiveScholarshipId = sp.scholarship_id as string;
    } else {
      console.log('⚠️ [PAYMENT ENGINE] No student payment record found for:', {
        studentId,
        cohortId,
      });
    }
  } else {
    console.log(
      '⚠️ [PAYMENT ENGINE] No studentId provided, skipping student payment lookup'
    );
  }

  if (!resolvedPlan) {
    throw new Error(
      'paymentPlan is required when no student payment record exists'
    );
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
    console.log(
      '🔍 [PAYMENT ENGINE] Looking for transactions with studentPaymentId:',
      studentPaymentId
    );
    const { data: tx, error: txError } = await supabase
      .from('payment_transactions')
      .select(
        'id, amount, verification_status, installment_id, semester_number, payment_method, reference_number'
      )
      .eq('payment_id', studentPaymentId);

    console.log('🔍 [PAYMENT ENGINE] Transaction query result:', {
      tx,
      txError,
      transactionCount: Array.isArray(tx) ? tx.length : 0,
    });

    if (txError) {
      console.log('❌ [PAYMENT ENGINE] Error fetching transactions:', txError);
    } else if (Array.isArray(tx) && tx.length > 0) {
      console.log(
        '✅ [PAYMENT ENGINE] Found transactions:',
        tx.map(t => ({
          id: t.id,
          amount: t.amount,
          verification_status: t.verification_status,
          installment_id: t.installment_id,
          semester_number: t.semester_number,
          payment_method: t.payment_method,
          reference_number: t.reference_number,
        }))
      );
    } else {
      console.log(
        '⚠️ [PAYMENT ENGINE] No transactions found for studentPaymentId:',
        studentPaymentId
      );
    }

    transactions = Array.isArray(tx) ? (tx as unknown[]) : [];
  } else {
    console.log(
      '⚠️ [PAYMENT ENGINE] No studentPaymentId found, skipping transaction lookup'
    );
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
