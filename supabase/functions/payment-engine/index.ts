import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Types (lightweight, internal to function)
type Action = "breakdown" | "status" | "full";

type PaymentPlan = "one_shot" | "sem_wise" | "instalment_wise";

type EdgeRequest = {
  action?: Action;
  studentId?: string;
  cohortId?: string;
  paymentPlan?: PaymentPlan;
  scholarshipId?: string | null;
  additionalDiscountPercentage?: number;
  startDate?: string; // YYYY-MM-DD
};

type InstallmentView = {
  paymentDate: string;
  baseAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  gstAmount: number;
  amountPayable: number;
  // enriched
  status?: string;
  amountPaid?: number;
  amountPending?: number;
  installmentNumber?: number;
};

type SemesterView = {
  semesterNumber: number;
  instalments: InstallmentView[];
  total: {
    baseAmount: number;
    scholarshipAmount: number;
    discountAmount: number;
    gstAmount: number;
    totalPayable: number;
  };
};

type Breakdown = {
  admissionFee: {
    baseAmount: number;
    scholarshipAmount: number;
    discountAmount: number;
    gstAmount: number;
    totalPayable: number;
  };
  semesters: SemesterView[];
  oneShotPayment?: InstallmentView;
  overallSummary: {
    totalProgramFee: number;
    admissionFee: number;
    totalGST: number;
    totalDiscount: number;
    totalScholarship: number;
    totalAmountPayable: number;
  };
};

type EdgeResponse = {
  success: boolean;
  error?: string;
  breakdown?: Breakdown;
  aggregate?: {
    totalPayable: number;
    totalPaid: number;
    totalPending: number;
    nextDueDate: string | null;
    paymentStatus: string;
  };
};

// Basic helpers copied from app logic (minimal subset)
const GST_RATE = 18;
const calculateGST = (baseAmount: number): number => {
  return Math.round(baseAmount * (GST_RATE / 100) * 100) / 100;
};
const extractGSTFromTotal = (totalAmount: number): number => {
  const baseAmount = totalAmount / (1 + GST_RATE / 100);
  const gstAmount = totalAmount - baseAmount;
  return Math.round(gstAmount * 100) / 100;
};
const extractBaseAmountFromTotal = (totalAmount: number): number => {
  return Math.round((totalAmount / (1 + GST_RATE / 100)) * 100) / 100;
};
const calculateOneShotDiscount = (baseAmount: number, discountPercentage: number): number => {
  return Math.round(baseAmount * (discountPercentage / 100) * 100) / 100;
};
const getInstalmentDistribution = (instalmentsPerSemester: number): number[] => {
  switch (instalmentsPerSemester) {
    case 2:
      return [60, 40];
    case 3:
      return [40, 40, 20];
    case 4:
      return [30, 30, 30, 10];
    default: {
      const percentage = 100 / instalmentsPerSemester;
      return Array(instalmentsPerSemester).fill(percentage);
    }
  }
};
const distributeScholarshipBackwards = (installmentAmounts: number[], totalScholarshipAmount: number): number[] => {
  const scholarshipDistribution = new Array(installmentAmounts.length).fill(0);
  let remainingScholarship = totalScholarshipAmount;
  for (let i = installmentAmounts.length - 1; i >= 0 && remainingScholarship > 0; i--) {
    const installmentAmount = installmentAmounts[i];
    const scholarshipForThisInstallment = Math.min(remainingScholarship, installmentAmount);
    scholarshipDistribution[i] = scholarshipForThisInstallment;
    remainingScholarship -= scholarshipForThisInstallment;
  }
  return scholarshipDistribution;
};
const generateSemesterPaymentDates = (semesterNumber: number, instalmentsPerSemester: number, cohortStartDate: string): string[] => {
  const startDate = new Date(cohortStartDate);
  let semesterStartDate: Date;
  if (semesterNumber === 1) {
    semesterStartDate = new Date(startDate);
  } else {
    semesterStartDate = new Date(startDate);
    semesterStartDate.setMonth(startDate.getMonth() + (semesterNumber - 1) * 6);
  }
  const paymentDates: string[] = [];
  for (let i = 0; i < instalmentsPerSemester; i++) {
    const paymentDate = new Date(semesterStartDate);
    paymentDate.setMonth(semesterStartDate.getMonth() + i * 2); // 2 months apart
    paymentDates.push(paymentDate.toISOString().split('T')[0]);
  }
  return paymentDates;
};

