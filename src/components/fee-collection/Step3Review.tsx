import React, { memo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentPlan, FeeStructure, Scholarship } from '@/types/fee';
import { useFeeReview } from './hooks/useFeeReview';
import { ScholarshipSelection } from './components/ScholarshipSelection';
import { AdmissionFeeSection } from './components/AdmissionFeeSection';
import { SemesterSection } from './components/SemesterSection';
import { OneShotPaymentSection } from './components/OneShotPaymentSection';
import { OverallSummary } from './components/OverallSummary';

interface Step3ReviewProps {
  feeStructure: FeeStructure;
  scholarships: Scholarship[];

  isReadOnly?: boolean;
  onDatesChange?: (datesByPlan: {
    one_shot: Record<string, string>;
    sem_wise: Record<string, string>;
    instalment_wise: Record<string, string>;
  }) => void;
  onPaymentPlanChange?: (plan: PaymentPlan) => void;
  selectedPaymentPlan?: PaymentPlan;
  /**
   * When provided, locks the UI to a single plan and hides the plan tabs.
   */
  restrictToPlan?: PaymentPlan;
  /**
   * When true, hides scholarship selection and related controls.
   */
  hideScholarshipControls?: boolean;
  /**
   * Optionally pre-select a scholarship (used in student-custom mode to preview cohort scholarships)
   */
  initialScholarshipId?: string;
}

