import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Types (lightweight, internal to function)
type Action = 'breakdown' | 'status' | 'full' | 'partial_calculation' | 'admin_partial_approval' | 'partial_config';

type PaymentPlan = 'one_shot' | 'sem_wise' | 'instalment_wise';

type EdgeRequest = {
  action?: Action;
  studentId?: string;
  cohortId?: string;
  paymentPlan?: PaymentPlan;
  scholarshipId?: string | null;
  scholarshipData?: {
    // For temporary scholarships in preview mode
    id: string;
    amount_percentage: number;
    name: string;
  } | null;
  additionalDiscountPercentage?: number;
  // startDate removed - dates come from database only
  customDates?: Record<string, string>; // For preview with custom dates
  // Partial payment specific fields
  installmentId?: string;
  approvedAmount?: number;
  transactionId?: string;
  approvalType?: 'full' | 'partial' | 'reject';
  adminNotes?: string;
  rejectionReason?: string;
  allowPartialPayments?: boolean;
  feeStructureData?: {
    // For preview mode when no saved structure exists
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    // Custom dates configuration (optional in preview mode)
    custom_dates_enabled?: boolean;
    one_shot_dates?: Record<string, unknown>; // JSON data for one-shot payment dates
    sem_wise_dates?: Record<string, unknown>; // JSON data for semester-wise payment dates
    instalment_wise_dates?: Record<string, unknown>; // JSON data for installment-wise payment dates
  };
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
  feeStructure?: {
    id: string;
    cohort_id: string;
    student_id?: string | null;
    structure_type: 'cohort' | 'custom';
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    is_setup_complete: boolean;
    custom_dates_enabled: boolean;
    one_shot_dates: Record<string, unknown>;
    sem_wise_dates: Record<string, unknown>;
    instalment_wise_dates: Record<string, unknown>;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
  };
  aggregate?: {
    totalPayable: number;
    totalPaid: number;
    totalPending: number;
    nextDueDate: string | null;
    paymentStatus: string;
  };
  debug?: unknown;
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
const calculateOneShotDiscount = (
  baseAmount: number,
  discountPercentage: number
): number => {
  return Math.round(baseAmount * (discountPercentage / 100) * 100) / 100;
};
const getInstalmentDistribution = (
  instalmentsPerSemester: number
): number[] => {
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
const distributeScholarshipBackwards = (
  installmentAmounts: number[],
  totalScholarshipAmount: number
): number[] => {
  const scholarshipDistribution = new Array(installmentAmounts.length).fill(0);
  let remainingScholarship = totalScholarshipAmount;
  for (
    let i = installmentAmounts.length - 1;
    i >= 0 && remainingScholarship > 0;
    i--
  ) {
    const installmentAmount = installmentAmounts[i];
    const scholarshipForThisInstallment = Math.min(
      remainingScholarship,
      installmentAmount
    );
    scholarshipDistribution[i] = scholarshipForThisInstallment;
    remainingScholarship -= scholarshipForThisInstallment;
  }
  return scholarshipDistribution;
};
// Date generation removed - edge function only uses database dates

const calculateOneShotPayment = (
  totalProgramFee: number,
  admissionFee: number,
  discountPercentage: number,
  scholarshipAmount: number
): InstallmentView => {
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const admissionFeeGST = extractGSTFromTotal(admissionFee);
  const remainingBaseFee = totalProgramFee - admissionFeeBase;
  const baseAmount = remainingBaseFee;
  // Calculate discount on the total program fee (as per business requirement)
  const oneShotDiscount = calculateOneShotDiscount(
    totalProgramFee,
    discountPercentage
  );
  const amountAfterDiscount = baseAmount - oneShotDiscount;
  const amountAfterScholarship = amountAfterDiscount - scholarshipAmount;
  const baseFeeGST = calculateGST(amountAfterScholarship);
  const finalAmount = amountAfterScholarship + baseFeeGST;
  return {
    paymentDate: '', // Will be set from database dates only
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
  scholarshipAmount: number,
  oneShotDiscount: number
): InstallmentView[] => {
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const remainingBaseFee = totalProgramFee - admissionFeeBase;
  const semesterFee = remainingBaseFee / numberOfSemesters;
  const installmentPercentages = getInstalmentDistribution(
    instalmentsPerSemester
  );
  const installmentAmounts = installmentPercentages.map(
    percentage => Math.round(semesterFee * (percentage / 100) * 100) / 100
  );
  const isLastSemester = semesterNumber === numberOfSemesters;
  const semesterScholarship = isLastSemester ? scholarshipAmount : 0;
  const scholarshipDistribution = isLastSemester
    ? distributeScholarshipBackwards(installmentAmounts, semesterScholarship)
    : new Array(installmentAmounts.length).fill(0);
  const semesterDiscount = oneShotDiscount / numberOfSemesters;
  const discountPerInstallment = semesterDiscount / instalmentsPerSemester;
  const installments: InstallmentView[] = [];
  for (let i = 0; i < instalmentsPerSemester; i++) {
    const installmentAmount = installmentAmounts[i];
    const installmentScholarship = scholarshipDistribution[i];
    const installmentDiscount = discountPerInstallment;
    const installmentAfterDiscount = installmentAmount - installmentDiscount;
    const installmentAfterScholarship =
      installmentAfterDiscount - installmentScholarship;
    const installmentGST = calculateGST(installmentAfterScholarship);
    const finalAmount = installmentAfterScholarship + installmentGST;
    installments.push({
      paymentDate: '', // Will be set from database dates only
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

// Convert database plan-specific JSON structure to UI date keys format
function convertPlanSpecificJsonToDateKeys(
  planJson: Record<string, unknown>,
  paymentPlan: PaymentPlan
): Record<string, string> {
  const editable: Record<string, string> = {};

  console.log('🔍 Converting plan-specific JSON to date keys:', { planJson, paymentPlan });

  if (paymentPlan === 'one_shot') {
    // Handle both nested and flat formats for one-shot
    // Nested: {"program_fee_due_date": "2025-08-20"}
    // Flat: {"one-shot": "2025-08-20"}
    const due = (planJson as { program_fee_due_date?: string }).program_fee_due_date;
    const flatDue = (planJson as { 'one-shot'?: string })['one-shot'];
    
    if (due) {
      editable['one-shot'] = due;
      console.log('✅ Converted nested one-shot date:', due);
    } else if (flatDue) {
      editable['one-shot'] = flatDue;
      console.log('✅ Converted flat one-shot date:', flatDue);
    }
  } else if (paymentPlan === 'sem_wise') {
    // Check for nested format first
    const semesters = (planJson as { semesters?: Record<string, { due_date?: string }> }).semesters;
    
    if (semesters) {
      // Nested format: {"semesters": {"semester_1": {"due_date": "..."}}}
      Object.keys(semesters).forEach(semesterKey => {
        const semesterData = semesters[semesterKey];
        if (semesterData?.due_date) {
          const semesterNum = semesterKey.replace('semester_', '');
          editable[`semester-${semesterNum}-instalment-0`] = semesterData.due_date;
          console.log(`✅ Converted nested sem-wise date for semester ${semesterNum}:`, semesterData.due_date);
        }
      });
    } else {
      // Flat format: {"semester-1-instalment-0": "2025-09-02", ...}
      Object.keys(planJson).forEach(key => {
        if (typeof planJson[key] === 'string' && key.includes('semester-') && key.includes('instalment-0')) {
          editable[key] = planJson[key] as string;
          console.log(`✅ Converted flat sem-wise date for ${key}:`, planJson[key]);
        }
      });
    }
  } else if (paymentPlan === 'instalment_wise') {
    // Check for nested format first
    const semesters = (planJson as { semesters?: Record<string, { installments?: Record<string, string> }> }).semesters;
    
    if (semesters) {
      // Nested format: {"semesters": {"semester_1": {"installments": {"installment_1": "..."}}}}
      Object.keys(semesters).forEach(semesterKey => {
        const semesterData = semesters[semesterKey];
        const semesterNum = semesterKey.replace('semester_', '');

        if (semesterData?.installments) {
          Object.keys(semesterData.installments).forEach(installmentKey => {
            const installmentNum = installmentKey.replace('installment_', '');
            const dateKey = `semester-${semesterNum}-instalment-${installmentNum}`;
            editable[dateKey] = semesterData.installments![installmentKey];
            console.log(`✅ Converted nested instalment-wise date for ${dateKey}:`, semesterData.installments![installmentKey]);
          });
        }
      });
    } else {
      // Flat format: {"semester-1-instalment-0": "2025-08-19", ...}
      Object.keys(planJson).forEach(key => {
        if (typeof planJson[key] === 'string' && key.includes('semester-') && key.includes('instalment-')) {
          editable[key] = planJson[key] as string;
          console.log(`✅ Converted flat instalment-wise date for ${key}:`, planJson[key]);
        }
      });
    }
  }

  console.log('🏁 Final converted date keys:', editable);
  return editable;
}

// Utility to safely add months to a YYYY-MM-DD date string
function addMonths(dateIso: string, monthsToAdd: number): string {
  try {
    const d = new Date(dateIso);
    d.setHours(12, 0, 0, 0); // avoid DST issues
    d.setMonth(d.getMonth() + monthsToAdd);
    return d.toISOString().split('T')[0];
  } catch (_) {
    return dateIso;
  }
}

// Generate default date keys in the same UI format used by the app
function generateDefaultUiDateKeys(
  plan: PaymentPlan,
  startDate: string,
  numberOfSemesters: number,
  instalmentsPerSemester: number
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!startDate) return out;

  if (plan === 'one_shot') {
    out['one-shot'] = startDate;
    return out;
  }

  if (plan === 'sem_wise') {
    for (let sem = 1; sem <= numberOfSemesters; sem++) {
      const offset = (sem - 1) * 6; // 6 months per semester
      out[`semester-${sem}-instalment-0`] = addMonths(startDate, offset);
    }
    return out;
  }

  // instalment_wise → monthly installments within each semester
  for (let sem = 1; sem <= numberOfSemesters; sem++) {
    for (let i = 0; i < instalmentsPerSemester; i++) {
      const offset = (sem - 1) * 6 + i;
      out[`semester-${sem}-instalment-${i}`] = addMonths(startDate, offset);
    }
  }
  return out;
}

// Apply JSON overrides to dates (shallow merge by known keys)
function applyDateOverrides(
  plan: PaymentPlan,
  startDate: string,
  semesters: SemesterView[],
  oneShotPayment: InstallmentView | undefined,
  overrides: Record<string, unknown> | null | undefined
) {
  try {
    if (!overrides || typeof overrides !== 'object') return;

    // One-shot: only set program fee due date
    if (plan === 'one_shot' && oneShotPayment) {
      // Handle nested structure (from UI custom dates): {one_shot: {program_fee_due_date: "..."}}
      const os =
        (
          overrides as {
            one_shot?: { program_fee_due_date?: string };
            oneShot?: { program_fee_due_date?: string };
          }
        ).one_shot ||
        (overrides as { oneShot?: { program_fee_due_date?: string } }).oneShot;
      if (os?.program_fee_due_date) {
        oneShotPayment.paymentDate = os.program_fee_due_date;
        console.log(
          '✅ Applied nested one-shot date:',
          os.program_fee_due_date
        );
      }
      // Handle flat structure (from database): {program_fee_due_date: "..."}
      else if (
        (overrides as { program_fee_due_date?: string }).program_fee_due_date
      ) {
        console.log(
          '🔥 CRITICAL: About to apply flat one-shot date from database:',
          {
            originalDate: oneShotPayment.paymentDate,
            newCustomDate: (overrides as { program_fee_due_date?: string })
              .program_fee_due_date,
          }
        );
        oneShotPayment.paymentDate = (
          overrides as { program_fee_due_date?: string }
        ).program_fee_due_date as string;
        console.log(
          '✅ Applied flat one-shot date:',
          oneShotPayment.paymentDate
        );
      }
      // Handle UI flat key: { 'one-shot': 'YYYY-MM-DD' }
      else if ((overrides as Record<string, unknown>)['one-shot']) {
        const v = String((overrides as Record<string, unknown>)['one-shot']);
        oneShotPayment.paymentDate = v;
        console.log('✅ Applied UI key one-shot date:', v);
      }
    }

    // For sem-wise: single date per semester
    if (plan === 'sem_wise') {
      const semNested = (overrides as {
        semesters?: Record<string, { due_date?: string }>;
      }).semesters;
      if (semNested) {
        semesters.forEach(s => {
          const k = `semester_${s.semesterNumber}`;
          const v = semNested[k]?.due_date;
          if (typeof v === 'string' && s.instalments?.[0]) {
            s.instalments[0].paymentDate = v;
          }
        });
      }
      // UI flat keys like semester-1-instalment-0
      const keys = Object.keys(overrides as Record<string, unknown>);
      if (keys.some(k => k.startsWith('semester-'))) {
        semesters.forEach(s => {
          const key = `semester-${s.semesterNumber}-instalment-0`;
          const v = (overrides as Record<string, unknown>)[key];
          if (typeof v === 'string' && s.instalments?.[0]) {
            s.instalments[0].paymentDate = v as string;
          }
        });
      }
    }

    // For instalment-wise: set per-installment dates within each semester
    // Accept either nested { semesters: { semester_1: { installments: { installment_1: "..." } } } }
    // or flat { "1-1": "..." }
    if (plan === 'instalment_wise') {
      // Prefer nested structure
      const semJson =
        ((
          overrides as {
            semesters?: Record<
              string,
              { installments?: Record<string, string> }
            >;
          }
        ).semesters as
          | Record<string, { installments?: Record<string, string> }>
          | undefined) || (overrides as Record<string, unknown>);

      if (semJson && 'semesters' in (overrides as Record<string, unknown>)) {
        semesters.forEach(s => {
          const key = `semester_${s.semesterNumber}`;
          const semOverride =
            (semJson as Record<string, unknown>)[key] ||
            (semJson as Record<string, unknown>)[s.semesterNumber] ||
            (semJson as Record<string, unknown>)[
              `semester-${s.semesterNumber}`
            ];
          if (!semOverride) return;

          s.instalments?.forEach((inst, idx) => {
            const instKey = `installment_${idx + 1}`;
            let value: unknown = undefined;
            if (typeof semOverride === 'string') {
              // Simple per-semester date (applies to all installments in that semester)
              value = semOverride;
            } else if (semOverride && typeof semOverride === 'object') {
              value =
                (semOverride as Record<string, unknown>)[instKey] ||
                (semOverride as Record<string, unknown>)[idx + 1] ||
                (semOverride as Record<string, unknown>)[
                  `installment-${idx + 1}`
                ];
            }
            if (typeof value === 'string') inst.paymentDate = value;
          });
        });
      } else {
        // Handle UI flat keys like 'semester-2-instalment-1'
        Object.entries(overrides as Record<string, unknown>).forEach(([k, v]) => {
          if (typeof v !== 'string') return;
          const m = k.match(/^semester-(\d+)-instalment-(\d+)$/);
          if (!m) return;
          const semNum = Number(m[1]);
          const instIdx = Number(m[2]);
          const sem = semesters.find(s => s.semesterNumber === semNum);
          if (sem && sem.instalments?.[instIdx]) {
            sem.instalments[instIdx].paymentDate = v;
          }
        });
      }
    }
  } catch (_) {
    // ignore parse errors in overrides; fall back to DB dates
  }
}

// Convert UI-format custom dates to plan-specific JSON structure
function convertCustomDatesToPlanSpecific(
  customDates: Record<string, string>,
  paymentPlan: PaymentPlan
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (paymentPlan === 'one_shot') {
    // One-shot plan: store program fee due date
    if (customDates['one-shot']) {
      result.program_fee_due_date = customDates['one-shot'];
    }
  } else if (paymentPlan === 'sem_wise') {
    // Semester-wise plan: store semester dates
    // UI generates keys like "semester-1-instalment-0" even for sem_wise (only instalment-0 exists)
    const semesters: Record<string, { due_date?: string }> = {};

    Object.keys(customDates).forEach(key => {
      if (key.startsWith('semester-') && key.includes('instalment-0')) {
        const parts = key.split('-');
        const semesterNum = parts[1];
        const semesterKey = `semester_${semesterNum}`;

        if (!semesters[semesterKey]) {
          semesters[semesterKey] = {};
        }

        // For semester-wise, store as due_date (there's only one payment per semester)
        semesters[semesterKey].due_date = customDates[key];
      }
    });

    if (Object.keys(semesters).length > 0) {
      result.semesters = semesters;
    }
  } else if (paymentPlan === 'instalment_wise') {
    // Installment-wise plan: store individual installment dates
    const semesters: Record<string, { installments?: Record<string, string> }> =
      {};

    Object.keys(customDates).forEach(key => {
      if (key.startsWith('semester-') && key.includes('instalment-')) {
        const parts = key.split('-');
        const semesterNum = parts[1];
        const installmentNum = parts[3];
        const semesterKey = `semester_${semesterNum}`;

        if (!semesters[semesterKey]) {
          semesters[semesterKey] = {};
        }

        if (!semesters[semesterKey].installments) {
          semesters[semesterKey].installments = {};
        }

        semesters[semesterKey].installments[`installment_${installmentNum}`] =
          customDates[key];
      }
    });

    if (Object.keys(semesters).length > 0) {
      result.semesters = semesters;
    }
  }

  return result;
}

const generateFeeStructureReview = async (
  supabase: ReturnType<typeof createClient>,
  cohortId: string,
  paymentPlan: PaymentPlan,
  selectedScholarshipId: string | null | undefined,
  additionalScholarshipPercentage: number,
  studentId?: string,
  customDates?: Record<string, string>,
  previewFeeStructureData?: Record<string, unknown>,
  scholarshipData?: {
    id: string;
    amount_percentage: number;
    name: string;
  } | null
): Promise<{ breakdown: Breakdown; feeStructure: Record<string, unknown> }> => {
  // Load fee structure and scholarships
  let feeStructure: Record<string, unknown> | null = null;

  // If preview data is provided, use it instead of querying database
  if (previewFeeStructureData) {
    feeStructure = {
      cohort_id: cohortId,
      ...previewFeeStructureData,
      structure_type: 'cohort',
      // Preserve any provided custom date configuration in preview data
      custom_dates_enabled:
        (previewFeeStructureData as Record<string, unknown>)
          ?.custom_dates_enabled ?? false,
      one_shot_dates:
        (previewFeeStructureData as Record<string, unknown>)?.one_shot_dates ??
        {},
      sem_wise_dates:
        (previewFeeStructureData as Record<string, unknown>)?.sem_wise_dates ??
        {},
      instalment_wise_dates:
        (previewFeeStructureData as Record<string, unknown>)
          ?.instalment_wise_dates ?? {},
    };
  } else {
    // Original database lookup logic
    if (studentId) {
      const { data: customFsExact } = await supabase
        .from('fee_structures')
        .select(
          'cohort_id,total_program_fee,admission_fee,number_of_semesters,instalments_per_semester,one_shot_discount_percentage,custom_dates_enabled,one_shot_dates,sem_wise_dates,instalment_wise_dates,structure_type,student_id'
        )
        .eq('cohort_id', cohortId)
        .eq('structure_type', 'custom')
        .eq('student_id', studentId)
        .maybeSingle();
      if (customFsExact) feeStructure = customFsExact;
    }
    if (!feeStructure) {
      const { data: cohortFs, error: fsErr2 } = await supabase
        .from('fee_structures')
        .select(
          'cohort_id,total_program_fee,admission_fee,number_of_semesters,instalments_per_semester,one_shot_discount_percentage,custom_dates_enabled,one_shot_dates,sem_wise_dates,instalment_wise_dates,structure_type'
        )
        .eq('cohort_id', cohortId)
        .eq('structure_type', 'cohort')
        .single();
      if (fsErr2 || !cohortFs) throw new Error('Fee structure not found');
      feeStructure = cohortFs;
    }
  }

  // No longer need cohort start date - dates come from database only

  // Load scholarships to resolve percentage
  let scholarshipAmount = 0;
  if (selectedScholarshipId) {
    // Check if we have temporary scholarship data (for preview mode)
    if (scholarshipData && selectedScholarshipId.startsWith('temp-')) {
      const basePct = scholarshipData.amount_percentage;
      const totalPct = basePct + (additionalScholarshipPercentage || 0);
      scholarshipAmount =
        Math.round((feeStructure.total_program_fee as number) * (totalPct / 100) * 100) /
        100;
      console.log(
        `Using temporary scholarship: ${scholarshipData.name} (${basePct}%) = ₹${scholarshipAmount}`
      );
    } else {
      // Fetch from database for saved scholarships
      const { data: sch, error: schErr } = await supabase
        .from('cohort_scholarships')
        .select('id, amount_percentage')
        .eq('id', selectedScholarshipId)
        .single();
      if (!schErr && sch && typeof sch.amount_percentage === 'number') {
        const basePct = sch.amount_percentage;
        const totalPct = basePct + (additionalScholarshipPercentage || 0);
        scholarshipAmount =
          Math.round((feeStructure.total_program_fee as number) * (totalPct / 100) * 100) /
          100;
        console.log(
          `Using saved scholarship: ID ${selectedScholarshipId} (${basePct}%) = ₹${scholarshipAmount}`
        );
      } else {
        console.log(
          `Scholarship not found in database: ${selectedScholarshipId}`
        );
      }
    }
  } else if (
    additionalScholarshipPercentage &&
    additionalScholarshipPercentage > 0
  ) {
    const totalPct = additionalScholarshipPercentage;
          scholarshipAmount =
        Math.round((feeStructure.total_program_fee as number) * (totalPct / 100) * 100) / 100;
  }

  // Admission fee block
  const admissionFeeBase = extractBaseAmountFromTotal(
    feeStructure.admission_fee
  );
  const admissionFeeGST = extractGSTFromTotal(feeStructure.admission_fee);

  const semesters: SemesterView[] = [];
  let oneShotPayment: InstallmentView | undefined = undefined;

  if (paymentPlan === 'sem_wise' || paymentPlan === 'instalment_wise') {
    const installmentsPerSemester =
      paymentPlan === 'sem_wise' ? 1 : feeStructure.instalments_per_semester;
    for (let sem = 1; sem <= feeStructure.number_of_semesters; sem++) {
      const semesterInstallments = calculateSemesterPayment(
        sem,
        feeStructure.total_program_fee,
        feeStructure.admission_fee,
        feeStructure.number_of_semesters,
        installmentsPerSemester,
        scholarshipAmount,
        0
      );
      const semesterTotal = {
        scholarshipAmount: semesterInstallments.reduce(
          (sum, inst) => sum + (inst.scholarshipAmount || 0),
          0
        ),
        baseAmount: semesterInstallments.reduce(
          (sum, inst) => sum + (inst.baseAmount || 0),
          0
        ),
        gstAmount: semesterInstallments.reduce(
          (sum, inst) => sum + (inst.gstAmount || 0),
          0
        ),
        discountAmount: semesterInstallments.reduce(
          (sum, inst) => sum + (inst.discountAmount || 0),
          0
        ),
        totalPayable: semesterInstallments.reduce(
          (sum, inst) => sum + (inst.amountPayable || 0),
          0
        ),
      };
      semesters.push({
        semesterNumber: sem,
        instalments: semesterInstallments,
        total: semesterTotal,
      });
    }
  }

  if (paymentPlan === 'one_shot') {
    oneShotPayment = calculateOneShotPayment(
      feeStructure.total_program_fee,
      feeStructure.admission_fee,
      feeStructure.one_shot_discount_percentage,
      scholarshipAmount
    );
  }

  // Apply database dates - prioritize saved dates first, fallback to auto-generation
  console.log('🎯 Payment engine checking database dates:', {
    paymentPlan,
    hasOneShotDates: !!feeStructure?.one_shot_dates,
    hasSemWiseDates: !!feeStructure?.sem_wise_dates,
    hasInstalmentWiseDates: !!feeStructure?.instalment_wise_dates,
    oneShotDatesValue: feeStructure?.one_shot_dates,
    semWiseDatesValue: feeStructure?.sem_wise_dates,
    instalmentWiseDatesValue: feeStructure?.instalment_wise_dates,
  });

  let databaseDates: Record<string, string> = {};

  // PRIORITY 1: Use custom dates for preview mode
  if (customDates && Object.keys(customDates).length > 0) {
    databaseDates = customDates;
    console.log('✅ PRIORITY 1: Using custom dates from preview parameter:', databaseDates);
  }
  // PRIORITY 2: Use saved dates from database
  else {
    let planSpecificDates: Record<string, unknown> | null = null;

    if (paymentPlan === 'one_shot' && feeStructure.one_shot_dates) {
      planSpecificDates = feeStructure.one_shot_dates;
      console.log('🔍 Found one_shot_dates in database:', planSpecificDates);
    } else if (paymentPlan === 'sem_wise' && feeStructure.sem_wise_dates) {
      planSpecificDates = feeStructure.sem_wise_dates;
      console.log('🔍 Found sem_wise_dates in database:', planSpecificDates);
    } else if (
      paymentPlan === 'instalment_wise' &&
      feeStructure.instalment_wise_dates
    ) {
      planSpecificDates = feeStructure.instalment_wise_dates;
      console.log('🔍 Found instalment_wise_dates in database:', planSpecificDates);
    }

    if (planSpecificDates && Object.keys(planSpecificDates).length > 0) {
      databaseDates = convertPlanSpecificJsonToDateKeys(
        planSpecificDates,
        paymentPlan
      );
      console.log('✅ PRIORITY 2: Using saved dates from database:', databaseDates);
    }
  }

  // PRIORITY 3: Fallback to auto-generation only if no saved dates exist
  if (!databaseDates || Object.keys(databaseDates).length === 0) {
    console.log('🔄 PRIORITY 3: No saved dates found, generating defaults from cohort start_date');
    try {
      const { data: cohortRow } = await supabase
        .from('cohorts')
        .select('start_date')
        .eq('id', cohortId)
        .maybeSingle();
      const cohortStart = (cohortRow as { start_date?: string })?.start_date || new Date().toISOString().split('T')[0];
      databaseDates = generateDefaultUiDateKeys(
        paymentPlan,
        cohortStart,
        feeStructure.number_of_semesters,
        feeStructure.instalments_per_semester
      );
      console.log('✅ PRIORITY 3: Generated default dates from cohort start_date:', {
        cohortStart,
        databaseDates,
      });
    } catch (e) {
      console.log('⚠️ Could not generate default dates:', e);
    }
  }

  // Apply dates to payment structure (simplified)
  if (databaseDates && Object.keys(databaseDates).length > 0) {
    applyDateOverrides(
      paymentPlan,
      '',
      semesters,
      oneShotPayment,
      databaseDates
    );
    console.log('✅ Database dates applied successfully');
  } else {
    console.log('⚠️ No dates found in database - payment dates will be empty');
  }

  const totalSemesterAmount = semesters.reduce(
    (sum, s) => sum + (s.total?.totalPayable || 0),
    0
  );
  const totalSemesterGST = semesters.reduce(
    (sum, s) => sum + (s.total?.gstAmount || 0),
    0
  );
  const totalSemesterScholarship = semesters.reduce(
    (sum, s) => sum + (s.total?.scholarshipAmount || 0),
    0
  );
  const totalSemesterDiscount = semesters.reduce(
    (sum, s) => sum + (s.total?.discountAmount || 0),
    0
  );
  const totalAmountPayable =
    feeStructure.admission_fee +
    totalSemesterAmount +
    (oneShotPayment?.amountPayable || 0);

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
      totalGST:
        totalSemesterGST + admissionFeeGST + (oneShotPayment?.gstAmount || 0),
      totalDiscount:
        totalSemesterDiscount + (oneShotPayment?.discountAmount || 0),
      totalScholarship:
        totalSemesterScholarship + (oneShotPayment?.scholarshipAmount || 0),
      totalAmountPayable: Math.max(0, totalAmountPayable),
    },
  };

  console.log('🏁 FINAL BREAKDOWN being returned to frontend:', {
    paymentPlan,
    oneShotPaymentDate: breakdown.oneShotPayment?.paymentDate,
    firstSemesterFirstInstallmentDate:
      breakdown.semesters?.[0]?.instalments?.[0]?.paymentDate,
    admissionFeeStructure: breakdown.admissionFee,
    totalBreakdown: breakdown,
  });

  return {
    breakdown,
    feeStructure: {
      id: feeStructure.id || '',
      cohort_id: feeStructure.cohort_id,
      student_id: feeStructure.student_id || null,
      structure_type: feeStructure.structure_type || 'cohort',
      total_program_fee: feeStructure.total_program_fee,
      admission_fee: feeStructure.admission_fee,
      number_of_semesters: feeStructure.number_of_semesters,
      instalments_per_semester: feeStructure.instalments_per_semester,
      one_shot_discount_percentage: feeStructure.one_shot_discount_percentage,
      is_setup_complete: feeStructure.is_setup_complete || false,
      custom_dates_enabled: feeStructure.custom_dates_enabled || false,
      one_shot_dates: feeStructure.one_shot_dates || {},
      sem_wise_dates: feeStructure.sem_wise_dates || {},
      instalment_wise_dates: feeStructure.instalment_wise_dates || {},
      created_by: feeStructure.created_by || null,
      created_at: feeStructure.created_at || new Date().toISOString(),
      updated_at: feeStructure.updated_at || new Date().toISOString(),
    },
  };
};

// Partial payment calculation helpers
const calculatePartialPaymentSummary = async (
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  installmentId: string
): Promise<{
  installmentId: string;
  originalAmount: number;
  totalPaid: number;
  pendingAmount: number;
  nextPaymentAmount: number;
  canMakeAnotherPayment: boolean;
  partialPaymentHistory: Array<{
    id: string;
    sequenceNumber: number;
    amount: number;
    status: string;
    paymentDate?: string;
    verifiedAt?: string;
    notes?: string;
    rejectionReason?: string;
  }>;
  restrictions: {
    maxPartialPayments: number;
    currentCount: number;
    remainingPayments: number;
  };
}> => {
  // Get the payment record
  const { data: paymentRecord } = await supabase
    .from('student_payments')
    .select('id')
    .eq('student_id', studentId)
    .single();

  if (!paymentRecord) {
    throw new Error('Payment record not found');
  }

  // Get all transactions for this installment
  const { data: transactions } = await supabase
    .from('payment_transactions')
    .select('id, amount, verification_status, partial_payment_sequence, created_at, verified_at, notes, rejection_reason')
    .eq('payment_id', paymentRecord.id)
    .eq('installment_id', installmentId)
    .order('partial_payment_sequence', { ascending: true });

  const partialPayments = transactions || [];
  
  // Calculate totals
  const totalPaid = partialPayments
    .filter(t => t.verification_status === 'approved' || t.verification_status === 'partially_approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Get original installment amount (this would need to be calculated from fee structure)
  // For now, using a placeholder - in real implementation, this would call the breakdown calculation
  const originalAmount = 10000; // TODO: Calculate from fee structure
  
  const pendingAmount = originalAmount - totalPaid;
  const currentCount = partialPayments.length;
  const maxPartialPayments = 2; // As per requirements
  const canMakeAnotherPayment = currentCount < maxPartialPayments && pendingAmount > 0;

  return {
    installmentId,
    originalAmount,
    totalPaid,
    pendingAmount,
    nextPaymentAmount: canMakeAnotherPayment ? 0 : pendingAmount, // 0 means student can choose amount
    canMakeAnotherPayment,
    partialPaymentHistory: partialPayments.map(t => ({
      id: t.id,
      sequenceNumber: t.partial_payment_sequence || 1,
      amount: t.amount || 0,
      status: t.verification_status || 'pending',
      paymentDate: t.created_at,
      verifiedAt: t.verified_at,
      notes: t.notes,
      rejectionReason: t.rejection_reason,
    })),
    restrictions: {
      maxPartialPayments,
      currentCount,
      remainingPayments: Math.max(0, maxPartialPayments - currentCount),
    },
  };
};

const processAdminPartialApproval = async (
  supabase: ReturnType<typeof createClient>,
  transactionId: string,
  approvalType: 'full' | 'partial' | 'reject',
  approvedAmount?: number,
  adminNotes?: string,
  rejectionReason?: string
): Promise<{ success: boolean; newTransactionId?: string; message?: string }> => {
  if (approvalType === 'reject') {
    // Reject the transaction
    const { error } = await supabase
      .from('payment_transactions')
      .update({
        verification_status: 'rejected',
        rejection_reason: rejectionReason,
        verified_at: new Date().toISOString(),
        verification_notes: adminNotes,
      })
      .eq('id', transactionId);

    if (error) throw error;
    return { success: true, message: 'Transaction rejected successfully' };
  }

  if (approvalType === 'full') {
    // Approve the full transaction
    const { error } = await supabase
      .from('payment_transactions')
      .update({
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
        verification_notes: adminNotes,
      })
      .eq('id', transactionId);

    if (error) throw error;
    return { success: true, message: 'Transaction approved successfully' };
  }

  if (approvalType === 'partial' && approvedAmount) {
    // Get the original transaction
    const { data: originalTransaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError || !originalTransaction) {
      throw new Error('Original transaction not found');
    }

    const originalAmount = originalTransaction.amount;
    const remainingAmount = originalAmount - approvedAmount;

    if (approvedAmount <= 0 || approvedAmount >= originalAmount) {
      throw new Error('Invalid approved amount for partial approval');
    }

    // Update original transaction to partially approved with approved amount
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        amount: approvedAmount,
        verification_status: 'partially_approved',
        verified_at: new Date().toISOString(),
        verification_notes: adminNotes,
      })
      .eq('id', transactionId);

    if (updateError) throw updateError;

    // Create new pending transaction for remaining amount
    const { data: newTransaction, error: createError } = await supabase
      .from('payment_transactions')
      .insert({
        payment_id: originalTransaction.payment_id,
        transaction_type: originalTransaction.transaction_type,
        amount: remainingAmount,
        payment_method: originalTransaction.payment_method,
        status: 'pending',
        verification_status: 'pending',
        installment_id: originalTransaction.installment_id,
        semester_number: originalTransaction.semester_number,
        partial_payment_sequence: (originalTransaction.partial_payment_sequence || 1) + 1,
        notes: `Remaining amount from partial approval of transaction ${transactionId}`,
        created_by: originalTransaction.created_by,
        recorded_by_user_id: originalTransaction.recorded_by_user_id,
      })
      .select('id')
      .single();

    if (createError) throw createError;

    return {
      success: true,
      newTransactionId: newTransaction.id,
      message: `Transaction partially approved. ₹${approvedAmount} approved, ₹${remainingAmount} remains pending.`,
    };
  }

  throw new Error('Invalid approval type or missing required parameters');
};

const updatePartialPaymentConfig = async (
  supabase: ReturnType<typeof createClient>,
  studentPaymentId: string,
  installmentKey: string,
  allowPartialPayments: boolean
): Promise<{ success: boolean; message?: string }> => {
  // Get current config
  const { data: currentData, error: fetchError } = await supabase
    .from('student_payments')
    .select('allow_partial_payments_json')
    .eq('id', studentPaymentId)
    .single();

  if (fetchError) throw fetchError;

  // Update the specific installment setting
  const currentConfig = currentData?.allow_partial_payments_json || {};
  const updatedConfig = {
    ...currentConfig,
    [installmentKey]: allowPartialPayments,
  };

  const { error } = await supabase
    .from('student_payments')
    .update({ allow_partial_payments_json: updatedConfig })
    .eq('id', studentPaymentId);

  if (error) throw error;

  return {
    success: true,
    message: `Partial payments ${allowPartialPayments ? 'enabled' : 'disabled'} for installment ${installmentKey}`,
  };
};

const getPartialPaymentConfig = async (
  supabase: ReturnType<typeof createClient>,
  studentPaymentId: string,
  installmentKey: string
): Promise<{ allowPartialPayments: boolean }> => {
  const { data, error } = await supabase
    .from('student_payments')
    .select('allow_partial_payments_json')
    .eq('id', studentPaymentId)
    .single();

  if (error) throw error;

  const config = data?.allow_partial_payments_json || {};
  const result = config[installmentKey] || false;
  console.log('🔍 [getPartialPaymentConfig] Debug:', {
    studentPaymentId,
    installmentKey,
    config,
    result,
    configType: typeof config,
    configKeys: Object.keys(config || {}),
    configValues: Object.values(config || {}),
    directLookup: config?.[installmentKey],
    directLookupType: typeof config?.[installmentKey],
  });
  return { allowPartialPayments: result };
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
  approvedAmount: number = 0 // Add approved amount parameter
): string => {
  const today = new Date();
  const d0 = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const d1 = normalizeDateOnly(dueDate);
  const daysUntilDue = Math.ceil((d1 - d0) / (1000 * 60 * 60 * 24));

  // Only consider it 'paid' if the approved amount covers the total payable
  if (hasApprovedTx && approvedAmount >= totalPayable) {
    return 'paid';
  }
  if (hasVerificationPendingTx && allocatedPaid > 0) {
    if (allocatedPaid >= totalPayable) return 'verification_pending';
    return 'partially_paid_verification_pending';
  }
  // Only consider it 'paid' if the approved amount covers the total payable
  if (approvedAmount >= totalPayable) return 'paid';
  if (daysUntilDue < 0)
    return allocatedPaid > 0 ? 'partially_paid_overdue' : 'overdue';
  if (allocatedPaid > 0) return 'partially_paid_days_left';
  if (daysUntilDue >= 10) return 'pending_10_plus_days';
  return 'pending';
};

const enrichWithStatuses = (
  breakdown: Breakdown,
  transactions: Array<{
    amount: number;
    verification_status: string | null;
    installment_id: string | null;
    semester_number: number | null;
  }>,
  plan: PaymentPlan
): {
  breakdown: Breakdown;
  aggregate: {
    totalPayable: number;
    totalPaid: number;
    totalPending: number;
    nextDueDate: string | null;
    paymentStatus: string;
  };
} => {
  const relevantPaid = Array.isArray(transactions)
    ? transactions.reduce((sum, t) => {
        if (
          t &&
          (t.verification_status === 'approved' ||
            t.verification_status === 'verification_pending')
        ) {
          return sum + (Number(t.amount) || 0);
        }
        return sum;
      }, 0)
    : 0;
  const hasVerificationPendingTx = Array.isArray(transactions)
    ? transactions.some(
        t => t && t.verification_status === 'verification_pending'
      )
    : false;
  const hasApprovedTx = Array.isArray(transactions)
    ? transactions.some(t => t && t.verification_status === 'approved')
    : false;

  // Total payable excludes admission fee from schedule calculations displayed to the student, but we will include it in aggregate total.
  const admissionFeePayable = breakdown.admissionFee?.totalPayable || 0;

  let totalPayableSchedule = 0;
  const dueItems: Array<{ dueDate: string; pending: number; status: string }> =
    [];

  // Separate installment-specific and general payments
  const installmentSpecificPayments = Array.isArray(transactions)
    ? transactions.filter(
        t =>
          t &&
          (t.verification_status === 'approved' ||
            t.verification_status === 'verification_pending') &&
          (t.installment_id || t.semester_number)
      )
    : [];

  const generalPayments = Array.isArray(transactions)
    ? transactions.filter(
        t =>
          t &&
          (t.verification_status === 'approved' ||
            t.verification_status === 'verification_pending') &&
          !t.installment_id &&
          !t.semester_number
      )
    : [];

  const generalPaidAmount = generalPayments.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0
  );

  // Initialize installment-specific payment tracking per installment
  type InstallmentAlloc = {
    amount: number;
    approvedAmount: number;
    hasVerificationPending: boolean;
    hasApproved: boolean;
  };
  const installmentPayments = new Map<string, InstallmentAlloc>(); // key: semesterNumber-installmentNumber

  const parseInstallmentNumberFromId = (raw: string | null): number | null => {
    if (!raw) return null;
    // Accept formats like "3" or "1-3" or any non-digit separator; pick the last numeric token as installment number
    const tokens = String(raw)
      .split(/[^0-9]+/)
      .filter(Boolean);
    if (tokens.length === 0) return null;
    const last = Number(tokens[tokens.length - 1]);
    return Number.isFinite(last) ? last : null;
  };

  installmentSpecificPayments.forEach(payment => {
    if (payment.semester_number && payment.installment_id) {
      const installmentNumber = parseInstallmentNumberFromId(
        payment.installment_id
      );
      if (installmentNumber) {
        const key = `${payment.semester_number}-${installmentNumber}`;
        const prev = installmentPayments.get(key) || {
          amount: 0,
          approvedAmount: 0,
          hasVerificationPending: false,
          hasApproved: false,
        };
        const next: InstallmentAlloc = {
          amount: prev.amount + (Number(payment.amount) || 0),
          approvedAmount: prev.approvedAmount + (payment.verification_status === 'approved' ? (Number(payment.amount) || 0) : 0),
          hasVerificationPending:
            prev.hasVerificationPending ||
            payment.verification_status === 'verification_pending',
          hasApproved:
            prev.hasApproved || payment.verification_status === 'approved',
        };
        installmentPayments.set(key, next);
      } else {
        console.log(
          '⚠️ [WARN] Could not parse installment number from installment_id',
          {
            installment_id: payment.installment_id,
          }
        );
      }
    }
  });

  console.log('🔍 [DEBUG] Payment allocation:', {
    totalRelevantPaid: relevantPaid,
    installmentSpecificPayments: installmentSpecificPayments.length,
    generalPayments: generalPayments.length,
    generalPaidAmount,
    installmentPayments: Object.fromEntries(
      Array.from(installmentPayments.entries()).map(([k, v]) => [
        k,
        { amount: v.amount, vp: v.hasVerificationPending, ap: v.hasApproved },
      ])
    ),
  });

  // For one-shot payments, the oneShotPayment will be processed as semester 1, installment 1
  // by the regular installment processing logic below
  if (plan === 'one_shot' && breakdown.oneShotPayment) {
    // Convert one-shot payment to semester structure for consistent processing
    const oneShotAsSemester: SemesterView = {
      semesterNumber: 1,
      instalments: [{
        ...breakdown.oneShotPayment,
        installmentNumber: 1,
      }],
      total: {
        baseAmount: breakdown.oneShotPayment.baseAmount,
        scholarshipAmount: breakdown.oneShotPayment.scholarshipAmount,
        discountAmount: breakdown.oneShotPayment.discountAmount,
        gstAmount: breakdown.oneShotPayment.gstAmount,
        totalPayable: breakdown.oneShotPayment.amountPayable,
      }
    };
    
    // Add to semesters array for processing
    breakdown.semesters = [oneShotAsSemester];
    
    console.log('🔄 [DEBUG] Converted one-shot payment to semester 1, installment 1 format');
  }

  // Apply installment-specific payments first
  breakdown.semesters?.forEach(sem => {
    sem.instalments?.forEach(inst => {
      const total = Number(inst.amountPayable || 0);

      // Check for installment-specific payments
      const installmentKey = `${sem.semesterNumber}-${inst.installmentNumber}`;
      const alloc = installmentPayments.get(installmentKey);
      const installmentSpecificAmount = alloc?.amount || 0;

      // ONLY apply installment-specific payments - NO fallback to general payments
      const allocated = installmentSpecificAmount;

      console.log('🔍 [PaymentEngine] Installment status calculation:', {
        semester: sem.semesterNumber,
        installment: inst.installmentNumber,
        total,
        allocated,
        approvedAmount: alloc?.approvedAmount || 0,
        hasVerificationPending: alloc?.hasVerificationPending || false,
        hasApproved: alloc?.hasApproved || false
      });

      const status = deriveInstallmentStatus(
        String(inst.paymentDate || new Date().toISOString().split('T')[0]),
        total,
        allocated,
        alloc?.hasVerificationPending || false,
        alloc?.hasApproved || false,
        alloc?.approvedAmount || 0
      );

      console.log('🔍 [PaymentEngine] Installment status result:', {
        semester: sem.semesterNumber,
        installment: inst.installmentNumber,
        status,
        total,
        allocated,
        approvedAmount: alloc?.approvedAmount || 0
      });

      inst.status = status;
      inst.amountPaid = allocated;
      inst.amountPending = Math.max(0, total - allocated);
      totalPayableSchedule += total;
      dueItems.push({
        dueDate: inst.paymentDate,
        pending: inst.amountPending,
        status,
      });

      console.log(
        '🔍 [DEBUG] Installment allocation (installment-specific only):',
        {
          semester: sem.semesterNumber,
          installment: inst.installmentNumber,
          total,
          installmentSpecificAmount,
          allocated,
          status,
          hasGeneralPayments: generalPayments.length > 0,
        }
      );
    });
  });

  // Emit a compact summary for quick visual verification
  try {
    const summary = breakdown.semesters?.map(sem => ({
      sem: sem.semesterNumber,
      items: (sem.instalments || []).map(inst => ({
        i: inst.installmentNumber,
        paid: inst.amountPaid,
        pending: inst.amountPending,
        status: inst.status,
      })),
    }));
    console.log(
      '🧾 [SUMMARY] Per-installment allocation and status:',
      JSON.stringify(summary)
    );
  } catch (_) {
    // ignore log errors
  }

  // If there are general payments (without installment targeting), throw an error
  if (generalPayments.length > 0) {
    console.log(
      '🚨 [ERROR] General payments detected - all payments must target specific installments'
    );
    console.log('🚨 [ERROR] General payments found:', generalPayments);
    throw new Error(
      `Payment system requires installment targeting. Found ${generalPayments.length} general payments without installment/semester identification. All payments must specify which installment they are for.`
    );
  }

  const totalPayable = admissionFeePayable + totalPayableSchedule;
  const totalPaid = Math.min(relevantPaid, totalPayableSchedule); // do not count admission fee here
  const totalPending = Math.max(0, totalPayableSchedule - totalPaid);

  // Next due date: earliest due with pending > 0
  const nextDue =
    dueItems
      .filter(d => (Number(d.pending) || 0) > 0)
      .sort(
        (a, b) => normalizeDateOnly(a.dueDate) - normalizeDateOnly(b.dueDate)
      )[0]?.dueDate || null;

  // Aggregate status
  let aggStatus = 'pending';
  const anyOverdue = dueItems.some(
    d => d.status === 'overdue' || d.status === 'partially_paid_overdue'
  );
  
  // Check if all installments are fully paid (no pending amounts)
  const allInstallmentsPaid = totalPending <= 0;
  
  console.log('🔍 [PaymentEngine] Aggregate status calculation:', {
    totalPayable,
    totalPaid,
    totalPending,
    allInstallmentsPaid,
    hasApprovedTx,
    hasVerificationPendingTx,
    anyOverdue,
    dueItemsCount: dueItems.length
  });
  
  if (allInstallmentsPaid && (hasApprovedTx || !hasVerificationPendingTx))
    aggStatus = 'paid';
  else if (hasVerificationPendingTx) aggStatus = 'verification_pending';
  else if (anyOverdue) aggStatus = 'overdue';
  else if (totalPaid > 0 && totalPending > 0) aggStatus = 'partially_paid_days_left';
  else {
    // derive based on nearest due
    if (nextDue) {
      const today = new Date();
      const d0 = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      ).getTime();
      const d1 = normalizeDateOnly(nextDue);
      const daysUntilDue = Math.ceil((d1 - d0) / (1000 * 60 * 60 * 24));
      aggStatus = daysUntilDue >= 10 ? 'pending_10_plus_days' : 'pending';
    } else {
      aggStatus = 'pending';
    }
  }
  
  console.log('🔍 [PaymentEngine] Final aggregate status:', aggStatus);

  // Find the current installment status (the most recently completed or currently being processed)
  let currentInstallmentStatus = 'pending';
  
  // First, check if there are any fully paid installments
  const paidInstallments = dueItems.filter(d => d.status === 'paid');
  if (paidInstallments.length > 0) {
    // If there are paid installments, show 'paid' status
    currentInstallmentStatus = 'paid';
  } else if (nextDue) {
    // If no paid installments, find the installment that corresponds to the next due date
    const currentInstallment = dueItems.find(d => d.dueDate === nextDue);
    if (currentInstallment) {
      currentInstallmentStatus = currentInstallment.status;
    }
  } else if (dueItems.length > 0) {
    // If no next due date, find the most recent installment with pending amount
    const pendingItems = dueItems.filter(d => (Number(d.pending) || 0) > 0);
    if (pendingItems.length > 0) {
      currentInstallmentStatus = pendingItems[0].status;
    } else {
      // All installments are paid
      currentInstallmentStatus = 'paid';
    }
  }

  console.log('🔍 [PaymentEngine] Current installment status:', {
    nextDue,
    currentInstallmentStatus,
    dueItems: dueItems.map(d => ({ dueDate: d.dueDate, pending: d.pending, status: d.status }))
  });

  return {
    breakdown,
    aggregate: {
      totalPayable,
      totalPaid,
      totalPending,
      nextDueDate: nextDue,
      paymentStatus: currentInstallmentStatus, // Use current installment status instead of aggregate
    },
  };
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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
    }: EdgeRequest = await req.json();

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
    console.log('🏗️ Fee structure data received:', {
      hasFeeStructureData: !!feeStructureData,
      customDatesEnabled: feeStructureData?.custom_dates_enabled,
      hasOneShotDates: !!feeStructureData?.one_shot_dates,
      hasSemWiseDates: !!feeStructureData?.sem_wise_dates,
      hasInstalmentWiseDates: !!feeStructureData?.instalment_wise_dates,
      oneShotDatesValue: feeStructureData?.one_shot_dates,
      semWiseDatesValue: feeStructureData?.sem_wise_dates,
      instalmentWiseDatesValue: feeStructureData?.instalment_wise_dates,
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
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
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
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
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

      console.log('🔧 [partial_config] Student payment lookup:', { studentPayment, studentPaymentError });

      if (studentPaymentError) {
        throw new Error(`Student payment lookup failed: ${studentPaymentError.message}`);
      }

      if (!studentPayment) {
        throw new Error('Student payment record not found');
      }

      if (allowPartialPayments !== undefined) {
        // Update partial payment setting (allowPartialPayments is provided)
        console.log('🔧 [partial_config] Updating config with value:', allowPartialPayments);
        
        const result = await updatePartialPaymentConfig(
          supabase, 
          studentPayment.id, 
          installmentId, 
          allowPartialPayments
        );
        
        // Verify the update was successful by reading back the value
        console.log('🔍 [partial_config] Verifying update was successful...');
        const verifyResult = await getPartialPaymentConfig(
          supabase, 
          studentPayment.id, 
          installmentId
        );
        console.log('✅ [partial_config] Verification result:', verifyResult);
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: { 
            ...result, 
            verified: verifyResult,
            allowPartialPayments: verifyResult.allowPartialPayments 
          } 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } else {
        // Get partial payment setting (allowPartialPayments is not provided)
        console.log('🔧 [partial_config] Getting current config');
        
        const result = await getPartialPaymentConfig(
          supabase, 
          studentPayment.id, 
          installmentId
        );
        return new Response(JSON.stringify({ success: true, data: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    // Existing fee structure logic continues below
    if (!cohortId) throw new Error('cohortId is required');
    if (!paymentPlan)
      throw new Error('paymentPlan is required for preview mode');

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

    if (!resolvedPlan)
      throw new Error(
        'paymentPlan is required when no student payment record exists'
      );

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
      const response: EdgeResponse = { success: true, breakdown, feeStructure };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Load transactions if we need statuses/aggregates
    let transactions: Array<{
      amount: number;
      verification_status: string | null;
      installment_id: string | null;
      semester_number: number | null;
    }> = [];
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
      const response: EdgeResponse = { success: true, aggregate, feeStructure };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Add debug info to response to see what's happening
    const response: EdgeResponse = {
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