const calculateOneShotPayment = (
  totalProgramFee: number,
  admissionFee: number,
  discountPercentage: number,
  scholarshipAmount: number,
  cohortStartDate: string,
): InstallmentView => {
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const admissionFeeGST = extractGSTFromTotal(admissionFee);
  const remainingBaseFee = totalProgramFee - admissionFeeBase;
  const baseAmount = remainingBaseFee;
  const oneShotDiscount = calculateOneShotDiscount(totalProgramFee, discountPercentage);
  const amountAfterDiscount = baseAmount - oneShotDiscount;
  const amountAfterScholarship = amountAfterDiscount - scholarshipAmount;
  const baseFeeGST = calculateGST(amountAfterScholarship);
  const finalAmount = amountAfterScholarship + baseFeeGST;
  return {
    paymentDate: cohortStartDate,
    baseAmount,
    gstAmount: baseFeeGST,
    scholarshipAmount,
    discountAmount: oneShotDiscount,
    amountPayable: Math.max(0, finalAmount),
  };
};

const calculateSemesterPayment = (
  semesterNumber: number,
  totalProgramFee: number,
  admissionFee: number,
  numberOfSemesters: number,
  instalmentsPerSemester: number,
  cohortStartDate: string,
  scholarshipAmount: number,
  oneShotDiscount: number,
): InstallmentView[] => {
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const remainingBaseFee = totalProgramFee - admissionFeeBase;
  const semesterFee = remainingBaseFee / numberOfSemesters;
  const installmentPercentages = getInstalmentDistribution(instalmentsPerSemester);
  const installmentAmounts = installmentPercentages.map((percentage) => Math.round(semesterFee * (percentage / 100) * 100) / 100);
  const isLastSemester = semesterNumber === numberOfSemesters;
  const semesterScholarship = isLastSemester ? scholarshipAmount : 0;
  const scholarshipDistribution = isLastSemester ? distributeScholarshipBackwards(installmentAmounts, semesterScholarship) : new Array(installmentAmounts.length).fill(0);
  const semesterDiscount = oneShotDiscount / numberOfSemesters;
  const discountPerInstallment = semesterDiscount / instalmentsPerSemester;
  const paymentDates = generateSemesterPaymentDates(semesterNumber, instalmentsPerSemester, cohortStartDate);
  const installments: InstallmentView[] = [];
  for (let i = 0; i < instalmentsPerSemester; i++) {
    const installmentAmount = installmentAmounts[i];
    const installmentScholarship = scholarshipDistribution[i];
    const installmentDiscount = discountPerInstallment;
    const installmentAfterDiscount = installmentAmount - installmentDiscount;
    const installmentAfterScholarship = installmentAfterDiscount - installmentScholarship;
    const installmentGST = calculateGST(installmentAfterScholarship);
    const finalAmount = installmentAfterScholarship + installmentGST;
    installments.push({
      paymentDate: paymentDates[i],
      baseAmount: installmentAmount,
      gstAmount: installmentGST,
      scholarshipAmount: installmentScholarship,
      discountAmount: installmentDiscount,
      amountPayable: Math.max(0, finalAmount),
      installmentNumber: i + 1,
    });
  }
  return installments;
};

