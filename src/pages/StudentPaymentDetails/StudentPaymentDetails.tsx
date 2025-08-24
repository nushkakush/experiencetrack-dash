/**
 * Student Payment Details - Refactored Main Component
 * Orchestrates the modular components while preserving all functionality
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PaymentHeader } from './components/PaymentHeader';
import { CourseOverview } from './components/CourseOverview';
import { PaymentSummary } from './components/PaymentSummary';
import { BankDetails } from './components/BankDetails';
import { OneShotPaymentSection } from './components/OneShotPaymentSection';
import { SemesterBreakdownSection } from './components/SemesterBreakdownSection';
import { usePaymentDetails } from './hooks/usePaymentDetails';
import { 
  formatCurrency, 
  formatDate, 
  getPaymentPlanDisplay, 
  getPaymentPlanIcon, 
  getPaymentPlanColor,
  getPaymentMethods 
} from './utils/paymentUtils';
import { PaymentPlan } from '@/types/payments';

const StudentPaymentDetails: React.FC = () => {
  const {
    loading,
    studentData,
    cohortData,
    feeStructure,
    selectedPaymentPlan,
    paymentSubmissions,
    submittingPayments,
    generatePaymentBreakdown,
    handleBackToDashboard,
    handlePaymentMethodChange,
    handleAmountChange,
    handleReceiptUpload,
    handleNotesChange,
    handlePaymentSubmission,
    canSubmitPayment
  } = usePaymentDetails();

  const paymentBreakdown = generatePaymentBreakdown();
  const paymentMethods = getPaymentMethods(selectedPaymentPlan as PaymentPlan);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!studentData || !cohortData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load student data</p>
          <Button onClick={handleBackToDashboard} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PaymentHeader
        cohortName={cohortData.name}
        studentName={studentData.full_name}
        studentData={studentData}
        selectedPaymentPlan={selectedPaymentPlan as PaymentPlan}
        onBackToDashboard={handleBackToDashboard}
        getPaymentPlanDisplay={getPaymentPlanDisplay}
        getPaymentPlanIcon={getPaymentPlanIcon}
        getPaymentPlanColor={getPaymentPlanColor}
      />

      {/* Course Overview */}
      <CourseOverview
        courseName={cohortData.course_name}
        selectedPaymentPlan={selectedPaymentPlan as PaymentPlan}
        getPaymentPlanDisplay={getPaymentPlanDisplay}
      />

      {/* Payment Summary */}
      <PaymentSummary
        paymentBreakdown={paymentBreakdown}
        selectedPaymentPlan={selectedPaymentPlan as PaymentPlan}
        feeStructure={feeStructure}
        cohortData={cohortData}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

      {/* Bank Details */}
      <BankDetails />

      {/* Detailed Breakdown - Using modular components */}
      {paymentBreakdown && (
        <>
          {/* One-Shot Payment Section */}
          {selectedPaymentPlan === 'one_shot' && paymentBreakdown.oneShotPayment && (
            <OneShotPaymentSection
              paymentBreakdown={paymentBreakdown}
              paymentSubmissions={paymentSubmissions}
              submittingPayments={submittingPayments}
              paymentMethods={paymentMethods}
              onPaymentMethodChange={handlePaymentMethodChange}
              onAmountChange={handleAmountChange}
              onReceiptUpload={handleReceiptUpload}
              onNotesChange={handleNotesChange}
              onSubmitPayment={handlePaymentSubmission}
              canSubmitPayment={canSubmitPayment}
            />
          )}

          {/* Semester Breakdown Section */}
          {selectedPaymentPlan !== 'one_shot' && paymentBreakdown.semesters && (
            <SemesterBreakdownSection paymentBreakdown={paymentBreakdown} />
          )}
        </>
      )}
    </div>
  );
};

export default StudentPaymentDetails;
