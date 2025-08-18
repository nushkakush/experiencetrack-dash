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
  scholarshipData?: { // For temporary scholarships in preview mode
    id: string;
    amount_percentage: number;
    name: string;
  } | null;
  additionalDiscountPercentage?: number;
  // startDate removed - dates come from database only
  customDates?: Record<string, string>; // For preview with custom dates
  feeStructureData?: { // For preview mode when no saved structure exists
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    // Custom dates configuration (optional in preview mode)
    custom_dates_enabled?: boolean;
    one_shot_dates?: any; // JSON data for one-shot payment dates
    sem_wise_dates?: any; // JSON data for semester-wise payment dates
    instalment_wise_dates?: any; // JSON data for installment-wise payment dates
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
    one_shot_dates: any;
    sem_wise_dates: any;
    instalment_wise_dates: any;
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
  debug?: any;
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
// Date generation removed - edge function only uses database dates

const calculateOneShotPayment = (
  totalProgramFee: number,
  admissionFee: number,
  discountPercentage: number,
  scholarshipAmount: number,
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
  planJson: Record<string, any>, 
  paymentPlan: PaymentPlan
): Record<string, string> {
  const editable: Record<string, string> = {};

  if (paymentPlan === 'one_shot') {
    // One-shot plan: extract program fee due date
    if (planJson.program_fee_due_date) {
      editable['one-shot'] = planJson.program_fee_due_date;
    }
  } else if (paymentPlan === 'sem_wise') {
    // Semester-wise plan: extract semester dates
    // Convert back to UI format "semester-1-instalment-0" 
    const semesters = planJson.semesters || {};
    
    Object.keys(semesters).forEach(semesterKey => {
      const semesterData = semesters[semesterKey];
      if (semesterData.due_date) {
        const semesterNum = semesterKey.replace('semester_', '');
        editable[`semester-${semesterNum}-instalment-0`] = semesterData.due_date;
      }
    });
  } else if (paymentPlan === 'instalment_wise') {
    // Installment-wise plan: extract individual installment dates
    const semesters = planJson.semesters || {};
    
    Object.keys(semesters).forEach(semesterKey => {
      const semesterData = semesters[semesterKey];
      const semesterNum = semesterKey.replace('semester_', '');
      
      if (semesterData.installments) {
        Object.keys(semesterData.installments).forEach(installmentKey => {
          const installmentNum = installmentKey.replace('installment_', '');
          const dateKey = `semester-${semesterNum}-instalment-${installmentNum}`;
          editable[dateKey] = semesterData.installments[installmentKey];
        });
      }
    });
  }

  return editable;
}

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

    // One-shot: only set program fee due date
    if (plan === 'one_shot' && oneShotPayment) {
      // Handle nested structure (from UI custom dates): {one_shot: {program_fee_due_date: "..."}}
      const os = overrides?.one_shot || (overrides as any)?.oneShot;
      if (os?.program_fee_due_date) {
        oneShotPayment.paymentDate = os.program_fee_due_date;
        console.log('✅ Applied nested one-shot date:', os.program_fee_due_date);
      }
      // Handle flat structure (from database): {program_fee_due_date: "..."}
      else if (overrides?.program_fee_due_date) {
        console.log('🔥 CRITICAL: About to apply flat one-shot date from database:', {
          originalDate: oneShotPayment.paymentDate,
          newCustomDate: overrides.program_fee_due_date,
          overridesStructure: overrides
        });
        oneShotPayment.paymentDate = overrides.program_fee_due_date;
        console.log('✅ Applied flat one-shot date - NEW DATE IS:', oneShotPayment.paymentDate);
        // Force this to show up in browser console by throwing a temporary error we'll catch
        try {
          throw new Error(`CUSTOM_DATE_DEBUG: Applied custom date ${overrides.program_fee_due_date} to one-shot payment (was ${oneShotPayment.paymentDate})`);
        } catch (debugError) {
          console.log('🎯 DEBUG LOG FORCED:', debugError.message);
        }
      }
      // Handle UI date keys format: {'one-shot': "..."}
      else if (overrides?.['one-shot']) {
        oneShotPayment.paymentDate = overrides['one-shot'];
        console.log('✅ Applied UI key one-shot date:', overrides['one-shot']);
      }
    }

    // Choose plan-specific mapping first; fall back to generic 'semesters'
    let semJson: any = undefined;
    if (plan === 'instalment_wise') {
      semJson = overrides?.instalment_wise || overrides?.semesters;
    } else if (plan === 'sem_wise') {
      semJson = overrides?.sem_wise || overrides?.semesters;
    } else {
      semJson = overrides?.semesters || overrides?.sem_wise || overrides?.instalment_wise;
    }

    // If we didn't find a structured semesters object, check UI-key format
    if (!semJson) {
      const uiKeyEntries = Object.entries(overrides || {}).filter(([k]) =>
        typeof k === 'string' && k.startsWith('semester-') && k.includes('instalment-')
      );
      if (uiKeyEntries.length > 0) {
        semesters.forEach((s) => {
          uiKeyEntries.forEach(([key, value]) => {
            const match = /^semester-(\d+)-instalment-(\d+)$/.exec(String(key));
            if (!match) return;
            const semesterNum = Number(match[1]);
            const instalmentIdx = Number(match[2]); // UI keys are zero-based
            if (s.semesterNumber === semesterNum && s.instalments && s.instalments[instalmentIdx] && typeof value === 'string') {
              s.instalments[instalmentIdx].paymentDate = value;
            }
          });
        });
        return;
      }
      // Nothing to apply
      return;
    }

    semesters.forEach((s) => {
      const key = `semester_${s.semesterNumber}`;
      const semOverride = semJson[key] || semJson[s.semesterNumber] || semJson[`semester-${s.semesterNumber}`];
      if (!semOverride) return;

      s.instalments?.forEach((inst, idx) => {
        const instKey = `installment_${idx + 1}`;
        let value: any = undefined;
        if (typeof semOverride === 'string') {
          // Simple per-semester date (applies to all installments in that semester)
          value = semOverride;
        } else if (semOverride && typeof semOverride === 'object') {
          value = semOverride[instKey] || semOverride[idx + 1] || semOverride[`installment-${idx + 1}`];
        }
        if (typeof value === 'string') inst.paymentDate = value;
      });
    });
  } catch (_) {}
}

