import React, { useState, useMemo, useCallback, useRef } from 'react';
import { PaymentScheduleOverrides } from '@/services/payments/PaymentScheduleOverrides';
import { PaymentPlan, FeeStructure, Scholarship } from '@/types/fee';
import { getPaymentBreakdown } from '@/services/payments/paymentEngineClient';
//

interface UseFeeReviewProps {
  feeStructure: FeeStructure;
  scholarships: Scholarship[];
  selectedPaymentPlan?: PaymentPlan;
  initialScholarshipId?: string;
}

export const useFeeReview = ({
  feeStructure,
  scholarships,
  selectedPaymentPlan: propSelectedPaymentPlan,
  initialScholarshipId,
}: UseFeeReviewProps) => {
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<PaymentPlan>(
    propSelectedPaymentPlan || 'one_shot'
  );
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>(
    initialScholarshipId || 'no_scholarship'
  );
  const [isPreloaded, setIsPreloaded] = useState(false);
  // Keep dates isolated per plan to avoid cross-plan contamination
  const [datesByPlan, setDatesByPlan] = useState<{
    one_shot: Record<string, string>;
    sem_wise: Record<string, string>;
    instalment_wise: Record<string, string>;
  }>({ one_shot: {}, sem_wise: {}, instalment_wise: {} });
  const [engineReview, setEngineReview] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const cachedReviewsRef = useRef<Record<string, any>>({});
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update selectedPaymentPlan when prop changes (important for editing custom plans)
  React.useEffect(() => {
    if (
      propSelectedPaymentPlan &&
      propSelectedPaymentPlan !== selectedPaymentPlan
    ) {
      console.log('🔄 useFeeReview: Updating selectedPaymentPlan from prop', {
        from: selectedPaymentPlan,
        to: propSelectedPaymentPlan,
      });
      setSelectedPaymentPlan(propSelectedPaymentPlan);
    }
  }, [propSelectedPaymentPlan, selectedPaymentPlan]);

  // Load existing dates from database when fee structure is loaded
  React.useEffect(() => {
    if (!feeStructure) return;

    console.log('🔄 Loading existing dates from database:', {
      one_shot_dates: feeStructure.one_shot_dates,
      sem_wise_dates: feeStructure.sem_wise_dates,
      instalment_wise_dates: feeStructure.instalment_wise_dates,
    });

    console.log('🔍 Debug - fee structure object:', {
      total_program_fee: feeStructure.total_program_fee,
      admission_fee: feeStructure.admission_fee,
      number_of_semesters: feeStructure.number_of_semesters,
      instalments_per_semester: feeStructure.instalments_per_semester,
      program_fee_includes_gst: feeStructure.program_fee_includes_gst,
      equal_scholarship_distribution:
        feeStructure.equal_scholarship_distribution,
      type: typeof feeStructure.equal_scholarship_distribution,
    });

    const existingDates = {
      one_shot: {},
      sem_wise: {},
      instalment_wise: {},
    };

    // Convert database dates to UI format
    if (
      feeStructure.one_shot_dates &&
      Object.keys(feeStructure.one_shot_dates).length > 0
    ) {
      existingDates.one_shot = PaymentScheduleOverrides.fromPlanSpecificJson(
        feeStructure.one_shot_dates,
        'one_shot'
      );
    }

    if (
      feeStructure.sem_wise_dates &&
      Object.keys(feeStructure.sem_wise_dates).length > 0
    ) {
      existingDates.sem_wise = PaymentScheduleOverrides.fromPlanSpecificJson(
        feeStructure.sem_wise_dates,
        'sem_wise'
      );
    }

    if (
      feeStructure.instalment_wise_dates &&
      Object.keys(feeStructure.instalment_wise_dates).length > 0
    ) {
      existingDates.instalment_wise =
        PaymentScheduleOverrides.fromPlanSpecificJson(
          feeStructure.instalment_wise_dates,
          'instalment_wise'
        );
    }

    console.log('✅ Converted existing dates:', existingDates);
    console.log('🔍 Debug - admission date in converted dates:', {
      one_shot_admission: existingDates.one_shot['admission'],
      sem_wise_admission: existingDates.sem_wise['admission'],
      instalment_wise_admission: existingDates.instalment_wise['admission'],
    });
    setDatesByPlan(existingDates);
  }, [feeStructure]);

  // Memoized function to generate cache key
  const getCacheKey = useCallback(
    (
      plan: PaymentPlan,
      scholarshipId: string,
      customDates: Record<string, string>
    ) => {
      return `${plan}-${scholarshipId}-${JSON.stringify(customDates)}`;
    },
    []
  );

  // Debounced function to fetch fee review
  const fetchFeeReview = useCallback(
    async (
      plan: PaymentPlan,
      scholarshipId: string,
      customDates: Record<string, string>
    ) => {
      // Skip if payment plan is not selected yet
      if (plan === 'not_selected') {
        return;
      }

      const cacheKey = getCacheKey(plan, scholarshipId, customDates);

      // Check cache first
      if (cachedReviewsRef.current[cacheKey]) {
        console.log('Using cached result for key:', cacheKey);
        setEngineReview(cachedReviewsRef.current[cacheKey]);
        setLoading(false); // Ensure loading is false for cached results
        return;
      }

      try {
        setLoading(true);

        // Find the scholarship ID
        let scholarshipIdParam: string | null = null;
        if (scholarshipId && scholarshipId !== 'no_scholarship') {
          scholarshipIdParam = scholarshipId;
        }

        // Find scholarship data for temporary scholarships
        let scholarshipData = null;
        if (scholarshipIdParam && scholarshipIdParam.startsWith('temp-')) {
          const tempScholarship = scholarships.find(
            s => s.id === scholarshipIdParam
          );
          if (tempScholarship) {
            scholarshipData = {
              id: tempScholarship.id,
              amount_percentage: tempScholarship.amount_percentage,
              name: tempScholarship.name,
            };
          }
        }

        const params = {
          cohortId: feeStructure.cohort_id,
          paymentPlan: plan as 'one_shot' | 'sem_wise' | 'instalment_wise',
          scholarshipId: scholarshipIdParam,
          scholarshipData, // Pass scholarship data for temporary scholarships
          customDates:
            Object.keys(customDates).length > 0 ? customDates : undefined,
          feeStructureData: {
            total_program_fee: feeStructure.total_program_fee,
            admission_fee: feeStructure.admission_fee,
            number_of_semesters: feeStructure.number_of_semesters,
            instalments_per_semester: feeStructure.instalments_per_semester,
            one_shot_discount_percentage:
              feeStructure.one_shot_discount_percentage,
            program_fee_includes_gst: feeStructure.program_fee_includes_gst,
            equal_scholarship_distribution:
              feeStructure.equal_scholarship_distribution,
          },
        };

        console.log('Calling payment engine with params:', params);
        console.log('🔍 Debug - customDates being passed:', customDates);
        console.log(
          '🔍 Debug - admission date in customDates:',
          customDates['admission']
        );
        console.log('🔍 Debug - fee structure data being sent:', {
          total_program_fee: params.feeStructureData?.total_program_fee,
          admission_fee: params.feeStructureData?.admission_fee,
          number_of_semesters: params.feeStructureData?.number_of_semesters,
          instalments_per_semester:
            params.feeStructureData?.instalments_per_semester,
          program_fee_includes_gst:
            params.feeStructureData?.program_fee_includes_gst,
          equal_scholarship_distribution:
            params.feeStructureData?.equal_scholarship_distribution,
        });
        console.log(
          '🔍 Debug - equal_scholarship_distribution value:',
          params.feeStructureData?.equal_scholarship_distribution
        );
        console.log(
          '🔍 Debug - equal_scholarship_distribution type:',
          typeof params.feeStructureData?.equal_scholarship_distribution
        );
        const result = await getPaymentBreakdown(params);

        console.log('🔍 Debug - raw payment engine result:', result);
        console.log('🔍 Debug - raw breakdown:', result.breakdown);
        console.log('🔍 Debug - raw semesters:', result.breakdown?.semesters);
        console.log('🔍 Debug - payment engine response:', {
          hasBreakdown: !!result.breakdown,
          admissionFee: result.breakdown?.admissionFee,
          admissionDate: result.breakdown?.admissionFee?.paymentDate,
          semesters: result.breakdown?.semesters?.map(s => ({
            semesterNumber: s.semesterNumber,
            totalScholarship: s.total?.scholarshipAmount,
            installments: s.instalments?.map(inst => ({
              installmentNumber: inst.installmentNumber,
              scholarshipAmount: inst.scholarshipAmount,
              baseAmount: inst.baseAmount,
            })),
          })),
        });
        console.log('🔍 Debug - scholarship distribution analysis:', {
          totalSemesters: result.breakdown?.semesters?.length,
          scholarshipPerSemester: result.breakdown?.semesters?.map(s => ({
            semester: s.semesterNumber,
            totalScholarship: s.total?.scholarshipAmount,
            installmentScholarships: s.instalments?.map(
              inst => inst.scholarshipAmount
            ),
          })),
        });
        console.log('🔍 Debug - detailed scholarship breakdown:', {
          semesters: result.breakdown?.semesters?.map(s => ({
            semesterNumber: s.semesterNumber,
            totalScholarship: s.total?.scholarshipAmount,
            installments: s.instalments?.map(inst => ({
              installmentNumber: inst.installmentNumber,
              scholarshipAmount: inst.scholarshipAmount,
              baseAmount: inst.baseAmount,
              totalAmount: inst.totalAmount,
            })),
          })),
        });

        // Log each semester individually to avoid console truncation
        result.breakdown?.semesters?.forEach((semester, index) => {
          console.log(
            `🔍 Debug - Semester ${index + 1} scholarship breakdown:`,
            {
              semesterNumber: semester.semesterNumber,
              totalScholarship: semester.total?.scholarshipAmount,
              installments: semester.instalments?.map(inst => ({
                installmentNumber: inst.installmentNumber,
                scholarshipAmount: inst.scholarshipAmount,
                baseAmount: inst.baseAmount,
                totalAmount: inst.totalAmount,
              })),
            }
          );

          // Log each installment individually
          semester.instalments?.forEach((inst, instIndex) => {
            console.log(
              `🔍 Debug - Semester ${index + 1}, Installment ${instIndex + 1}:`,
              {
                installmentNumber: inst.installmentNumber,
                scholarshipAmount: inst.scholarshipAmount,
                baseAmount: inst.baseAmount,
                totalAmount: inst.totalAmount,
              }
            );
          });
        });

        // Cache the result
        console.log('Caching result for key:', cacheKey);
        cachedReviewsRef.current[cacheKey] = result.breakdown;
        setEngineReview(result.breakdown);
      } catch (err: any) {
        console.error('fee preview calculation failed', err);
        console.error('Error details:', err.response?.data || err.message);
        (async () => {
          try {
            (await import('sonner')).toast?.error?.(
              'Failed to load fee preview.'
            );
          } catch (_) {
            /* Ignore toast error */
          }
        })();
        setEngineReview(null);
      } finally {
        setLoading(false);
      }
    },
    [feeStructure, getCacheKey, scholarships]
  );

  // Track previous values to determine if this is just a date change
  const prevValuesRef = useRef({
    selectedPaymentPlan,
    selectedScholarshipId,
    datesByPlan: JSON.stringify(datesByPlan),
  });

  // Main effect that handles all changes with appropriate debouncing
  React.useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Get current plan's custom dates
    const currentPlanDates = datesByPlan[selectedPaymentPlan] || {};

    // Check cache immediately and synchronously to prevent loading flicker
    const cacheKey = getCacheKey(
      selectedPaymentPlan,
      selectedScholarshipId,
      currentPlanDates
    );
    if (cachedReviewsRef.current[cacheKey]) {
      console.log('Immediate cache hit for key:', cacheKey);
      setEngineReview(cachedReviewsRef.current[cacheKey]);
      setLoading(false);
      return; // Exit early for cached data - no need for async operations
    }

    // Determine if only dates changed (not plan or scholarship)
    const planChanged =
      prevValuesRef.current.selectedPaymentPlan !== selectedPaymentPlan;
    const scholarshipChanged =
      prevValuesRef.current.selectedScholarshipId !== selectedScholarshipId;
    const datesChanged =
      prevValuesRef.current.datesByPlan !== JSON.stringify(datesByPlan);

    const isOnlyDateChange =
      datesChanged && !planChanged && !scholarshipChanged;

    // Update the ref
    prevValuesRef.current = {
      selectedPaymentPlan,
      selectedScholarshipId,
      datesByPlan: JSON.stringify(datesByPlan),
    };

    // Use debouncing only for date-only changes
    const delay = isOnlyDateChange ? 500 : 0; // 500ms debounce for date changes, immediate for plan/scholarship changes

    debounceTimeoutRef.current = setTimeout(() => {
      fetchFeeReview(
        selectedPaymentPlan,
        selectedScholarshipId,
        currentPlanDates
      );
    }, delay);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [
    selectedPaymentPlan,
    selectedScholarshipId,
    datesByPlan,
    fetchFeeReview,
    getCacheKey,
  ]);

  // Preload all payment plans for instant tab switching
  React.useEffect(() => {
    console.log('🔄 useFeeReview: Preload effect triggered', {
      isPreloaded,
      hasFeeStructure: !!feeStructure,
      currentDatesByPlan: datesByPlan,
    });

    if (!isPreloaded && feeStructure) {
      const preloadPlans = async () => {
        console.log('🚀 Starting preload of all payment plans...');
        const plans: PaymentPlan[] = [
          'one_shot',
          'sem_wise',
          'instalment_wise',
        ];
        const emptyDates = {};
        // Accumulate seed dates for all plans from engine
        const seeds: {
          one_shot: Record<string, string>;
          sem_wise: Record<string, string>;
          instalment_wise: Record<string, string>;
        } = { one_shot: {}, sem_wise: {}, instalment_wise: {} };

        // Preload all plans with no scholarship and with temporary scholarships for instant switching
        for (const plan of plans) {
          console.log(`📋 Preloading plan: ${plan}`);
          // Preload with no scholarship
          try {
            const noScholarshipResult = await getPaymentBreakdown({
              cohortId: feeStructure.cohort_id,
              paymentPlan: plan as 'one_shot' | 'sem_wise' | 'instalment_wise',
              scholarshipId: null,
              customDates: undefined,
              feeStructureData: {
                total_program_fee: feeStructure.total_program_fee,
                admission_fee: feeStructure.admission_fee,
                number_of_semesters: feeStructure.number_of_semesters,
                instalments_per_semester: feeStructure.instalments_per_semester,
                one_shot_discount_percentage:
                  feeStructure.one_shot_discount_percentage,
                program_fee_includes_gst: feeStructure.program_fee_includes_gst,
                equal_scholarship_distribution:
                  feeStructure.equal_scholarship_distribution,
              },
            });

            console.log(`✅ Preloaded ${plan} with no scholarship:`, {
              breakdown: noScholarshipResult.breakdown,
              oneShotPayment: noScholarshipResult.breakdown?.oneShotPayment,
              semesters: noScholarshipResult.breakdown?.semesters,
            });

            // Extract dates from the breakdown
            const extractedDates: Record<string, string> = {};
            const breakdown = noScholarshipResult.breakdown;

            // Extract admission date if available
            if (breakdown?.admissionFee?.paymentDate) {
              extractedDates['admission'] = breakdown.admissionFee.paymentDate;
            }

            if (plan === 'one_shot' && breakdown?.oneShotPayment?.paymentDate) {
              extractedDates['one-shot'] = breakdown.oneShotPayment.paymentDate;
            } else if (plan === 'sem_wise' && breakdown?.semesters) {
              breakdown.semesters.forEach((semester: any, index: number) => {
                if (semester.instalments?.[0]?.paymentDate) {
                  extractedDates[`semester-${index + 1}-instalment-0`] =
                    semester.instalments[0].paymentDate;
                }
              });
            } else if (plan === 'instalment_wise' && breakdown?.semesters) {
              breakdown.semesters.forEach((semester: any, semIndex: number) => {
                semester.instalments?.forEach(
                  (instalment: any, instIndex: number) => {
                    if (instalment.paymentDate) {
                      extractedDates[
                        `semester-${semIndex + 1}-instalment-${instIndex}`
                      ] = instalment.paymentDate;
                    }
                  }
                );
              });
            }

            console.log(`📅 Extracted dates for ${plan}:`, extractedDates);
            seeds[plan] = extractedDates;
          } catch (error) {
            console.error(
              `❌ Failed to preload ${plan} with no scholarship:`,
              error
            );
          }
        }

        console.log('🎯 All plans preloaded, seeds collected:', {
          one_shot_dates: Object.keys(seeds.one_shot).length,
          sem_wise_dates: Object.keys(seeds.sem_wise).length,
          instalment_wise_dates: Object.keys(seeds.instalment_wise).length,
        });

        // Seed dates immediately after preloading to ensure all tabs have dates
        setDatesByPlan(prev => {
          console.log('🔄 Setting dates by plan from preloaded seeds:', {
            previousDates: {
              one_shot: Object.keys(prev.one_shot || {}).length,
              sem_wise: Object.keys(prev.sem_wise || {}).length,
              instalment_wise: Object.keys(prev.instalment_wise || {}).length,
            },
            newSeeds: {
              one_shot: Object.keys(seeds.one_shot).length,
              sem_wise: Object.keys(seeds.sem_wise).length,
              instalment_wise: Object.keys(seeds.instalment_wise).length,
            },
          });

          // Only seed if we don't already have saved dates
          const hasSavedDates =
            Object.keys(prev.one_shot || {}).length > 0 ||
            Object.keys(prev.sem_wise || {}).length > 0 ||
            Object.keys(prev.instalment_wise || {}).length > 0;

          if (hasSavedDates) {
            console.log(
              '⏭️ Skipping engine seeding - saved dates already exist'
            );
            return prev;
          }

          console.log('🌱 Seeding all payment dates from engine:', {
            one_shot: Object.keys(seeds.one_shot),
            sem_wise: Object.keys(seeds.sem_wise),
            instalment_wise: Object.keys(seeds.instalment_wise),
          });

          return {
            one_shot: seeds.one_shot,
            sem_wise: seeds.sem_wise,
            instalment_wise: seeds.instalment_wise,
          };
        });

        setIsPreloaded(true);
        console.log('✅ Preloading completed, isPreloaded set to true');
      };

      preloadPlans();
    }
  }, [isPreloaded, feeStructure, getCacheKey, datesByPlan]);

  // Sync external initial scholarship selection only once when the component mounts
  React.useEffect(() => {
    if (initialScholarshipId) {
      setSelectedScholarshipId(initialScholarshipId);
    }
  }, [initialScholarshipId]); // Remove selectedScholarshipId from deps to prevent resetting user selections

  // Load dates for all plans when fee structure changes to prevent data loss
  React.useEffect(() => {
    try {
      const allPlanDates: {
        one_shot: Record<string, string>;
        sem_wise: Record<string, string>;
        instalment_wise: Record<string, string>;
      } = { one_shot: {}, sem_wise: {}, instalment_wise: {} };

      console.log('🔍 Loading dates from fee structure:', {
        hasOneShotDates: !!(feeStructure as any)?.one_shot_dates,
        hasSemWiseDates: !!(feeStructure as any)?.sem_wise_dates,
        hasInstalmentWiseDates: !!(feeStructure as any)?.instalment_wise_dates,
        oneShotDatesKeys: Object.keys(
          (feeStructure as any)?.one_shot_dates || {}
        ),
        semWiseDatesKeys: Object.keys(
          (feeStructure as any)?.sem_wise_dates || {}
        ),
        instalmentWiseDatesKeys: Object.keys(
          (feeStructure as any)?.instalment_wise_dates || {}
        ),
      });

      // Always load saved dates from database (not just when custom_dates_enabled)
      if (
        (feeStructure as any)?.one_shot_dates &&
        Object.keys((feeStructure as any).one_shot_dates).length > 0
      ) {
        allPlanDates.one_shot = PaymentScheduleOverrides.fromPlanSpecificJson(
          (feeStructure as any).one_shot_dates,
          'one_shot'
        );
      }
      if (
        (feeStructure as any)?.sem_wise_dates &&
        Object.keys((feeStructure as any).sem_wise_dates).length > 0
      ) {
        allPlanDates.sem_wise = PaymentScheduleOverrides.fromPlanSpecificJson(
          (feeStructure as any).sem_wise_dates,
          'sem_wise'
        );
      }
      if (
        (feeStructure as any)?.instalment_wise_dates &&
        Object.keys((feeStructure as any).instalment_wise_dates).length > 0
      ) {
        allPlanDates.instalment_wise =
          PaymentScheduleOverrides.fromPlanSpecificJson(
            (feeStructure as any).instalment_wise_dates,
            'instalment_wise'
          );
      }

      console.log('🔍 Converted dates from database:', {
        oneShotDates: allPlanDates.one_shot,
        semWiseDates: allPlanDates.sem_wise,
        instalmentWiseDates: allPlanDates.instalment_wise,
      });

      // Only update state if we have dates to load
      const hasAnyDates =
        Object.keys(allPlanDates.one_shot).length > 0 ||
        Object.keys(allPlanDates.sem_wise).length > 0 ||
        Object.keys(allPlanDates.instalment_wise).length > 0;

      if (hasAnyDates) {
        console.log('Loading saved dates for all plans:', allPlanDates);
        setDatesByPlan(prev => ({
          one_shot: { ...prev.one_shot, ...allPlanDates.one_shot },
          sem_wise: { ...prev.sem_wise, ...allPlanDates.sem_wise },
          instalment_wise: {
            ...prev.instalment_wise,
            ...allPlanDates.instalment_wise,
          },
        }));
      } else {
        console.log('No saved dates found in database');
      }
    } catch (error) {
      console.error('Error loading dates from fee structure:', error);
    }
  }, [feeStructure]);

  // The edge function already applies date overrides, so we can use the result directly
  const feeReview = useMemo(() => {
    return engineReview;
  }, [engineReview]);

  // Only seed from engine if no saved dates exist for the current plan
  React.useEffect(() => {
    if (!engineReview) return;

    // Check if we already have saved dates for this plan
    const currentPlanDates = datesByPlan[selectedPaymentPlan] || {};
    const hasSavedDates = Object.keys(currentPlanDates).length > 0;

    // If we have saved dates, don't overwrite with engine results
    if (hasSavedDates) {
      console.log(
        'Using saved dates, skipping engine seeding for plan:',
        selectedPaymentPlan
      );
      return;
    }

    // Also check if we have preloaded dates for this plan
    const hasPreloadedDates = Object.keys(currentPlanDates).length > 0;
    if (hasPreloadedDates) {
      console.log(
        'Using preloaded dates, skipping engine seeding for plan:',
        selectedPaymentPlan
      );
      return;
    }

    const seed: Record<string, string> = {};

    // Always seed admission date if available
    if (engineReview?.admissionFee?.paymentDate) {
      seed['admission'] = engineReview.admissionFee.paymentDate;
    }

    if (selectedPaymentPlan === 'one_shot') {
      const d = engineReview?.oneShotPayment?.paymentDate;
      if (typeof d === 'string' && d) seed['one-shot'] = d;
    } else if (selectedPaymentPlan === 'sem_wise') {
      const semesters = engineReview?.semesters || [];
      semesters.forEach((s: any) => {
        const v = s?.instalments?.[0]?.paymentDate;
        if (typeof v === 'string' && v)
          seed[`semester-${s.semesterNumber}-instalment-0`] = v;
      });
    } else if (selectedPaymentPlan === 'instalment_wise') {
      const semesters = engineReview?.semesters || [];
      semesters.forEach((s: any) => {
        (s?.instalments || []).forEach((inst: any, idx: number) => {
          const v = inst?.paymentDate;
          if (typeof v === 'string' && v)
            seed[`semester-${s.semesterNumber}-instalment-${idx}`] = v;
        });
      });
    }
    // Only seed if we have engine dates and no saved/preloaded dates
    if (Object.keys(seed).length > 0) {
      console.log(
        'Seeding dates from engine for plan:',
        selectedPaymentPlan,
        seed
      );
      setDatesByPlan(prev => {
        const currentPlanDates = prev[selectedPaymentPlan] || {};
        const updated = {
          ...prev,
          [selectedPaymentPlan]: { ...currentPlanDates, ...seed },
        };

        // If we have an admission date, sync it across all payment plans
        if (seed['admission']) {
          ['one_shot', 'sem_wise', 'instalment_wise'].forEach(plan => {
            if (plan !== selectedPaymentPlan) {
              updated[plan] = {
                ...updated[plan],
                admission: seed['admission'],
              };
            }
          });
        }

        return updated;
      });
    }
  }, [engineReview, selectedPaymentPlan, datesByPlan]);

  const handlePaymentDateChange = useCallback(
    (key: string, value: string) => {
      // Skip if payment plan is not selected yet
      if (selectedPaymentPlan === 'not_selected') return;

      setDatesByPlan(prev => {
        const currentPlanDates = prev[selectedPaymentPlan] || {};
        // Only update if the value actually changed
        if (currentPlanDates[key] === value) return prev;

        // If this is an admission date change, sync it across all payment plans
        if (key === 'admission') {
          const updated = { ...prev };
          // Update admission date in all payment plans
          ['one_shot', 'sem_wise', 'instalment_wise'].forEach(plan => {
            updated[plan] = { ...updated[plan], [key]: value };
          });
          return updated;
        }

        return {
          ...prev,
          [selectedPaymentPlan]: { ...currentPlanDates, [key]: value },
        };
      });
    },
    [selectedPaymentPlan]
  );

  const handleScholarshipSelect = useCallback((scholarshipId: string) => {
    setSelectedScholarshipId(scholarshipId);
  }, []);

  const handlePaymentPlanChange = useCallback((plan: PaymentPlan) => {
    setSelectedPaymentPlan(plan);
  }, []);

  const currentPlanDates =
    selectedPaymentPlan !== 'not_selected'
      ? datesByPlan[selectedPaymentPlan] || {}
      : {};

  return {
    selectedPaymentPlan,
    selectedScholarshipId,
    editablePaymentDates: currentPlanDates,
    datesByPlan, // Expose all plans' dates
    feeReview,
    loading,
    handlePaymentDateChange,
    handleScholarshipSelect,
    handlePaymentPlanChange,
  };
};
