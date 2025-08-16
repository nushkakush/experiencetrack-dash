import React from 'react';
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
  cohortStartDate: string;
  isReadOnly?: boolean;
}

export default function Step3Review({ feeStructure, scholarships, cohortStartDate, isReadOnly = false }: Step3ReviewProps) {
  const {
    selectedPaymentPlan,
    selectedScholarshipId,
    editablePaymentDates,
    feeReview,
    loading,
    handlePaymentDateChange,
    handleScholarshipSelect,
    handlePaymentPlanChange
  } = useFeeReview({ feeStructure, scholarships, cohortStartDate });

  if (loading || !feeReview) {
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
      <div>
        <h2 className="text-2xl font-bold">
          {isReadOnly ? 'Fee Structure Preview' : 'Fee Preview'}
        </h2>
        <p className="text-muted-foreground">
          {isReadOnly 
            ? 'Review the current fee structure across different payment plans and scholarship options'
            : 'Review the fee structure across different payment plans and scholarship options'
          }
        </p>
      </div>

      {/* Scholarship Selection */}
      <ScholarshipSelection
        scholarships={scholarships}
        selectedScholarshipId={selectedScholarshipId}
        onScholarshipSelect={handleScholarshipSelect}
        isReadOnly={isReadOnly}
      />

      {/* Payment Plan Tabs */}
      <Tabs value={selectedPaymentPlan} onValueChange={(value) => handlePaymentPlanChange(value as PaymentPlan)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="one_shot">One Shot Payment</TabsTrigger>
          <TabsTrigger value="sem_wise">Sem Wise Payment</TabsTrigger>
          <TabsTrigger value="instalment_wise">Instalment wise Payment</TabsTrigger>
        </TabsList>

        {/* Content based on payment plan */}
        <TabsContent value="one_shot" className="space-y-6">
          <AdmissionFeeSection
            admissionFee={feeReview.admissionFee}
            cohortStartDate={cohortStartDate}
            editablePaymentDates={editablePaymentDates}
            onPaymentDateChange={handlePaymentDateChange}
            isReadOnly={isReadOnly}
          />
          <OneShotPaymentSection
            oneShotPayment={feeReview.oneShotPayment}
            scholarships={scholarships}
            selectedScholarshipId={selectedScholarshipId}
            cohortStartDate={cohortStartDate}
            editablePaymentDates={editablePaymentDates}
            onPaymentDateChange={handlePaymentDateChange}
            isReadOnly={isReadOnly}
          />
          <OverallSummary
            overallSummary={feeReview.overallSummary}
            feeStructure={feeStructure}
            selectedPaymentPlan={selectedPaymentPlan}
            scholarships={scholarships}
            selectedScholarshipId={selectedScholarshipId}
          />
        </TabsContent>

        <TabsContent value="sem_wise" className="space-y-6">
          <AdmissionFeeSection
            admissionFee={feeReview.admissionFee}
            cohortStartDate={cohortStartDate}
            editablePaymentDates={editablePaymentDates}
            onPaymentDateChange={handlePaymentDateChange}
            isReadOnly={isReadOnly}
          />
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
          <OverallSummary
            overallSummary={feeReview.overallSummary}
            feeStructure={feeStructure}
            selectedPaymentPlan={selectedPaymentPlan}
            scholarships={scholarships}
            selectedScholarshipId={selectedScholarshipId}
          />
        </TabsContent>

        <TabsContent value="instalment_wise" className="space-y-6">
          <AdmissionFeeSection
            admissionFee={feeReview.admissionFee}
            cohortStartDate={cohortStartDate}
            editablePaymentDates={editablePaymentDates}
            onPaymentDateChange={handlePaymentDateChange}
            isReadOnly={isReadOnly}
          />
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
          <OverallSummary
            overallSummary={feeReview.overallSummary}
            feeStructure={feeStructure}
            selectedPaymentPlan={selectedPaymentPlan}
            scholarships={scholarships}
            selectedScholarshipId={selectedScholarshipId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