// Apply JSON overrides to dates (shallow merge by known keys)
function applyDateOverrides(
  plan: PaymentPlan,
  startDate: string,
  semesters: SemesterView[],
  oneShotPayment: InstallmentView | undefined,
  overrides: any,
) {
  try {
    if (!overrides || typeof overrides !== 'object') return;
    if (plan === 'one_shot' && oneShotPayment) {
      const os = overrides?.one_shot;
      if (os?.program_fee_due_date) oneShotPayment.paymentDate = os.program_fee_due_date;
    }
    if (plan === 'sem_wise' || plan === 'instalment_wise') {
      const semJson = overrides?.sem_wise || overrides?.instalment_wise || overrides?.semesters;
      if (semJson) {
        semesters.forEach((s) => {
          const key = `semester_${s.semesterNumber}`;
          const semOverride = semJson[key] || semJson[s.semesterNumber] || semJson[`semester-${s.semesterNumber}`];
          if (!semOverride) return;
          s.instalments?.forEach((inst, idx) => {
            const instKey = `installment_${idx + 1}`;
            const value = semOverride[instKey] || semOverride[idx + 1] || semOverride[`installment-${idx + 1}`] || semOverride;
            if (typeof value === 'string') inst.paymentDate = value;
          });
        });
      }
    }
  } catch (_) {}
}

