import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  DollarSign,
  Building2,
  FileText,
  CreditCard,
  ArrowRight,
  Trophy,
  Star,
  Gift,
  Sparkles,
} from 'lucide-react';
import { PaymentPlan, StudentScholarshipWithDetails } from '@/types/fee';
import {
  CohortScholarshipRow,
  StudentPaymentRow,
} from '@/types/payments/DatabaseAlignedTypes';
import { FeeStructure } from '@/types/payments/PaymentCalculationTypes';
import { CohortStudent, Cohort } from '@/types/cohort';
import { toast } from 'sonner';
import { useFeatureFlag } from '@/lib/feature-flags';
import { PaymentPlanPreviewModal } from './PaymentPlanPreviewModal';

interface PaymentPlanSelectionProps {
  onPlanSelected: (plan: PaymentPlan) => void;
  isSubmitting?: boolean;
  feeStructure?: FeeStructure;
  studentData?: CohortStudent;
  cohortData?: Cohort;
  studentPayments?: StudentPaymentRow[];
  scholarships?: CohortScholarshipRow[];
  studentScholarship?: StudentScholarshipWithDetails;
}

const PaymentPlanSelection: React.FC<PaymentPlanSelectionProps> = ({
  onPlanSelected,
  isSubmitting = false,
  feeStructure,
  studentData,
  cohortData,
  studentPayments,
  scholarships,
  studentScholarship,
}) => {
  const [selectedPlan, setSelectedPlan] = React.useState<PaymentPlan | null>(
    null
  );
  const [showPreview, setShowPreview] = React.useState(false);

  // Check if student has been assigned a scholarship
  const studentScholarshipData = React.useMemo(() => {
    console.log('🔍 Scholarship Detection Debug:', {
      hasStudentScholarship: !!studentScholarship,
      studentScholarshipData: studentScholarship,
      hasStudentPayments: !!studentPayments,
      studentPaymentsLength: studentPayments?.length,
      hasScholarships: !!scholarships,
      scholarshipsLength: scholarships?.length,
    });

    // First check if we have direct student scholarship data
    if (studentScholarship && studentScholarship.scholarship) {
      console.log(
        '✅ Found scholarship in studentScholarship:',
        studentScholarship.scholarship
      );
      return studentScholarship.scholarship;
    }

    // Fallback: check student payments for scholarship_id
    if (!studentPayments || studentPayments.length === 0 || !scholarships) {
      console.log('❌ No scholarship found - missing data');
      return null;
    }

    const payment = studentPayments[0];
    if (!payment.scholarship_id) {
      console.log('❌ No scholarship found - no scholarship_id in payment');
      return null;
    }

    const foundScholarship = scholarships.find(
      scholarship => scholarship.id === payment.scholarship_id
    );
    console.log('🔍 Found scholarship in payments:', foundScholarship);
    return foundScholarship;
  }, [studentScholarship, studentPayments, scholarships]);

  // Calculate scholarship savings
  const scholarshipSavings = React.useMemo(() => {
    if (!studentScholarshipData || !feeStructure) {
      return null;
    }

    const totalProgramFee = Number(feeStructure.total_program_fee);

    // Get base scholarship percentage from the scholarship data
    const baseScholarshipPercentage =
      studentScholarshipData.amount_percentage || 0;

    // Get additional discount percentage from student scholarship assignment
    const additionalDiscountPercentage =
      studentScholarship?.additional_discount_percentage || 0;

    // Calculate total discount percentage
    const totalDiscountPercentage =
      baseScholarshipPercentage + additionalDiscountPercentage;

    // Calculate total scholarship amount
    const totalScholarshipAmount =
      (totalProgramFee * totalDiscountPercentage) / 100;
    const originalAmount = totalProgramFee;
    const finalAmount = originalAmount - totalScholarshipAmount;

    console.log('💰 Scholarship Calculation:', {
      totalProgramFee,
      baseScholarshipPercentage,
      additionalDiscountPercentage,
      totalDiscountPercentage,
      totalScholarshipAmount,
      finalAmount,
    });

    return {
      originalAmount,
      baseScholarshipAmount:
        (totalProgramFee * baseScholarshipPercentage) / 100,
      additionalDiscountAmount:
        (totalProgramFee * additionalDiscountPercentage) / 100,
      totalScholarshipAmount,
      finalAmount,
      basePercentage: baseScholarshipPercentage,
      additionalPercentage: additionalDiscountPercentage,
      totalPercentage: totalDiscountPercentage,
    };
  }, [studentScholarshipData, studentScholarship, feeStructure]);

  const handlePlanSelection = (plan: PaymentPlan) => {
    setSelectedPlan(plan);
    setShowPreview(true);
  };

  const confirmPlanSelection = () => {
    if (selectedPlan) {
      onPlanSelected(selectedPlan);
      setShowPreview(false);
      setSelectedPlan(null);
    }
  };

  const cancelPlanSelection = () => {
    setShowPreview(false);
    setSelectedPlan(null);
  };

  const { isEnabled: isCashDisabled } = useFeatureFlag(
    'cash-payment-disabled',
    { defaultValue: false }
  );

  const getPaymentMethods = (plan: PaymentPlan) => {
    const baseMethods = [
      { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
      ...(isCashDisabled ? [] : [{ value: 'cash', label: 'Cash', icon: '💵' }]),
      { value: 'cheque', label: 'Cheque', icon: '📄' },
      { value: 'dd', label: 'Demand Draft', icon: '🏛️' },
    ];

    // All payment plans now support online payment methods
    return [
      ...baseMethods,
      { value: 'scan_to_pay', label: 'Scan to Pay', icon: '📱' },
      { value: 'razorpay', label: 'Online Payment', icon: '💳' },
    ];
  };

  const getPlanIcon = (plan: PaymentPlan) => {
    switch (plan) {
      case 'one_shot':
        return <DollarSign className='h-8 w-8 text-green-600' />;
      case 'sem_wise':
        return <Building2 className='h-8 w-8 text-blue-600' />;
      case 'instalment_wise':
        return <FileText className='h-8 w-8 text-purple-600' />;
      default:
        return <CreditCard className='h-8 w-8 text-gray-600' />;
    }
  };

  const getPlanTitle = (plan: PaymentPlan) => {
    switch (plan) {
      case 'one_shot':
        return 'One Shot Payment';
      case 'sem_wise':
        return 'Semester Wise';
      case 'instalment_wise':
        return 'Installment Wise';
      default:
        return 'Payment Plan';
    }
  };

  const getPlanDescription = (plan: PaymentPlan) => {
    switch (plan) {
      case 'one_shot':
        return 'Pay the entire program fee upfront and get a discount. Best for students who can afford the full amount at once.';
      case 'sem_wise':
        return 'Pay semester by semester. Each semester fee is due at the beginning of that semester.';
      case 'instalment_wise':
        return 'Pay in smaller monthly installments throughout the program duration. Most flexible option.';
      default:
        return 'Choose your preferred payment plan.';
    }
  };

  const getPlanDiscount = (plan: PaymentPlan) => {
    if (plan === 'one_shot' && feeStructure?.one_shot_discount_percentage) {
      return `+${feeStructure.one_shot_discount_percentage}% discount`;
    }
    return null;
  };

  const plans: PaymentPlan[] = ['one_shot', 'sem_wise', 'instalment_wise'];

  return (
    <div className='space-y-6'>
      {/* Scholarship Celebration Section */}
      {studentScholarshipData && scholarshipSavings && (
        <div className='space-y-4'>
          <div className='text-center space-y-2'>
            <div className='flex items-center justify-center gap-2 mb-2'>
              <span className='text-2xl'>🎉</span>
              <h2 className='text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'>
                Congratulations!
              </h2>
              <span className='text-2xl'>🎉</span>
            </div>
            <p className='text-lg text-muted-foreground'>
              You just earned a{' '}
              <span className='font-semibold text-purple-600'>
                {scholarshipSavings.totalPercentage}% scholarship
              </span>
              !
            </p>
            <p className='text-sm text-muted-foreground'>
              {studentScholarshipData.name}
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto'>
            <div className='bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-xl p-4 text-center border border-purple-200 dark:border-purple-800 shadow-sm'>
              <div className='text-2xl mb-1'>🎯</div>
              <p className='text-xs text-muted-foreground mb-1'>
                Scholarship Percentage
              </p>
              <p className='text-xl font-bold text-purple-700 dark:text-purple-300'>
                {scholarshipSavings.totalPercentage}%
              </p>
            </div>
            <div className='bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800 shadow-sm'>
              <div className='text-2xl mb-1'>💰</div>
              <p className='text-xs text-muted-foreground mb-1'>You Save</p>
              <p className='text-xl font-bold text-green-700 dark:text-green-300'>
                ₹
                {scholarshipSavings.totalScholarshipAmount.toLocaleString(
                  'en-IN'
                )}
              </p>
            </div>
            <div className='bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800 shadow-sm'>
              <div className='text-2xl mb-1'>💳</div>
              <p className='text-xs text-muted-foreground mb-1'>Final Amount</p>
              <p className='text-xl font-bold text-blue-700 dark:text-blue-300'>
                ₹{scholarshipSavings.finalAmount.toLocaleString('en-IN')}
              </p>
              <p className='text-xs text-muted-foreground'>+GST</p>
            </div>
          </div>

          <p className='text-center text-sm text-muted-foreground'>
            ✨ This scholarship will be automatically applied to your payment
            plan below ✨
          </p>
        </div>
      )}

      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold'>Choose Your Payment Plan</h1>
        <p className='text-muted-foreground max-w-2xl mx-auto'>
          {studentScholarshipData
            ? 'Great news! Your scholarship has been applied. Choose your preferred payment plan below.'
            : 'Select the payment plan that works best for you. Each plan offers different payment methods and flexibility.'}
        </p>
        {!studentScholarshipData && scholarships && scholarships.length > 0 && (
          <p className='text-sm text-blue-600 max-w-2xl mx-auto'>
            💡 <strong>Note:</strong> Scholarships may be available for eligible
            students. Contact the administration for more information.
          </p>
        )}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {plans.map(plan => {
          const paymentMethods = getPaymentMethods(plan);
          const discount = getPlanDiscount(plan);

          return (
            <Card
              key={plan}
              className='relative hover:shadow-lg transition-shadow flex flex-col h-[600px]'
            >
              {discount && (
                <Badge className='absolute -top-2 -right-2 bg-green-600 text-white'>
                  {discount}
                </Badge>
              )}

              <CardHeader className='text-center pb-4 flex-shrink-0'>
                <div className='flex justify-center mb-2'>
                  {getPlanIcon(plan)}
                </div>
                <CardTitle className='text-xl'>{getPlanTitle(plan)}</CardTitle>
                <CardDescription className='text-sm leading-relaxed'>
                  {getPlanDescription(plan)}
                </CardDescription>
              </CardHeader>

              <CardContent className='flex flex-col h-full'>
                <div className='flex-grow space-y-4'>
                  {/* Payment Methods */}
                  <div className='space-y-2'>
                    <h4 className='text-sm font-medium text-muted-foreground'>
                      Available Payment Methods:
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {paymentMethods.map(method => (
                        <Badge
                          key={method.value}
                          variant='outline'
                          className='text-xs'
                        >
                          <span className='mr-1'>{method.icon}</span>
                          {method.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className='space-y-2'>
                    <h4 className='text-sm font-medium text-muted-foreground'>
                      Features:
                    </h4>
                    <ul className='text-sm space-y-1'>
                      {plan === 'one_shot' && (
                        <>
                          <li className='flex items-center gap-2'>
                            <CheckCircle className='h-3 w-3 text-green-600' />
                            <span>Maximum discount available</span>
                          </li>
                          <li className='flex items-center gap-2'>
                            <CheckCircle className='h-3 w-3 text-green-600' />
                            <span>No recurring payments</span>
                          </li>
                          <li className='flex items-center gap-2'>
                            <CheckCircle className='h-3 w-3 text-green-600' />
                            <span>Online payment option</span>
                          </li>
                        </>
                      )}
                      {plan === 'sem_wise' && (
                        <>
                          <li className='flex items-center gap-2'>
                            <CheckCircle className='h-3 w-3 text-green-600' />
                            <span>Pay per semester</span>
                          </li>
                          <li className='flex items-center gap-2'>
                            <CheckCircle className='h-3 w-3 text-green-600' />
                            <span>Manageable amounts</span>
                          </li>
                          <li className='flex items-center gap-2'>
                            <CheckCircle className='h-3 w-3 text-green-600' />
                            <span>Clear payment schedule</span>
                          </li>
                          <li className='flex items-center gap-2'>
                            <CheckCircle className='h-3 w-3 text-green-600' />
                            <span>Online payment options</span>
                          </li>
                        </>
                      )}
                      {plan === 'instalment_wise' && (
                        <>
                          <li className='flex items-center gap-2'>
                            <CheckCircle className='h-3 w-3 text-green-600' />
                            <span>Monthly installments</span>
                          </li>
                          <li className='flex items-center gap-2'>
                            <CheckCircle className='h-3 w-3 text-green-600' />
                            <span>Maximum flexibility</span>
                          </li>
                          <li className='flex items-center gap-2'>
                            <CheckCircle className='h-3 w-3 text-green-600' />
                            <span>Lower monthly payments</span>
                          </li>
                          <li className='flex items-center gap-2'>
                            <CheckCircle className='h-3 w-3 text-green-600' />
                            <span>Online payment options</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Select Button */}
                <div className='pt-4 mt-auto'>
                  <Button
                    onClick={() => handlePlanSelection(plan)}
                    disabled={isSubmitting}
                    className='w-full'
                    size='lg'
                  >
                    {isSubmitting ? (
                      'Selecting...'
                    ) : (
                      <>
                        Preview Payment Plan
                        <ArrowRight className='ml-2 h-4 w-4' />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className='text-center text-sm text-muted-foreground'>
        <p>
          ⚠️ <strong>Important:</strong> Once you select a payment plan, it
          cannot be changed. Please choose carefully.
        </p>
        <p className='mt-1'>
          To change your payment plan after selection, please contact the
          administration.
        </p>
      </div>

      <PaymentPlanPreviewModal
        isOpen={showPreview}
        onClose={cancelPlanSelection}
        onConfirm={confirmPlanSelection}
        selectedPlan={selectedPlan}
        feeStructure={feeStructure}
        studentData={studentData}
        cohortData={cohortData}
        studentScholarship={studentScholarship}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default PaymentPlanSelection;