// Convert UI-format custom dates to plan-specific JSON structure
function convertCustomDatesToPlanSpecific(
  customDates: Record<string, string>,
  paymentPlan: PaymentPlan
): Record<string, any> {
  const result: Record<string, any> = {};

  if (paymentPlan === 'one_shot') {
    // One-shot plan: store program fee due date
    if (customDates['one-shot']) {
      result.program_fee_due_date = customDates['one-shot'];
    }
  } else if (paymentPlan === 'sem_wise') {
    // Semester-wise plan: store semester dates
    // UI generates keys like "semester-1-instalment-0" even for sem_wise (only instalment-0 exists)
    const semesters: Record<string, any> = {};
    
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
    const semesters: Record<string, any> = {};
    
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
        
        semesters[semesterKey].installments[`installment_${installmentNum}`] = customDates[key];
      }
    });
    
    if (Object.keys(semesters).length > 0) {
      result.semesters = semesters;
    }
  }

  return result;
}

const generateFeeStructureReview = async (
  supabase: any,
  cohortId: string,
  paymentPlan: PaymentPlan,
  selectedScholarshipId: string | null | undefined,
  additionalScholarshipPercentage: number,
  studentId?: string,
  customDates?: Record<string, string>,
  previewFeeStructureData?: any,
  scholarshipData?: { id: string; amount_percentage: number; name: string } | null,
): Promise<{breakdown: Breakdown; feeStructure: any}> => {
  // Load fee structure and scholarships
  let feeStructure: any | null = null;
  
  // If preview data is provided, use it instead of querying database
  if (previewFeeStructureData) {
    feeStructure = {
      cohort_id: cohortId,
      ...previewFeeStructureData,
      structure_type: 'cohort',
      // Preserve any provided custom date configuration in preview data
      custom_dates_enabled: previewFeeStructureData?.custom_dates_enabled ?? false,
      one_shot_dates: previewFeeStructureData?.one_shot_dates ?? {},
      sem_wise_dates: previewFeeStructureData?.sem_wise_dates ?? {},
      instalment_wise_dates: previewFeeStructureData?.instalment_wise_dates ?? {},
    };
  } else {
    // Original database lookup logic
    if (studentId) {
      const { data: customFsExact } = await supabase
        .from('fee_structures')
        .select('cohort_id,total_program_fee,admission_fee,number_of_semesters,instalments_per_semester,one_shot_discount_percentage,custom_dates_enabled,one_shot_dates,sem_wise_dates,instalment_wise_dates,structure_type,student_id')
        .eq('cohort_id', cohortId)
        .eq('structure_type', 'custom')
        .eq('student_id', studentId)
        .maybeSingle();
      if (customFsExact) feeStructure = customFsExact;
    }
    if (!feeStructure) {
      const { data: cohortFs, error: fsErr2 } = await supabase
        .from('fee_structures')
        .select('cohort_id,total_program_fee,admission_fee,number_of_semesters,instalments_per_semester,one_shot_discount_percentage,custom_dates_enabled,one_shot_dates,sem_wise_dates,instalment_wise_dates,structure_type')
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
      scholarshipAmount = Math.round(feeStructure.total_program_fee * (totalPct / 100) * 100) / 100;
      console.log(`Using temporary scholarship: ${scholarshipData.name} (${basePct}%) = ₹${scholarshipAmount}`);
    } else {
      // Fetch from database for saved scholarships
      const { data: sch, error: schErr } = await supabase
        .from("cohort_scholarships")
        .select("id, amount_percentage")
        .eq("id", selectedScholarshipId)
        .single();
      if (!schErr && sch && typeof sch.amount_percentage === "number") {
        const basePct = sch.amount_percentage;
        const totalPct = basePct + (additionalScholarshipPercentage || 0);
        scholarshipAmount = Math.round(feeStructure.total_program_fee * (totalPct / 100) * 100) / 100;
        console.log(`Using saved scholarship: ID ${selectedScholarshipId} (${basePct}%) = ₹${scholarshipAmount}`);
      } else {
        console.log(`Scholarship not found in database: ${selectedScholarshipId}`);
      }
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
    );
  }

  // Apply overrides if enabled - use plan-specific fields
  // Apply database dates only - no calculations or fallbacks
  console.log('🎯 Payment engine using database dates only:', {
    paymentPlan,
    customDatesEnabled: feeStructure?.custom_dates_enabled,
    hasOneShotDates: !!feeStructure?.one_shot_dates,
    hasSemWiseDates: !!feeStructure?.sem_wise_dates,
    hasInstalmentWiseDates: !!feeStructure?.instalment_wise_dates,
    hasCustomDatesParam: !!(customDates && Object.keys(customDates).length > 0)
  });
  
  let databaseDates: Record<string, string> = {};
  
  // Use custom dates for preview mode only
  if (customDates && Object.keys(customDates).length > 0) {
    databaseDates = customDates;
    console.log('✅ Using custom dates from preview parameter:', databaseDates);
  } 
  // Otherwise use dates from database
  else if (feeStructure?.custom_dates_enabled) {
    let planSpecificDates: any = null;
    
    if (paymentPlan === 'one_shot' && feeStructure.one_shot_dates) {
      planSpecificDates = feeStructure.one_shot_dates;
    } else if (paymentPlan === 'sem_wise' && feeStructure.sem_wise_dates) {
      planSpecificDates = feeStructure.sem_wise_dates;
    } else if (paymentPlan === 'instalment_wise' && feeStructure.instalment_wise_dates) {
      planSpecificDates = feeStructure.instalment_wise_dates;
    }
    
    if (planSpecificDates) {
      databaseDates = convertPlanSpecificJsonToDateKeys(planSpecificDates, paymentPlan);
      console.log('✅ Using dates from database:', databaseDates);
    }
  }
  
  // Apply dates to payment structure (simplified)
  if (databaseDates && Object.keys(databaseDates).length > 0) {
    applyDateOverrides(paymentPlan, '', semesters, oneShotPayment, databaseDates);
    console.log('✅ Database dates applied successfully');
  } else {
    console.log('⚠️ No dates found in database - payment dates will be empty');
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
  
  console.log('🏁 FINAL BREAKDOWN being returned to frontend:', {
    paymentPlan,
    oneShotPaymentDate: breakdown.oneShotPayment?.paymentDate,
    firstSemesterFirstInstallmentDate: breakdown.semesters?.[0]?.instalments?.[0]?.paymentDate,
    admissionFeeStructure: breakdown.admissionFee,
    totalBreakdown: breakdown
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
  transactions: Array<{ amount: number; verification_status: string | null; installment_id: string | null; semester_number: number | null }>,
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

  // Separate installment-specific and general payments
  const installmentSpecificPayments = Array.isArray(transactions) 
    ? transactions.filter(t => t && (t.verification_status === "approved" || t.verification_status === "verification_pending") && (t.installment_id || t.semester_number))
    : [];
  
  const generalPayments = Array.isArray(transactions)
    ? transactions.filter(t => t && (t.verification_status === "approved" || t.verification_status === "verification_pending") && !t.installment_id && !t.semester_number)
    : [];

  const generalPaidAmount = generalPayments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Initialize installment-specific payment tracking per installment
  type InstallmentAlloc = { amount: number; hasVerificationPending: boolean; hasApproved: boolean };
  const installmentPayments = new Map<string, InstallmentAlloc>(); // key: semesterNumber-installmentNumber
  
  const parseInstallmentNumberFromId = (raw: string | null): number | null => {
    if (!raw) return null;
    // Accept formats like "3" or "1-3" or any non-digit separator; pick the last numeric token as installment number
    const tokens = String(raw).split(/[^0-9]+/).filter(Boolean);
    if (tokens.length === 0) return null;
    const last = Number(tokens[tokens.length - 1]);
    return Number.isFinite(last) ? last : null;
  };

  installmentSpecificPayments.forEach(payment => {
    if (payment.semester_number && payment.installment_id) {
      const installmentNumber = parseInstallmentNumberFromId(payment.installment_id);
      if (installmentNumber) {
        const key = `${payment.semester_number}-${installmentNumber}`;
        const prev = installmentPayments.get(key) || { amount: 0, hasVerificationPending: false, hasApproved: false };
        const next: InstallmentAlloc = {
          amount: prev.amount + (Number(payment.amount) || 0),
          hasVerificationPending: prev.hasVerificationPending || payment.verification_status === "verification_pending",
          hasApproved: prev.hasApproved || payment.verification_status === "approved",
        };
        installmentPayments.set(key, next);
      } else {
        console.log('⚠️ [WARN] Could not parse installment number from installment_id', {
          installment_id: payment.installment_id
        });
      }
    }
  });

  console.log('🔍 [DEBUG] Payment allocation:', {
    totalRelevantPaid: relevantPaid,
    installmentSpecificPayments: installmentSpecificPayments.length,
    generalPayments: generalPayments.length,
    generalPaidAmount,
    installmentPayments: Object.fromEntries(Array.from(installmentPayments.entries()).map(([k,v]) => [k, { amount: v.amount, vp: v.hasVerificationPending, ap: v.hasApproved }]))
  });

  if (plan === "one_shot" && breakdown.oneShotPayment) {
    const total = Number(breakdown.oneShotPayment.amountPayable || 0);
    
    // For one-shot payments, we don't expect installment-specific payments, so use general payments
    const allocated = Math.min(generalPaidAmount, total);
    
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

  // Apply installment-specific payments first
  breakdown.semesters?.forEach((sem) => {
    sem.instalments?.forEach((inst) => {
      const total = Number(inst.amountPayable || 0);
      
      // Check for installment-specific payments
      const installmentKey = `${sem.semesterNumber}-${inst.installmentNumber}`;
      const alloc = installmentPayments.get(installmentKey);
      const installmentSpecificAmount = alloc?.amount || 0;
      
      // ONLY apply installment-specific payments - NO fallback to general payments
      let allocated = installmentSpecificAmount;
      
      const status = deriveInstallmentStatus(
        String(inst.paymentDate || new Date().toISOString().split("T")[0]),
        total,
        allocated,
        alloc?.hasVerificationPending || false,
        alloc?.hasApproved || false,
      );
      
      inst.status = status;
      inst.amountPaid = allocated;
      inst.amountPending = Math.max(0, total - allocated);
      totalPayableSchedule += total;
      dueItems.push({ dueDate: inst.paymentDate, pending: inst.amountPending, status });
      
      console.log('🔍 [DEBUG] Installment allocation (installment-specific only):', {
        semester: sem.semesterNumber,
        installment: inst.installmentNumber,
        total,
        installmentSpecificAmount,
        allocated,
        status,
        hasGeneralPayments: generalPayments.length > 0
      });
    });
  });

  // Emit a compact summary for quick visual verification
  try {
    const summary = breakdown.semesters?.map(sem => ({
      sem: sem.semesterNumber,
      items: (sem.instalments || []).map(inst => ({ i: inst.installmentNumber, paid: inst.amountPaid, pending: inst.amountPending, status: inst.status }))
    }));
    console.log('🧾 [SUMMARY] Per-installment allocation and status:', JSON.stringify(summary));
  } catch (_) {
    // ignore log errors
  }

  // If there are general payments (without installment targeting), throw an error
  if (generalPayments.length > 0) {
    console.log('🚨 [ERROR] General payments detected - all payments must target specific installments');
    console.log('🚨 [ERROR] General payments found:', generalPayments);
    throw new Error(`Payment system requires installment targeting. Found ${generalPayments.length} general payments without installment/semester identification. All payments must specify which installment they are for.`);
  }

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
    const { action = "full", studentId, cohortId, paymentPlan, scholarshipId, scholarshipData, additionalDiscountPercentage = 0, customDates, feeStructureData }: EdgeRequest = await req.json();

    console.log('🚀 Edge function called with:', { action, studentId, cohortId, paymentPlan, scholarshipId, scholarshipData, additionalDiscountPercentage, customDates });
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

    if (!cohortId) throw new Error("cohortId is required");
    if (!paymentPlan) throw new Error("paymentPlan is required for preview mode");

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
      scholarshipData,
    );

    if (action === "breakdown") {
      const response: EdgeResponse = { success: true, breakdown, feeStructure };
      return new Response(JSON.stringify(response), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // Load transactions if we need statuses/aggregates
    let transactions: Array<{ amount: number; verification_status: string | null; installment_id: string | null; semester_number: number | null }> = [];
    if (studentPaymentId) {
      const { data: tx } = await supabase
        .from("payment_transactions")
        .select("amount, verification_status, installment_id, semester_number")
        .eq("payment_id", studentPaymentId);
      transactions = Array.isArray(tx) ? tx as any : [];
    }

    const { breakdown: enriched, aggregate } = enrichWithStatuses(breakdown, transactions, resolvedPlan);

    if (action === "status") {
      const response: EdgeResponse = { success: true, aggregate, feeStructure };
      return new Response(JSON.stringify(response), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
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
        finalOneShotDate: enriched?.oneShotPayment?.paymentDate
      }
    };
    return new Response(JSON.stringify(response), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error: any) {
    console.error("payment-engine error:", error);
    console.error("Error stack:", error.stack);
    const response: EdgeResponse = { 
      success: false, 
      error: error?.message || "Unknown error"
    };
    return new Response(JSON.stringify(response), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});


