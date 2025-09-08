import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type {
  PaymentPlan,
  Breakdown,
  FeeStructure,
  EdgeRequest,
} from './types.ts';
import {
  extractBaseAmountFromTotal,
  extractGSTFromTotal,
  calculateOneShotPayment,
  calculateSemesterPayment,
  distributeScholarshipAcrossSemesters,
  calculateGST,
  roundToRupee,
} from './calculations.ts';
import {
  convertPlanSpecificJsonToDateKeys,
  generateDefaultUiDateKeys,
  applyDateOverrides,
} from './date-utils.ts';

export const generateFeeStructureReview = async (
  supabase: ReturnType<typeof createClient>,
  cohortId: string,
  paymentPlan: PaymentPlan,
  selectedScholarshipId: string | null | undefined,
  additionalDiscountPercentage: number,
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
          'cohort_id,total_program_fee,admission_fee,number_of_semesters,instalments_per_semester,one_shot_discount_percentage,one_shot_dates,sem_wise_dates,instalment_wise_dates,structure_type,student_id,program_fee_includes_gst,equal_scholarship_distribution'
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
          'cohort_id,total_program_fee,admission_fee,number_of_semesters,instalments_per_semester,one_shot_discount_percentage,one_shot_dates,sem_wise_dates,instalment_wise_dates,structure_type,program_fee_includes_gst,equal_scholarship_distribution'
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
      // Calculate scholarship on base amount (without GST)
      const programFeeBaseAmount = feeStructure.program_fee_includes_gst
        ? extractBaseAmountFromTotal(feeStructure.total_program_fee as number)
        : (feeStructure.total_program_fee as number);
      scholarshipAmount =
        Math.round(programFeeBaseAmount * (basePct / 100) * 100) / 100;
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
        // Calculate scholarship on base amount (without GST)
        const programFeeBaseAmount = feeStructure.program_fee_includes_gst
          ? extractBaseAmountFromTotal(feeStructure.total_program_fee as number)
          : (feeStructure.total_program_fee as number);
        scholarshipAmount =
          Math.round(programFeeBaseAmount * (basePct / 100) * 100) / 100;
        console.log(
          `Using saved scholarship: ID ${selectedScholarshipId} (${basePct}%) = ₹${scholarshipAmount}`
        );
      } else {
        console.log(
          `Scholarship not found in database: ${selectedScholarshipId}`
        );
      }
    }
  }

  // Add additional discount to scholarship amount if provided
  if (additionalDiscountPercentage > 0) {
    const programFeeBaseAmount = feeStructure.program_fee_includes_gst
      ? extractBaseAmountFromTotal(feeStructure.total_program_fee as number)
      : (feeStructure.total_program_fee as number);
    const additionalDiscountAmount =
      Math.round(
        programFeeBaseAmount * (additionalDiscountPercentage / 100) * 100
      ) / 100;
    scholarshipAmount += additionalDiscountAmount;
    console.log(
      `Added additional discount: ${additionalDiscountPercentage}% = ₹${additionalDiscountAmount}, Total scholarship: ₹${scholarshipAmount}`
    );
  }

  // Extract new toggle values from fee structure
  const programFeeIncludesGST = feeStructure.program_fee_includes_gst;
  const equalScholarshipDistribution =
    feeStructure.equal_scholarship_distribution;

  // Admission fee block - ALWAYS treat admission fee as including GST
  const admissionFeeBase = extractBaseAmountFromTotal(
    feeStructure.admission_fee
  );
  const admissionFeeGST = extractGSTFromTotal(feeStructure.admission_fee);

  console.log('🔍 Scholarship distribution toggle debug:', {
    equalScholarshipDistribution,
    feeStructureEqualScholarshipDistribution:
      feeStructure.equal_scholarship_distribution,
    scholarshipAmount,
  });

  console.log('🔍 GST Calculation Debug:', {
    programFeeIncludesGST,
    totalProgramFee: feeStructure.total_program_fee,
    admissionFee: feeStructure.admission_fee,
    extractedProgramFeeBase: extractBaseAmountFromTotal(
      feeStructure.total_program_fee
    ),
    extractedAdmissionFeeBase: extractBaseAmountFromTotal(
      feeStructure.admission_fee
    ),
    admissionFeeBase,
    admissionFeeGST,
    note: 'Admission fee ALWAYS treated as including GST',
  });

  const semesters: any[] = [];
  let oneShotPayment: any = undefined;

  if (paymentPlan === 'sem_wise' || paymentPlan === 'instalment_wise') {
    const installmentsPerSemester =
      paymentPlan === 'sem_wise' ? 1 : feeStructure.instalments_per_semester;

    // Calculate scholarship distribution based on the toggle
    const scholarshipDistribution = distributeScholarshipAcrossSemesters(
      feeStructure.total_program_fee,
      feeStructure.admission_fee,
      feeStructure.number_of_semesters,
      scholarshipAmount,
      equalScholarshipDistribution,
      programFeeIncludesGST
    );

    console.log('🎓 Scholarship distribution across semesters:', {
      totalScholarship: scholarshipAmount,
      distribution: scholarshipDistribution,
      semesters: feeStructure.number_of_semesters,
      followInstallmentPattern: equalScholarshipDistribution, // true = follow installment pattern, false = backwards
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
        scholarshipDistribution,
        programFeeIncludesGST,
        equalScholarshipDistribution,
        additionalDiscountPercentage
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
      scholarshipAmount,
      programFeeIncludesGST,
      additionalDiscountPercentage
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

  // PRIORITY 1: Use custom dates for preview mode, but generate missing dates if needed
  if (customDates && Object.keys(customDates).length > 0) {
    databaseDates = { ...customDates };
    console.log(
      '✅ PRIORITY 1: Using custom dates from preview parameter:',
      databaseDates
    );

    // Check if we have all required dates for the payment plan
    let hasAllRequiredDates = true;
    const requiredDateKeys: string[] = [];

    // Generate all required date keys for the payment plan
    if (paymentPlan === 'one_shot') {
      requiredDateKeys.push('one-shot');
    } else if (paymentPlan === 'sem_wise') {
      for (let sem = 1; sem <= feeStructure.number_of_semesters; sem++) {
        requiredDateKeys.push(`semester-${sem}-instalment-0`);
      }
    } else if (paymentPlan === 'instalment_wise') {
      for (let sem = 1; sem <= feeStructure.number_of_semesters; sem++) {
        for (let i = 0; i < feeStructure.instalments_per_semester; i++) {
          requiredDateKeys.push(`semester-${sem}-instalment-${i}`);
        }
      }
    }

    // Check which required dates are missing
    const missingDates = requiredDateKeys.filter(key => !databaseDates[key]);

    if (missingDates.length > 0) {
      console.log('⚠️ Custom dates incomplete, missing dates:', missingDates);
      hasAllRequiredDates = false;

      // Generate missing dates using cohort start date
      try {
        const { data: cohortRow } = await supabase
          .from('cohorts')
          .select('start_date')
          .eq('id', cohortId)
          .maybeSingle();
        const cohortStart =
          (cohortRow as { start_date?: string })?.start_date ||
          new Date().toISOString().split('T')[0];

        // Generate all dates and fill in missing ones
        const allGeneratedDates = generateDefaultUiDateKeys(
          paymentPlan,
          cohortStart,
          feeStructure.number_of_semesters,
          feeStructure.instalments_per_semester
        );

        // Fill in missing dates with generated ones
        missingDates.forEach(key => {
          if (allGeneratedDates[key]) {
            databaseDates[key] = allGeneratedDates[key];
            console.log(
              `✅ Filled missing date for ${key}: ${allGeneratedDates[key]}`
            );
          }
        });

        console.log(
          '✅ PRIORITY 1: Custom dates supplemented with generated dates:',
          databaseDates
        );
      } catch (e) {
        console.log('⚠️ Could not generate missing dates:', e);
      }
    } else {
      console.log('✅ PRIORITY 1: Custom dates are complete');
    }
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
      console.log(
        '🔍 Found instalment_wise_dates in database:',
        planSpecificDates
      );
    }

    if (planSpecificDates && Object.keys(planSpecificDates).length > 0) {
      databaseDates = convertPlanSpecificJsonToDateKeys(
        planSpecificDates,
        paymentPlan
      );
      console.log(
        '✅ PRIORITY 2: Using saved dates from database:',
        databaseDates
      );
    }
  }

  // PRIORITY 3: Fallback to auto-generation only if no saved dates exist
  if (!databaseDates || Object.keys(databaseDates).length === 0) {
    console.log(
      '🔄 PRIORITY 3: No saved dates found, generating defaults from cohort start_date'
    );
    try {
      const { data: cohortRow } = await supabase
        .from('cohorts')
        .select('start_date')
        .eq('id', cohortId)
        .maybeSingle();
      const cohortStart =
        (cohortRow as { start_date?: string })?.start_date ||
        new Date().toISOString().split('T')[0];
      databaseDates = generateDefaultUiDateKeys(
        paymentPlan,
        cohortStart,
        feeStructure.number_of_semesters,
        feeStructure.instalments_per_semester
      );
      console.log(
        '✅ PRIORITY 3: Generated default dates from cohort start_date:',
        {
          cohortStart,
          databaseDates,
        }
      );
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
  // Calculate total amount payable consistently with GST calculation
  // Include admission fee in total amount payable for both payment plans
  const totalAmountPayable =
    paymentPlan === 'one_shot'
      ? totalSemesterAmount +
        (oneShotPayment?.amountPayable || 0) +
        feeStructure.admission_fee
      : totalSemesterAmount +
        (oneShotPayment?.amountPayable || 0) +
        feeStructure.admission_fee;

  // Calculate overall GST correctly for the summary display
  // This should be GST on the total base amount after scholarship deduction
  let overallGST: number;
  if (programFeeIncludesGST) {
    // Extract base amount from total program fee
    const programFeeBase = extractBaseAmountFromTotal(
      feeStructure.total_program_fee
    );
    // Calculate scholarship on base amount
    const scholarshipOnBase =
      totalSemesterScholarship + (oneShotPayment?.scholarshipAmount || 0);
    // Calculate discount on base amount
    const discountOnBase =
      totalSemesterDiscount + (oneShotPayment?.discountAmount || 0);
    // Calculate amount after scholarship and discount
    const amountAfterDeductions =
      programFeeBase - scholarshipOnBase - discountOnBase;
    // Calculate GST on the remaining amount
    overallGST = calculateGST(amountAfterDeductions);

    console.log('🔍 Overall GST Calculation (Inclusive):', {
      programFeeBase,
      scholarshipOnBase,
      discountOnBase,
      amountAfterDeductions,
      overallGST,
      expectedGST: amountAfterDeductions * 0.18,
    });
  } else {
    // For exclusive GST, calculate GST on the total amount after scholarship and discount
    const totalBaseAmount = feeStructure.total_program_fee;
    const scholarshipOnBase =
      totalSemesterScholarship + (oneShotPayment?.scholarshipAmount || 0);
    const discountOnBase =
      totalSemesterDiscount + (oneShotPayment?.discountAmount || 0);
    const amountAfterDeductions =
      totalBaseAmount - scholarshipOnBase - discountOnBase;
    overallGST = calculateGST(amountAfterDeductions);

    console.log('🔍 Overall GST Calculation (Exclusive):', {
      totalBaseAmount,
      scholarshipOnBase,
      discountOnBase,
      amountAfterDeductions,
      overallGST,
      expectedGST: amountAfterDeductions * 0.18,
    });
  }

  const breakdown: Breakdown = {
    admissionFee: {
      baseAmount: admissionFeeBase,
      scholarshipAmount: 0,
      discountAmount: 0,
      gstAmount: admissionFeeGST,
      totalPayable: roundToRupee(feeStructure.admission_fee),
      paymentDate:
        (databaseDates as any)?.__admission_date ||
        (databaseDates as any)?.admission ||
        undefined,
    },
    semesters,
    oneShotPayment,
    overallSummary: {
      totalProgramFee: programFeeIncludesGST
        ? extractBaseAmountFromTotal(feeStructure.total_program_fee)
        : feeStructure.total_program_fee,
      admissionFee: feeStructure.admission_fee,
      totalGST: overallGST, // Use the correctly calculated overall GST
      totalDiscount:
        totalSemesterDiscount + (oneShotPayment?.discountAmount || 0),
      totalScholarship:
        totalSemesterScholarship + (oneShotPayment?.scholarshipAmount || 0),
      totalAmountPayable: roundToRupee(Math.max(0, totalAmountPayable)),
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

  console.log('🔍 FINAL GST Validation:', {
    programFeeIncludesGST,
    totalSemesterGST,
    oneShotPaymentGST: oneShotPayment?.gstAmount || 0,
    admissionFeeGST,
    admissionFeeBase,
    totalAmountPayable,
    calculatedTotalGST: breakdown.overallSummary.totalGST,
    oldTotalGST: totalSemesterGST + (oneShotPayment?.gstAmount || 0),
    overallGST,
    // Manual GST calculation for verification
    manualGSTCalculation: programFeeIncludesGST
      ? extractGSTFromTotal(feeStructure.total_program_fee)
      : calculateGST(feeStructure.total_program_fee),
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

      one_shot_dates: feeStructure.one_shot_dates || {},
      sem_wise_dates: feeStructure.sem_wise_dates || {},
      instalment_wise_dates: feeStructure.instalment_wise_dates || {},
      created_by: feeStructure.created_by || null,
      created_at: feeStructure.created_at || new Date().toISOString(),
      updated_at: feeStructure.updated_at || new Date().toISOString(),
    },
  };
};