const generateFeeStructureReview = async (
  supabase: any,
  cohortId: string,
  paymentPlan: PaymentPlan,
  selectedScholarshipId: string | null | undefined,
  additionalScholarshipPercentage: number,
  cohortStartDateOverride?: string,
  studentId?: string,
): Promise<Breakdown> => {
  // Load fee structure and scholarships
  // Prefer a custom structure if one exists for this cohort (simple heuristic; client can pass student later)
  let feeStructure: any | null = null;
  if (studentId) {
    const { data: customFsExact } = await supabase
      .from('fee_structures')
      .select('cohort_id,total_program_fee,admission_fee,number_of_semesters,instalments_per_semester,one_shot_discount_percentage,custom_dates_enabled,payment_schedule_dates,structure_type,student_id')
      .eq('cohort_id', cohortId)
      .eq('structure_type', 'custom')
      .eq('student_id', studentId)
      .maybeSingle();
    if (customFsExact) feeStructure = customFsExact;
  }
  if (!feeStructure) {
    const { data: cohortFs, error: fsErr2 } = await supabase
      .from('fee_structures')
      .select('cohort_id,total_program_fee,admission_fee,number_of_semesters,instalments_per_semester,one_shot_discount_percentage,custom_dates_enabled,payment_schedule_dates,structure_type')
      .eq('cohort_id', cohortId)
      .eq('structure_type', 'cohort')
      .single();
    if (fsErr2 || !cohortFs) throw new Error('Fee structure not found');
    feeStructure = cohortFs;
  }

  // Load cohort for start_date
  const { data: cohort, error: cohErr } = await supabase
    .from("cohorts")
    .select("start_date")
    .eq("id", cohortId)
    .single();
  if (cohErr || !cohort) throw new Error("Cohort not found");
  const startDate: string = (cohortStartDateOverride && cohortStartDateOverride.length > 0) ? cohortStartDateOverride : (cohort.start_date as string);

  // Load scholarships to resolve percentage
  let scholarshipAmount = 0;
  if (selectedScholarshipId) {
    const { data: sch, error: schErr } = await supabase
      .from("cohort_scholarships")
      .select("id, amount_percentage")
      .eq("id", selectedScholarshipId)
      .single();
    if (!schErr && sch && typeof sch.amount_percentage === "number") {
      const basePct = sch.amount_percentage;
      const totalPct = basePct + (additionalScholarshipPercentage || 0);
      scholarshipAmount = Math.round(feeStructure.total_program_fee * (totalPct / 100) * 100) / 100;
    }
  } else if (additionalScholarshipPercentage && additionalScholarshipPercentage > 0) {
    const totalPct = additionalScholarshipPercentage;
    scholarshipAmount = Math.round(feeStructure.total_program_fee * (totalPct / 100) * 100) / 100;
  }

  // Admission fee block
  const admissionFeeBase = extractBaseAmountFromTotal(feeStructure.admission_fee);
  const admissionFeeGST = extractGSTFromTotal(feeStructure.admission_fee);

  const semesters: SemesterView[] = [];
  let oneShotPayment: InstallmentView | undefined = undefined;

  if (paymentPlan === "sem_wise" || paymentPlan === "instalment_wise") {
    const installmentsPerSemester = paymentPlan === "sem_wise" ? 1 : feeStructure.instalments_per_semester;
    for (let sem = 1; sem <= feeStructure.number_of_semesters; sem++) {
      const semesterInstallments = calculateSemesterPayment(
        sem,
        feeStructure.total_program_fee,
        feeStructure.admission_fee,
        feeStructure.number_of_semesters,
        installmentsPerSemester,
        startDate,
        scholarshipAmount,
        0,
      );
      const semesterTotal = {
        scholarshipAmount: semesterInstallments.reduce((sum, inst) => sum + (inst.scholarshipAmount || 0), 0),
        baseAmount: semesterInstallments.reduce((sum, inst) => sum + (inst.baseAmount || 0), 0),
        gstAmount: semesterInstallments.reduce((sum, inst) => sum + (inst.gstAmount || 0), 0),
        discountAmount: semesterInstallments.reduce((sum, inst) => sum + (inst.discountAmount || 0), 0),
        totalPayable: semesterInstallments.reduce((sum, inst) => sum + (inst.amountPayable || 0), 0),
      };
      semesters.push({ semesterNumber: sem, instalments: semesterInstallments, total: semesterTotal });
    }
  }

  if (paymentPlan === "one_shot") {
    oneShotPayment = calculateOneShotPayment(
      feeStructure.total_program_fee,
      feeStructure.admission_fee,
      feeStructure.one_shot_discount_percentage,
      scholarshipAmount,
      startDate,
    );
  }

  // Apply overrides if enabled
  if (feeStructure?.custom_dates_enabled) {
    applyDateOverrides(paymentPlan, startDate, semesters, oneShotPayment, feeStructure?.payment_schedule_dates);
  }

  const totalSemesterAmount = semesters.reduce((sum, s) => sum + (s.total?.totalPayable || 0), 0);
  const totalSemesterGST = semesters.reduce((sum, s) => sum + (s.total?.gstAmount || 0), 0);
  const totalSemesterScholarship = semesters.reduce((sum, s) => sum + (s.total?.scholarshipAmount || 0), 0);
  const totalSemesterDiscount = semesters.reduce((sum, s) => sum + (s.total?.discountAmount || 0), 0);
  const totalAmountPayable = feeStructure.admission_fee + totalSemesterAmount + (oneShotPayment?.amountPayable || 0);

  const breakdown: Breakdown = {
    admissionFee: {
      baseAmount: admissionFeeBase,
      scholarshipAmount: 0,
      discountAmount: 0,
      gstAmount: admissionFeeGST,
      totalPayable: feeStructure.admission_fee,
    },
    semesters,
    oneShotPayment,
    overallSummary: {
      totalProgramFee: feeStructure.total_program_fee,
      admissionFee: feeStructure.admission_fee,
      totalGST: totalSemesterGST + admissionFeeGST + (oneShotPayment?.gstAmount || 0),
      totalDiscount: totalSemesterDiscount + (oneShotPayment?.discountAmount || 0),
      totalScholarship: totalSemesterScholarship + (oneShotPayment?.scholarshipAmount || 0),
      totalAmountPayable: Math.max(0, totalAmountPayable),
    },
  };
  return breakdown;
};

// Status derivation helpers
const normalizeDateOnly = (isoDate: string): number => {
  const d = new Date(isoDate);
  const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return n.getTime();
};