const Step3Review = memo(function Step3Review({ feeStructure, scholarships, isReadOnly = false, onDatesChange, onPaymentPlanChange, selectedPaymentPlan: propSelectedPaymentPlan, restrictToPlan, hideScholarshipControls = false, initialScholarshipId }: Step3ReviewProps) {
  const {
    selectedPaymentPlan: internalSelectedPaymentPlan,
    selectedScholarshipId,
    editablePaymentDates,
    datesByPlan,
    feeReview,
    loading,
    handlePaymentDateChange,
    handleScholarshipSelect,
    handlePaymentPlanChange: internalHandlePaymentPlanChange
  } = useFeeReview({ feeStructure, scholarships, selectedPaymentPlan: propSelectedPaymentPlan, initialScholarshipId });

  // Use prop value if provided, otherwise fall back to internal state
  const selectedPaymentPlan = restrictToPlan || propSelectedPaymentPlan || internalSelectedPaymentPlan;

  // Create a wrapper that calls both internal and external handlers
  const handlePaymentPlanChange = React.useCallback((plan: PaymentPlan) => {
    if (restrictToPlan) return; // locked mode; ignore tab changes
    internalHandlePaymentPlanChange(plan);
    onPaymentPlanChange?.(plan);
  }, [internalHandlePaymentPlanChange, onPaymentPlanChange, restrictToPlan]);

  // Use ref to track previous dates and only call onDatesChange when dates actually change
  const prevDatesRef = React.useRef<{
    one_shot: Record<string, string>;
    sem_wise: Record<string, string>;
    instalment_wise: Record<string, string>;
  }>({ one_shot: {}, sem_wise: {}, instalment_wise: {} });

  // Memoize the dates to prevent unnecessary re-renders
  const memoizedDatesByPlan = React.useMemo(() => datesByPlan, [datesByPlan]);

  // Bubble up all plans' date edits to the setup layer so they can be saved as overrides
  React.useEffect(() => {
    console.log('🔄 Step3Review: Date sync effect triggered', {
      memoizedDatesByPlan,
      prevDatesRef: prevDatesRef.current,
      hasOnDatesChange: !!onDatesChange
    });
    
    // Only call onDatesChange if the dates have actually changed
    const allDatesString = JSON.stringify(memoizedDatesByPlan);
    const prevDatesString = JSON.stringify(prevDatesRef.current);
    
    console.log('📊 Date comparison:', {
      allDatesString,
      prevDatesString,
      datesChanged: allDatesString !== prevDatesString
    });
    
    if (allDatesString !== prevDatesString && onDatesChange) {
      console.log('✅ Calling onDatesChange with updated dates:', memoizedDatesByPlan);
      prevDatesRef.current = { ...memoizedDatesByPlan };
      onDatesChange(memoizedDatesByPlan); // Pass all plans' dates instead of just current
    }
  }, [memoizedDatesByPlan, onDatesChange]);

  // Memoize common props to prevent unnecessary re-renders - MUST be before any early returns
  const admissionFeeProps = React.useMemo(() => {
    if (!feeReview) return null;
    return {
      admissionFee: feeReview.admissionFee,
      editablePaymentDates,
      onPaymentDateChange: handlePaymentDateChange,
      isReadOnly
    };
  }, [feeReview, editablePaymentDates, handlePaymentDateChange, isReadOnly]);

  const overallSummaryProps = React.useMemo(() => {
    if (!feeReview) return null;
    return {
      overallSummary: feeReview.overallSummary,
      feeStructure,
      selectedPaymentPlan,
      scholarships,
      selectedScholarshipId
    };
  }, [feeReview, feeStructure, selectedPaymentPlan, scholarships, selectedScholarshipId]);

  // Only show loading for initial load, not for cached transitions
  if ((loading && !feeReview) || (!feeReview && !loading)) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-8 w-full bg-muted rounded animate-pulse" />
        <div className="h-8 w-full bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title and helper removed to avoid duplication with modal header */}

      {/* Scholarship Selection */}
      {!hideScholarshipControls && (
        <ScholarshipSelection
          scholarships={scholarships}
          selectedScholarshipId={selectedScholarshipId}
          onScholarshipSelect={handleScholarshipSelect}
          isReadOnly={isReadOnly}
        />
      )}

      {/* Payment Plan Tabs */}
      <Tabs value={selectedPaymentPlan} onValueChange={(value) => handlePaymentPlanChange(value as PaymentPlan)}>
        {!restrictToPlan && (
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="one_shot">One Shot Payment</TabsTrigger>
            <TabsTrigger value="sem_wise">Sem Wise Payment</TabsTrigger>
            <TabsTrigger value="instalment_wise">Instalment wise Payment</TabsTrigger>
          </TabsList>
        )}

        {/* Content based on payment plan */}
        <TabsContent value="one_shot" className="space-y-6">
          {admissionFeeProps && <AdmissionFeeSection {...admissionFeeProps} />}
          <OneShotPaymentSection
            oneShotPayment={feeReview.oneShotPayment}
            scholarships={scholarships}
            selectedScholarshipId={selectedScholarshipId}
            editablePaymentDates={editablePaymentDates}
            onPaymentDateChange={handlePaymentDateChange}
            isReadOnly={isReadOnly}
          />
          {overallSummaryProps && <OverallSummary {...overallSummaryProps} />}
        </TabsContent>

        <TabsContent value="sem_wise" className="space-y-6">
          {admissionFeeProps && <AdmissionFeeSection {...admissionFeeProps} />}
          {feeReview.semesters.map((semester) => (
            <SemesterSection
              key={semester.semesterNumber}
              semester={semester}
              scholarships={scholarships}
              selectedScholarshipId={selectedScholarshipId}
              editablePaymentDates={editablePaymentDates}
              onPaymentDateChange={handlePaymentDateChange}
              isReadOnly={isReadOnly}
            />
          ))}
          {overallSummaryProps && <OverallSummary {...overallSummaryProps} />}
        </TabsContent>

        <TabsContent value="instalment_wise" className="space-y-6">
          {admissionFeeProps && <AdmissionFeeSection {...admissionFeeProps} />}
          {feeReview.semesters.map((semester) => (
            <SemesterSection
              key={semester.semesterNumber}
              semester={semester}
              scholarships={scholarships}
              selectedScholarshipId={selectedScholarshipId}
              editablePaymentDates={editablePaymentDates}
              onPaymentDateChange={handlePaymentDateChange}
              isReadOnly={isReadOnly}
            />
          ))}
          {overallSummaryProps && <OverallSummary {...overallSummaryProps} />}
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default Step3Review;
