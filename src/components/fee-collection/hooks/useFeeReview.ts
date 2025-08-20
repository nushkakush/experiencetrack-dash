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

export const useFeeReview = ({ feeStructure, scholarships, selectedPaymentPlan: propSelectedPaymentPlan, initialScholarshipId }: UseFeeReviewProps) => {
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<PaymentPlan>(propSelectedPaymentPlan || 'one_shot');
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>(initialScholarshipId || 'no_scholarship');
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

  // Memoized function to generate cache key
  const getCacheKey = useCallback((plan: PaymentPlan, scholarshipId: string, customDates: Record<string, string>) => {
    return `${plan}-${scholarshipId}-${JSON.stringify(customDates)}`;
  }, []);

  // Debounced function to fetch fee review
  const fetchFeeReview = useCallback(async (plan: PaymentPlan, scholarshipId: string, customDates: Record<string, string>) => {
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
        const tempScholarship = scholarships.find(s => s.id === scholarshipIdParam);
        if (tempScholarship) {
          scholarshipData = {
            id: tempScholarship.id,
            amount_percentage: tempScholarship.amount_percentage,
            name: tempScholarship.name
          };
        }
        }
        
        const params = {
          cohortId: feeStructure.cohort_id,
        paymentPlan: plan as 'one_shot' | 'sem_wise' | 'instalment_wise',
        scholarshipId: scholarshipIdParam,
        scholarshipData, // Pass scholarship data for temporary scholarships
        customDates: Object.keys(customDates).length > 0 ? customDates : undefined,
          feeStructureData: {
            total_program_fee: feeStructure.total_program_fee,
            admission_fee: feeStructure.admission_fee,
            number_of_semesters: feeStructure.number_of_semesters,
            instalments_per_semester: feeStructure.instalments_per_semester,
            one_shot_discount_percentage: feeStructure.one_shot_discount_percentage,
          },
        };
        
        console.log('Calling payment engine with params:', params);
        const result = await getPaymentBreakdown(params);
        
      // Cache the result
      console.log('Caching result for key:', cacheKey);
      cachedReviewsRef.current[cacheKey] = result.breakdown;
      setEngineReview(result.breakdown);
      } catch (err: any) {
        console.error('fee preview calculation failed', err);
        console.error('Error details:', err.response?.data || err.message);
        (async () => { try { (await import('sonner')).toast?.error?.('Failed to load fee preview.'); } catch (_) {} })();
      setEngineReview(null);
      } finally {
      setLoading(false);
    }
  }, [feeStructure, getCacheKey, scholarships]);

  // Track previous values to determine if this is just a date change
  const prevValuesRef = useRef({
    selectedPaymentPlan,
    selectedScholarshipId,
    datesByPlan: JSON.stringify(datesByPlan)
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
    const cacheKey = getCacheKey(selectedPaymentPlan, selectedScholarshipId, currentPlanDates);
    if (cachedReviewsRef.current[cacheKey]) {
      console.log('Immediate cache hit for key:', cacheKey);
      setEngineReview(cachedReviewsRef.current[cacheKey]);
      setLoading(false);
      return; // Exit early for cached data - no need for async operations
    }

    // Determine if only dates changed (not plan or scholarship)
    const planChanged = prevValuesRef.current.selectedPaymentPlan !== selectedPaymentPlan;
    const scholarshipChanged = prevValuesRef.current.selectedScholarshipId !== selectedScholarshipId;
    const datesChanged = prevValuesRef.current.datesByPlan !== JSON.stringify(datesByPlan);
    
    const isOnlyDateChange = datesChanged && !planChanged && !scholarshipChanged;

    // Update the ref
    prevValuesRef.current = {
      selectedPaymentPlan,
      selectedScholarshipId,
      datesByPlan: JSON.stringify(datesByPlan)
    };

    // Use debouncing only for date-only changes
    const delay = isOnlyDateChange ? 500 : 0; // 500ms debounce for date changes, immediate for plan/scholarship changes

    debounceTimeoutRef.current = setTimeout(() => {
      fetchFeeReview(selectedPaymentPlan, selectedScholarshipId, currentPlanDates);
    }, delay);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [selectedPaymentPlan, selectedScholarshipId, datesByPlan, fetchFeeReview, getCacheKey]);

  // Preload all payment plans for instant tab switching
  React.useEffect(() => {
    if (!isPreloaded && feeStructure) {
      const preloadPlans = async () => {
        const plans: PaymentPlan[] = ['one_shot', 'sem_wise', 'instalment_wise'];
        const emptyDates = {};
        // Accumulate seed dates for all plans from engine
        const seeds: {
          one_shot: Record<string, string>;
          sem_wise: Record<string, string>;
          instalment_wise: Record<string, string>;
        } = { one_shot: {}, sem_wise: {}, instalment_wise: {} };
        
        // Preload all plans with no scholarship and with temporary scholarships for instant switching
        for (const plan of plans) {
          // Preload with no scholarship
          const noScholarshipCacheKey = getCacheKey(plan, 'no_scholarship', emptyDates);
          if (!cachedReviewsRef.current[noScholarshipCacheKey]) {
            try {
              const params = {
                cohortId: feeStructure.cohort_id,
                paymentPlan: plan as 'one_shot' | 'sem_wise' | 'instalment_wise',
                scholarshipId: null,
                scholarshipData: null,
                customDates: undefined,
                feeStructureData: {
                  total_program_fee: feeStructure.total_program_fee,
                  admission_fee: feeStructure.admission_fee,
                  number_of_semesters: feeStructure.number_of_semesters,
                  instalments_per_semester: feeStructure.instalments_per_semester,
                  one_shot_discount_percentage: feeStructure.one_shot_discount_percentage,
                },
              };
              
              const result = await getPaymentBreakdown(params);
              cachedReviewsRef.current[noScholarshipCacheKey] = result.breakdown;
              // Extract dates for seeding
              const b = result.breakdown;
              if (plan === 'one_shot') {
                const d = b?.oneShotPayment?.paymentDate;
                if (typeof d === 'string' && d) seeds.one_shot['one-shot'] = d;
              } else if (plan === 'sem_wise') {
                (b?.semesters || []).forEach((s: any) => {
                  const v = s?.instalments?.[0]?.paymentDate;
                  if (typeof v === 'string' && v) seeds.sem_wise[`semester-${s.semesterNumber}-instalment-0`] = v;
                });
              } else {
                (b?.semesters || []).forEach((s: any) => {
                  (s?.instalments || []).forEach((inst: any, idx: number) => {
                    const v = inst?.paymentDate;
                    if (typeof v === 'string' && v) seeds.instalment_wise[`semester-${s.semesterNumber}-instalment-${idx}`] = v;
                  });
                });
              }
              console.log('Preloaded plan (no scholarship):', plan);
            } catch (err) {
              console.warn('Failed to preload plan (no scholarship):', plan, err);
            }
          }
          
          // Preload with temporary scholarships
          for (const scholarship of scholarships) {
            const scholarshipCacheKey = getCacheKey(plan, scholarship.id, emptyDates);
            if (!cachedReviewsRef.current[scholarshipCacheKey]) {
              try {
                let scholarshipData = null;
                if (scholarship.id.startsWith('temp-')) {
                  scholarshipData = {
                    id: scholarship.id,
                    amount_percentage: scholarship.amount_percentage,
                    name: scholarship.name
                  };
                }
                
                const params = {
                  cohortId: feeStructure.cohort_id,
                  paymentPlan: plan as 'one_shot' | 'sem_wise' | 'instalment_wise',
                  scholarshipId: scholarship.id,
                  scholarshipData,
                  customDates: undefined,
                  feeStructureData: {
                    total_program_fee: feeStructure.total_program_fee,
                    admission_fee: feeStructure.admission_fee,
                    number_of_semesters: feeStructure.number_of_semesters,
                    instalments_per_semester: feeStructure.instalments_per_semester,
                    one_shot_discount_percentage: feeStructure.one_shot_discount_percentage,
                  },
                };
                
                const result = await getPaymentBreakdown(params);
                cachedReviewsRef.current[scholarshipCacheKey] = result.breakdown;
                console.log('Preloaded plan with scholarship:', plan, scholarship.name);
              } catch (err) {
                console.warn('Failed to preload plan with scholarship:', plan, scholarship.name, err);
              }
            }
          }
        }
        // Seed dates once after preloading to avoid flicker; preserve any user edits
        setDatesByPlan(prev => {
          // Only seed if we don't already have saved dates
          const hasSavedDates = Object.keys(prev.one_shot).length > 0 || 
                               Object.keys(prev.sem_wise).length > 0 || 
                               Object.keys(prev.instalment_wise).length > 0;
          
          if (hasSavedDates) {
            console.log('Skipping engine seeding - saved dates already exist');
            return prev;
          }
          
          return {
            one_shot: { ...seeds.one_shot, ...prev.one_shot },
            sem_wise: { ...seeds.sem_wise, ...prev.sem_wise },
            instalment_wise: { ...seeds.instalment_wise, ...prev.instalment_wise },
          };
        });
        setIsPreloaded(true);
      };
      
      preloadPlans();
    }
  }, [feeStructure, isPreloaded, getCacheKey, scholarships]);

  // Sync external prop with internal state
  React.useEffect(() => {
    if (propSelectedPaymentPlan && propSelectedPaymentPlan !== selectedPaymentPlan) {
      setSelectedPaymentPlan(propSelectedPaymentPlan);
    }
  }, [propSelectedPaymentPlan, selectedPaymentPlan]);

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

      // Always load saved dates from database (not just when custom_dates_enabled)
      if ((feeStructure as any)?.one_shot_dates && Object.keys((feeStructure as any).one_shot_dates).length > 0) {
        allPlanDates.one_shot = PaymentScheduleOverrides.fromPlanSpecificJson((feeStructure as any).one_shot_dates, 'one_shot');
      }
      if ((feeStructure as any)?.sem_wise_dates && Object.keys((feeStructure as any).sem_wise_dates).length > 0) {
        allPlanDates.sem_wise = PaymentScheduleOverrides.fromPlanSpecificJson((feeStructure as any).sem_wise_dates, 'sem_wise');
      }
      if ((feeStructure as any)?.instalment_wise_dates && Object.keys((feeStructure as any).instalment_wise_dates).length > 0) {
        allPlanDates.instalment_wise = PaymentScheduleOverrides.fromPlanSpecificJson((feeStructure as any).instalment_wise_dates, 'instalment_wise');
      }

      // Only update state if we have dates to load
      const hasAnyDates = Object.keys(allPlanDates.one_shot).length > 0 || 
                         Object.keys(allPlanDates.sem_wise).length > 0 || 
                         Object.keys(allPlanDates.instalment_wise).length > 0;

      if (hasAnyDates) {
        console.log('Loading saved dates for all plans:', allPlanDates);
        setDatesByPlan(prev => ({
          one_shot: { ...prev.one_shot, ...allPlanDates.one_shot },
          sem_wise: { ...prev.sem_wise, ...allPlanDates.sem_wise },
          instalment_wise: { ...prev.instalment_wise, ...allPlanDates.instalment_wise },
        }));
      }
    } catch (err) {
      console.error('Error loading dates:', err);
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
      console.log('Using saved dates, skipping engine seeding for plan:', selectedPaymentPlan);
      return;
    }
    
    const seed: Record<string, string> = {};
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
    // Only seed if we have engine dates and no saved dates
    if (Object.keys(seed).length > 0) {
      console.log('Seeding dates from engine for plan:', selectedPaymentPlan, seed);
      setDatesByPlan(prev => {
        const currentPlanDates = prev[selectedPaymentPlan] || {};
        return {
          ...prev,
          [selectedPaymentPlan]: { ...currentPlanDates, ...seed },
        };
      });
    }
  }, [engineReview, selectedPaymentPlan, datesByPlan]);

  const handlePaymentDateChange = useCallback((key: string, value: string) => {
    // Skip if payment plan is not selected yet
    if (selectedPaymentPlan === 'not_selected') return;
    
    setDatesByPlan(prev => {
      const currentPlanDates = prev[selectedPaymentPlan] || {};
      // Only update if the value actually changed
      if (currentPlanDates[key] === value) return prev;
      
      return {
      ...prev,
        [selectedPaymentPlan]: { ...currentPlanDates, [key]: value },
  };
    });
  }, [selectedPaymentPlan]);

  const handleScholarshipSelect = useCallback((scholarshipId: string) => {
    setSelectedScholarshipId(scholarshipId);
  }, []);

  const handlePaymentPlanChange = useCallback((plan: PaymentPlan) => {
    setSelectedPaymentPlan(plan);
  }, []);

  const currentPlanDates = selectedPaymentPlan !== 'not_selected' ? (datesByPlan[selectedPaymentPlan] || {}) : {};

  return {
    selectedPaymentPlan,
    selectedScholarshipId,
    editablePaymentDates: currentPlanDates,
    datesByPlan, // Expose all plans' dates
    feeReview,
    loading,
    handlePaymentDateChange,
    handleScholarshipSelect,
    handlePaymentPlanChange
  };
};