const deriveInstallmentStatus = (
  dueDate: string,
  totalPayable: number,
  allocatedPaid: number,
  hasVerificationPendingTx: boolean,
  hasApprovedTx: boolean,
): string => {
  const today = new Date();
  const d0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const d1 = normalizeDateOnly(dueDate);
  const daysUntilDue = Math.ceil((d1 - d0) / (1000 * 60 * 60 * 24));

  if (hasApprovedTx && allocatedPaid >= totalPayable) {
    return "paid";
  }
  if (hasVerificationPendingTx && allocatedPaid > 0) {
    if (allocatedPaid >= totalPayable) return "verification_pending";
    return "partially_paid_verification_pending";
  }
  if (allocatedPaid >= totalPayable) return "paid";
  if (daysUntilDue < 0) return allocatedPaid > 0 ? "partially_paid_overdue" : "overdue";
  if (allocatedPaid > 0) return "partially_paid_days_left";
  if (daysUntilDue >= 10) return "pending_10_plus_days";
  return "pending";
};

const enrichWithStatuses = (
  breakdown: Breakdown,
  transactions: Array<{ amount: number; verification_status: string | null }>,
  plan: PaymentPlan,
): { breakdown: Breakdown; aggregate: { totalPayable: number; totalPaid: number; totalPending: number; nextDueDate: string | null; paymentStatus: string } } => {
  const relevantPaid = Array.isArray(transactions)
    ? transactions.reduce((sum, t) => {
        if (t && (t.verification_status === "approved" || t.verification_status === "verification_pending")) {
          return sum + (Number(t.amount) || 0);
        }
        return sum;
      }, 0)
    : 0;
  const hasVerificationPendingTx = Array.isArray(transactions)
    ? transactions.some((t) => t && t.verification_status === "verification_pending")
    : false;
  const hasApprovedTx = Array.isArray(transactions)
    ? transactions.some((t) => t && t.verification_status === "approved")
    : false;

  // Total payable excludes admission fee from schedule calculations displayed to the student, but we will include it in aggregate total.
  const admissionFeePayable = breakdown.admissionFee?.totalPayable || 0;

  let totalPayableSchedule = 0;
  const dueItems: Array<{ dueDate: string; pending: number; status: string }> = [];
  let paidCursor = relevantPaid;

  if (plan === "one_shot" && breakdown.oneShotPayment) {
    const total = Number(breakdown.oneShotPayment.amountPayable || 0);
    const allocated = Math.min(paidCursor, total);
    paidCursor = Math.max(0, paidCursor - allocated);
    const status = deriveInstallmentStatus(
      String(breakdown.oneShotPayment.paymentDate || new Date().toISOString().split("T")[0]),
      total,
      allocated,
      hasVerificationPendingTx,
      hasApprovedTx,
    );
    breakdown.oneShotPayment.status = status;
    breakdown.oneShotPayment.amountPaid = allocated;
    breakdown.oneShotPayment.amountPending = Math.max(0, total - allocated);
    totalPayableSchedule += total;
    dueItems.push({ dueDate: breakdown.oneShotPayment.paymentDate, pending: breakdown.oneShotPayment.amountPending, status });
  }

  breakdown.semesters?.forEach((sem) => {
    sem.instalments?.forEach((inst) => {
      const total = Number(inst.amountPayable || 0);
      const allocated = Math.min(paidCursor, total);
      paidCursor = Math.max(0, paidCursor - allocated);
      const status = deriveInstallmentStatus(
        String(inst.paymentDate || new Date().toISOString().split("T")[0]),
        total,
        allocated,
        hasVerificationPendingTx,
        hasApprovedTx,
      );
      inst.status = status;
      inst.amountPaid = allocated;
      inst.amountPending = Math.max(0, total - allocated);
      totalPayableSchedule += total;
      dueItems.push({ dueDate: inst.paymentDate, pending: inst.amountPending, status });
    });
  });

  const totalPayable = admissionFeePayable + totalPayableSchedule;
  const totalPaid = Math.min(relevantPaid, totalPayableSchedule); // do not count admission fee here
  const totalPending = Math.max(0, totalPayableSchedule - totalPaid);

  // Next due date: earliest due with pending > 0
  const nextDue = dueItems
    .filter((d) => (Number(d.pending) || 0) > 0)
    .sort((a, b) => normalizeDateOnly(a.dueDate) - normalizeDateOnly(b.dueDate))[0]?.dueDate || null;

  // Aggregate status
  let aggStatus = "pending";
  const anyOverdue = dueItems.some((d) => d.status === "overdue" || d.status === "partially_paid_overdue");
  if (totalPending <= 0 && (hasApprovedTx || !hasVerificationPendingTx)) aggStatus = "paid";
  else if (hasVerificationPendingTx) aggStatus = "verification_pending";
  else if (anyOverdue) aggStatus = "overdue";
  else if (totalPaid > 0) aggStatus = "partially_paid_days_left";
  else {
    // derive based on nearest due
    if (nextDue) {
      const today = new Date();
      const d0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const d1 = normalizeDateOnly(nextDue);
      const daysUntilDue = Math.ceil((d1 - d0) / (1000 * 60 * 60 * 24));
      aggStatus = daysUntilDue >= 10 ? "pending_10_plus_days" : "pending";
    } else {
      aggStatus = "pending";
    }
  }

  return {
    breakdown,
    aggregate: {
      totalPayable,
      totalPaid,
      totalPending,
      nextDueDate: nextDue,
      paymentStatus: aggStatus,
    },
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action = "full", studentId, cohortId, paymentPlan, scholarshipId, additionalDiscountPercentage = 0, startDate }: EdgeRequest = await req.json();

    if (!cohortId) throw new Error("cohortId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve payment plan and payment record if student is provided
    let resolvedPlan: PaymentPlan | undefined = paymentPlan;
    let studentPaymentId: string | null = null;
    let effectiveScholarshipId = scholarshipId;

    if (studentId) {
      const { data: sp } = await supabase
        .from("student_payments")
        .select("id, payment_plan, scholarship_id")
        .eq("student_id", studentId)
        .eq("cohort_id", cohortId)
        .maybeSingle();
      if (sp) {
        studentPaymentId = sp.id;
        if (!resolvedPlan && sp.payment_plan) resolvedPlan = sp.payment_plan as PaymentPlan;
        if (!effectiveScholarshipId && sp.scholarship_id) effectiveScholarshipId = sp.scholarship_id as string;
      }
    }

    if (!resolvedPlan) throw new Error("paymentPlan is required when no student payment record exists");

    // Build breakdown
    const breakdown = await generateFeeStructureReview(
      supabase,
      cohortId,
      resolvedPlan,
      effectiveScholarshipId,
      additionalDiscountPercentage || 0,
      startDate,
      studentId,
    );

    if (action === "breakdown") {
      const response: EdgeResponse = { success: true, breakdown };
      return new Response(JSON.stringify(response), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // Load transactions if we need statuses/aggregates
    let transactions: Array<{ amount: number; verification_status: string | null }> = [];
    if (studentPaymentId) {
      const { data: tx } = await supabase
        .from("payment_transactions")
        .select("amount, verification_status")
        .eq("payment_id", studentPaymentId);
      transactions = Array.isArray(tx) ? tx as any : [];
    }

    const { breakdown: enriched, aggregate } = enrichWithStatuses(breakdown, transactions, resolvedPlan);

    if (action === "status") {
      const response: EdgeResponse = { success: true, aggregate };
      return new Response(JSON.stringify(response), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    const response: EdgeResponse = { success: true, breakdown: enriched, aggregate };
    return new Response(JSON.stringify(response), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error: any) {
    console.error("payment-engine error:", error);
    const response: EdgeResponse = { success: false, error: error?.message || "Unknown error" };
    return new Response(JSON.stringify(response), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});


