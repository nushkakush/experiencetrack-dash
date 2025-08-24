import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { 
  PaymentPlan, 
  Breakdown, 
  FeeStructure,
  EdgeRequest 
} from './types.ts';
import { 
  extractBaseAmountFromTotal, 
  extractGSTFromTotal,
  calculateOneShotPayment,
  calculateSemesterPayment,
  distributeScholarshipAcrossSemesters
} from './calculations.ts';
import { 
  convertPlanSpecificJsonToDateKeys,
  generateDefaultUiDateKeys,
  applyDateOverrides
} from './date-utils.ts';

export const generateFeeStructureReview = async (
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

  const semesters: any[] = [];
  let oneShotPayment: any = undefined;

  if (paymentPlan === 'sem_wise' || paymentPlan === 'instalment_wise') {
    const installmentsPerSemester =
      paymentPlan === 'sem_wise' ? 1 : feeStructure.instalments_per_semester;
    
    // Calculate scholarship distribution across all semesters from last to first
    const scholarshipDistribution = distributeScholarshipAcrossSemesters(
      feeStructure.total_program_fee,
      feeStructure.admission_fee,
      feeStructure.number_of_semesters,
      scholarshipAmount
    );
    
    console.log('🎓 Scholarship distribution across semesters:', {
      totalScholarship: scholarshipAmount,
      distribution: scholarshipDistribution,
      semesters: feeStructure.number_of_semesters
    });
    
    for (let sem = 1; sem <= feeStructure.number_of_semesters; sem++) {
      const semesterInstallments = calculateSemesterPayment(
        sem,
        feeStructure.total_program_fee,
        feeStructure.admission_fee,
        feeStructure.number_of_semesters,
        installmentsPerSemester,
        scholarshipAmount,
        0,
        scholarshipDistribution
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
      paymentDate: (databaseDates as any)?.__admission_date || (databaseDates as any)?.admission || undefined,
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
