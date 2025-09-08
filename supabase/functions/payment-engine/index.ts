import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Import types and modules
import type {
  EdgeRequest,
  EdgeResponse,
  PaymentPlan,
  Transaction,
} from './types.ts';

// Calculate cohort statistics server-side
async function calculateCohortStatistics(
  students: any[],
  feeStructure: any,
  supabase: any,
  cohortId: string
) {
  if (!students.length) {
    return {
      averageScholarshipPercentage: 0,
      scholarshipDistribution: [],
      totalScholarshipValue: 0,
      totalPayable: 0,
      totalCollected: 0,
      collectionRate: 0,
      cohortProgress: 0,
      dueThisMonth: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
      thisMonthCollected: 0,
      riskStudents: 0,
      completionRate: 0,
      averagePaymentDelay: 0,
    };
  }

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // 1. SCHOLARSHIP ANALYSIS
  const scholarshipStudents = students.filter(
    s =>
      s.scholarship_name &&
      s.scholarship_name !== '' &&
      s.scholarship_name !== null
  );

  // Get scholarship data to extract percentages
  const scholarshipData = await supabase
    .from('cohort_scholarships')
    .select('id, name, amount_percentage')
    .eq('cohort_id', cohortId);

  const scholarshipMap = new Map();
  scholarshipData.data?.forEach(sch => {
    scholarshipMap.set(sch.id, sch);
  });

  // Calculate average scholarship percentage including ALL students (0% for those without scholarships)
  const averageScholarshipPercentage =
    students.length > 0
      ? students.reduce((sum, s) => {
          // Try to get percentage from scholarship data first
          const scholarship = scholarshipMap.get(s.scholarship_id);
          let percentage = 0;

          if (scholarship?.amount_percentage) {
            percentage = parseFloat(scholarship.amount_percentage);
          } else {
            // Fallback to extracting from name
            const nameMatch = s.scholarship_name?.match(/(\d+)%/);
            percentage = nameMatch ? parseInt(nameMatch[1]) : 0;
          }

          return sum + percentage;
        }, 0) / students.length
      : 0;

  // Scholarship distribution analysis - include ALL students
  const scholarshipTiers = ['0-25%', '26-50%', '51-75%', '76-100%'];
  const scholarshipDistribution = scholarshipTiers.map(tier => {
    const [min, max] = tier.split('-').map(p => parseInt(p.replace('%', '')));
    const count = students.filter(s => {
      // Try to get percentage from scholarship data first
      const scholarship = scholarshipMap.get(s.scholarship_id);
      let percentage = 0;

      if (scholarship?.amount_percentage) {
        percentage = parseFloat(scholarship.amount_percentage);
      } else {
        // Fallback to extracting from name
        const nameMatch = s.scholarship_name?.match(/(\d+)%/);
        percentage = nameMatch ? parseInt(nameMatch[1]) : 0;
      }

      return percentage >= min && percentage <= max;
    }).length;
    return {
      tier,
      count,
      percentage: students.length > 0 ? (count / students.length) * 100 : 0,
    };
  });

  const totalScholarshipValue = students.reduce((sum, s) => {
    // Try to get percentage from scholarship data first
    const scholarship = scholarshipMap.get(s.scholarship_id);
    let percentage = 0;

    if (scholarship?.amount_percentage) {
      percentage = parseFloat(scholarship.amount_percentage);
    } else {
      // Fallback to extracting from name
      const nameMatch = s.scholarship_name?.match(/(\d+)%/);
      percentage = nameMatch ? parseInt(nameMatch[1]) : 0;
    }

    const scholarshipAmount = (s.total_amount * percentage) / 100;
    return sum + scholarshipAmount;
  }, 0);

  // 2. COLLECTION METRICS
  const totalPayable = students.reduce(
    (sum, s) => sum + (s.total_amount || 0),
    0
  );
  const totalCollected = students.reduce(
    (sum, s) => sum + (s.paid_amount || 0),
    0
  );

  // Add admission fee to total collected (assumed to be collected for all registered students)
  const admissionFeePerStudent = feeStructure?.admission_fee || 0;
  const totalAdmissionFeesCollected = students.length * admissionFeePerStudent;
  const totalCollectedWithAdmission =
    totalCollected + totalAdmissionFeesCollected;

  const collectionRate =
    totalPayable > 0 ? (totalCollectedWithAdmission / totalPayable) * 100 : 0;

  // 3. COHORT PROGRESS - Calculate based on collection rate (including admission fees)
  const cohortProgress = collectionRate;

  // 4. MONTHLY ANALYSIS - Count individual installment statuses
  // Get all individual installments from all students
  const allInstallments = students.flatMap(s => s.individualInstallments || []);

  // Count pending installments (individual installments with pending status) - OVERALL
  const pendingInstallments = allInstallments.filter(
    inst => inst.status === 'pending' || inst.status === 'pending_10_plus_days'
  );
  const pendingStudents = new Set(
    pendingInstallments.map(inst => inst.student_id)
  ).size;
  const pendingAmount = pendingInstallments.reduce(
    (sum, inst) => sum + (inst.amount_pending || 0),
    0
  );

  // Count overdue installments (individual installments that are overdue) - OVERALL
  const overdueInstallments = allInstallments.filter(
    inst =>
      inst.status === 'overdue' || inst.status === 'partially_paid_overdue'
  );
  const overdueStudents = new Set(
    overdueInstallments.map(inst => inst.student_id)
  ).size;
  const overdueAmount = overdueInstallments.reduce(
    (sum, inst) => sum + (inst.amount_pending || 0),
    0
  );

  // 5. CURRENT MONTH ANALYSIS - Filter for current month only
  const currentMonthInstallments = allInstallments.filter(inst => {
    const dueDate = new Date(inst.due_date);
    return (
      dueDate.getMonth() === currentMonth &&
      dueDate.getFullYear() === currentYear
    );
  });

  // Count pending installments for current month only
  const currentMonthPendingInstallments = currentMonthInstallments.filter(
    inst => inst.status === 'pending' || inst.status === 'pending_10_plus_days'
  );
  const currentMonthPendingStudents = new Set(
    currentMonthPendingInstallments.map(inst => inst.student_id)
  ).size;
  const currentMonthPendingAmount = currentMonthPendingInstallments.reduce(
    (sum, inst) => sum + (inst.amount_pending || 0),
    0
  );

  // Count overdue installments for current month only
  const currentMonthOverdueInstallments = currentMonthInstallments.filter(
    inst =>
      inst.status === 'overdue' || inst.status === 'partially_paid_overdue'
  );
  const currentMonthOverdueStudents = new Set(
    currentMonthOverdueInstallments.map(inst => inst.student_id)
  ).size;
  const currentMonthOverdueAmount = currentMonthOverdueInstallments.reduce(
    (sum, inst) => sum + (inst.amount_pending || 0),
    0
  );

  // For backward compatibility, keep the old structure but with new values
  const dueThisMonth = { count: pendingStudents, amount: pendingAmount };
  const overdue = { count: overdueStudents, amount: overdueAmount };

  // Calculate this month's collected amount
  const thisMonthCollected = students.reduce((sum, s) => {
    if (s.payments && Array.isArray(s.payments)) {
      return (
        sum +
        s.payments
          .filter(p => {
            if (!p.payment_date) return false;
            const paymentDate = new Date(p.payment_date);
            return (
              paymentDate.getMonth() === currentMonth &&
              paymentDate.getFullYear() === currentYear &&
              p.status === 'paid'
            );
          })
          .reduce(
            (paymentSum, p) => paymentSum + (parseFloat(p.amount) || 0),
            0
          )
      );
    }
    return sum;
  }, 0);

  // 5. PERFORMANCE INDICATORS
  const riskStudents = students.filter(
    s =>
      s.aggregate_status === 'overdue' ||
      s.aggregate_status === 'partially_paid_overdue' ||
      ((s.pending_amount || 0) > 0 && s.aggregate_status === 'pending')
  ).length;

  const completionRate =
    students.length > 0
      ? (students.filter(
          s =>
            s.aggregate_status === 'completed' || s.aggregate_status === 'paid'
        ).length /
          students.length) *
        100
      : 0;

  const averagePaymentDelay =
    students.length > 0
      ? students.reduce((sum, s) => {
          return sum + ((s.overdue_amount || 0) > 0 ? 15 : 0);
        }, 0) / students.length
      : 0;

  console.log('🔍 [BATCH] Statistics calculated:', {
    totalStudents: students.length,
    totalPayable,
    totalCollected,
    collectionRate,
    averageScholarshipPercentage,
    currentMonth: currentMonth + 1, // +1 because getMonth() returns 0-11
    currentYear,
    totalInstallments: allInstallments.length,
    // Overall statistics
    pendingInstallments: pendingInstallments.length,
    pendingStudents: pendingStudents,
    pendingAmount: pendingAmount,
    overdueInstallments: overdueInstallments.length,
    overdueStudents: overdueStudents,
    overdueAmount: overdueAmount,
    // Current month statistics
    currentMonthInstallments: currentMonthInstallments.length,
    currentMonthPendingInstallments: currentMonthPendingInstallments.length,
    currentMonthPendingStudents: currentMonthPendingStudents,
    currentMonthPendingAmount: currentMonthPendingAmount,
    currentMonthOverdueInstallments: currentMonthOverdueInstallments.length,
    currentMonthOverdueStudents: currentMonthOverdueStudents,
    currentMonthOverdueAmount: currentMonthOverdueAmount,
    thisMonthCollected,
  });

  return {
    averageScholarshipPercentage,
    scholarshipDistribution,
    totalScholarshipValue,
    totalPayable,
    totalCollected: totalCollectedWithAdmission,
    collectionRate,
    cohortProgress,
    dueThisMonth: {
      count: dueThisMonth.count,
      amount: dueThisMonth.amount,
    },
    overdue: {
      count: overdue.count,
      amount: overdue.amount,
    },
    currentMonthPending: {
      count: currentMonthPendingStudents,
      amount: currentMonthPendingAmount,
    },
    currentMonthOverdue: {
      count: currentMonthOverdueStudents,
      amount: currentMonthOverdueAmount,
    },
    thisMonthCollected,
    riskStudents,
    completionRate,
    averagePaymentDelay,
  };
}
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

  // Handle batch payment summary for dashboard performance
  if (action === 'batch_summary') {
    const { studentIds, cohortId: batchCohortId } = request;

    if (!studentIds || !Array.isArray(studentIds) || !batchCohortId) {
      throw new Error(
        'studentIds array and cohortId are required for batch summary'
      );
    }

    console.log('🚀 [BATCH] Processing batch summary for:', {
      studentCount: studentIds.length,
      cohortId: batchCohortId,
    });

    // Get fee structure once for the entire cohort
    const { feeStructure, scholarships } = await generateFeeStructureReview(
      supabase,
      batchCohortId,
      'instalment_wise', // Default plan for batch processing
      null,
      0,
      null,
      null,
      feeStructureData,
      null
    );

    // Get all student payments for the cohort in one query
    const { data: allStudentPayments, error: spError } = await supabase
      .from('student_payments')
      .select('id, student_id, payment_plan, scholarship_id')
      .eq('cohort_id', batchCohortId)
      .in('student_id', studentIds);

    if (spError) {
      console.error('❌ [BATCH] Error fetching student payments:', spError);
      throw spError;
    }

    // Get all payment transactions for these students in one query
    const paymentIds = allStudentPayments?.map(sp => sp.id) || [];
    const { data: allTransactions, error: txError } = await supabase
      .from('payment_transactions')
      .select(
        'id, amount, verification_status, installment_id, semester_number, payment_method, reference_number, payment_id'
      )
      .in('payment_id', paymentIds);

    if (txError) {
      console.error('❌ [BATCH] Error fetching transactions:', txError);
      throw txError;
    }

    // Get all student scholarships in one query
    const { data: allStudentScholarships, error: schError } = await supabase
      .from('student_scholarships')
      .select(
        `
        student_id,
        scholarship_id,
        additional_discount_percentage,
        scholarship:cohort_scholarships(*)
      `
      )
      .in('student_id', studentIds);

    if (schError) {
      console.error('❌ [BATCH] Error fetching scholarships:', schError);
      throw schError;
    }

    // Create maps for efficient lookup
    const paymentMap = new Map();
    allStudentPayments?.forEach(sp => {
      paymentMap.set(sp.student_id, sp);
    });

    const transactionMap = new Map();
    allTransactions?.forEach(tx => {
      if (!transactionMap.has(tx.payment_id)) {
        transactionMap.set(tx.payment_id, []);
      }
      transactionMap.get(tx.payment_id).push(tx);
    });

    const scholarshipMap = new Map();
    allStudentScholarships?.forEach(sch => {
      scholarshipMap.set(sch.student_id, sch);
    });

    // Process each student efficiently
    const batchResults = await Promise.all(
      studentIds.map(async studentId => {
        try {
          const studentPayment = paymentMap.get(studentId);
          const studentTransactions = studentPayment
            ? transactionMap.get(studentPayment.id) || []
            : [];
          const studentScholarship = scholarshipMap.get(studentId);

          if (!studentPayment) {
            return {
              student_id: studentId,
              total_amount: 0,
              paid_amount: 0,
              pending_amount: 0,
              overdue_amount: 0,
              aggregate_status: 'not_setup',
              payment_plan: 'not_selected',
              scholarship_name: undefined,
              scholarship_id: undefined,
            };
          }

          // Use payment engine for accurate calculations
          let aggregateStatus = 'pending';
          let totalAmount = 0;
          let paidAmount = 0;
          let pendingAmount = 0;
          let overdueAmount = 0;

          const result = {
            student_id: studentId,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            pending_amount: pendingAmount,
            overdue_amount: overdueAmount,
            aggregate_status: aggregateStatus,
            payment_plan: studentPayment.payment_plan || 'not_selected',
            scholarship_name: studentScholarship?.scholarship?.name,
            scholarship_id: studentPayment.scholarship_id,
            student_payment_id: studentPayment.id,
            payments: studentTransactions.map(transaction => ({
              id: transaction.id,
              payment_id: transaction.payment_id,
              amount: transaction.amount,
              payment_date: transaction.payment_date,
              status:
                transaction.verification_status === 'approved'
                  ? 'paid'
                  : 'pending',
              receipt_url:
                transaction.receipt_url || transaction.proof_of_payment_url,
              notes: transaction.notes,
              created_at: transaction.created_at,
              updated_at: transaction.updated_at,
            })),
            total_installments:
              studentPayment.payment_plan === 'one_shot'
                ? 1
                : studentPayment.payment_plan === 'sem_wise'
                  ? 4
                  : 12,
            completed_installments: studentTransactions.filter(
              t => t.verification_status === 'approved'
            ).length,
            individualInstallments: [],
          };

          if (
            studentPayment.payment_plan &&
            studentPayment.payment_plan !== 'not_selected'
          ) {
            try {
              console.log(`🔍 [BATCH] Processing student ${studentId}:`, {
                payment_plan: studentPayment.payment_plan,
                scholarship_id: studentScholarship?.scholarship_id,
                additional_discount:
                  studentScholarship?.additional_discount_percentage || 0,
              });

              const paymentEngineResult = await generateFeeStructureReview(
                supabase,
                batchCohortId,
                studentPayment.payment_plan as any,
                studentScholarship?.scholarship_id,
                studentScholarship?.additional_discount_percentage || 0,
                studentId,
                null,
                feeStructureData,
                null
              );

              console.log(
                `🔍 [BATCH] Payment engine result for student ${studentId}:`,
                {
                  hasBreakdown: !!paymentEngineResult.breakdown,
                  hasOverallSummary:
                    !!paymentEngineResult.breakdown?.overallSummary,
                }
              );

              if (paymentEngineResult.breakdown) {
                // Enrich with statuses using actual transactions
                const { breakdown: enriched, aggregate } = enrichWithStatuses(
                  paymentEngineResult.breakdown,
                  studentTransactions,
                  studentPayment.payment_plan as any
                );

                console.log(
                  `🔍 [BATCH] Enriched breakdown for student ${studentId}:`,
                  {
                    hasOverallSummary: !!enriched?.overallSummary,
                    totalAmountPayable:
                      enriched?.overallSummary?.totalAmountPayable,
                    totalPaid: enriched?.overallSummary?.totalPaid,
                    totalPending: enriched?.overallSummary?.totalPending,
                    paymentStatus: enriched?.overallSummary?.paymentStatus,
                  }
                );

                if (enriched?.overallSummary) {
                  const summary = enriched.overallSummary;
                  totalAmount = summary.totalAmountPayable;
                  paidAmount = summary.totalPaid;
                  pendingAmount = summary.totalPending;
                  aggregateStatus = summary.paymentStatus;

                  if (
                    aggregateStatus === 'overdue' ||
                    aggregateStatus === 'partially_paid_overdue'
                  ) {
                    overdueAmount = pendingAmount;
                  }

                  // Update result object with calculated values
                  result.total_amount = totalAmount;
                  result.paid_amount = paidAmount;
                  result.pending_amount = pendingAmount;
                  result.overdue_amount = overdueAmount;
                  result.aggregate_status = aggregateStatus;
                }

                // Extract individual installment statuses for statistics
                const individualInstallments = [];
                if (enriched?.semesters) {
                  enriched.semesters.forEach(sem => {
                    if (sem.instalments) {
                      sem.instalments.forEach(inst => {
                        individualInstallments.push({
                          id: `${studentId}-sem${sem.semesterNumber}-inst${inst.installmentNumber}`,
                          student_id: studentId,
                          semester: sem.semesterNumber,
                          installment: inst.installmentNumber,
                          status: inst.status,
                          amount: inst.amountPayable || 0,
                          amount_paid: inst.amountPaid || 0,
                          amount_pending: inst.amountPending || 0,
                          due_date: inst.paymentDate,
                        });
                      });
                    }
                  });
                }

                // Add admission fee as an installment if it exists
                if (
                  enriched?.admissionFee &&
                  enriched.admissionFee.totalPayable > 0
                ) {
                  individualInstallments.push({
                    id: `${studentId}-admission`,
                    student_id: studentId,
                    semester: 0,
                    installment: 0,
                    status: 'pending', // Admission fee is typically pending until paid
                    amount: enriched.admissionFee.totalPayable,
                    amount_paid: 0, // This would need to be calculated based on transactions
                    amount_pending: enriched.admissionFee.totalPayable,
                    due_date:
                      enriched.admissionFee.paymentDate ||
                      new Date().toISOString().split('T')[0],
                  });
                }

                // Store individual installments for statistics calculation
                individualInstallments.forEach(inst => {
                  if (!result.individualInstallments) {
                    result.individualInstallments = [];
                  }
                  result.individualInstallments.push(inst);
                });
              }
            } catch (error) {
              console.error(
                `❌ [BATCH] Payment engine error for student ${studentId}:`,
                error
              );
              // Fallback to database calculation
              totalAmount = studentPayment.total_amount_payable || 0;
              paidAmount = studentTransactions
                .filter(t => t.verification_status === 'approved')
                .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
              pendingAmount = Math.max(0, totalAmount - paidAmount);
            }
          } else {
            console.log(
              `⚠️ [BATCH] Student ${studentId} has no valid payment plan:`,
              {
                payment_plan: studentPayment.payment_plan,
              }
            );
          }

          return result;
        } catch (error) {
          console.error(
            `❌ [BATCH] Error processing student ${studentId}:`,
            error
          );
          return {
            student_id: studentId,
            total_amount: 0,
            paid_amount: 0,
            pending_amount: 0,
            overdue_amount: 0,
            aggregate_status: 'error',
            payment_plan: 'not_selected',
            scholarship_name: undefined,
            scholarship_id: undefined,
          };
        }
      })
    );

    console.log('✅ [BATCH] Batch processing completed:', {
      processed: batchResults.length,
      success: batchResults.filter(r => r.aggregate_status !== 'error').length,
    });

    // Calculate cohort statistics server-side
    const statistics = await calculateCohortStatistics(
      batchResults,
      feeStructure,
      supabase,
      batchCohortId
    );

    return {
      success: true,
      data: batchResults,
      feeStructure,
      scholarships,
      statistics,
    };
  }

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
