import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Building2, 
  FileText, 
  QrCode, 
  DollarSign,
  CheckCircle,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { PaymentPlan } from '@/types/fee';
import { toast } from 'sonner';
import { PaymentPlanPreviewModal } from './PaymentPlanPreviewModal';

interface PaymentPlanSelectionProps {
  onPlanSelected: (plan: PaymentPlan) => void;
  isSubmitting?: boolean;
  feeStructure?: any;
  studentData?: any;
  cohortData?: any;
}

const PaymentPlanSelection: React.FC<PaymentPlanSelectionProps> = ({
  onPlanSelected,
  isSubmitting = false,
  feeStructure,
  studentData,
  cohortData
}) => {
  const [selectedPlan, setSelectedPlan] = React.useState<PaymentPlan | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);

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

  const getPaymentMethods = (plan: PaymentPlan) => {
    const baseMethods = [
      { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
      { value: 'cash', label: 'Cash', icon: '💵' },
      { value: 'cheque', label: 'Cheque', icon: '📄' },
    ];

    if (plan === 'one_shot') {
      return [
        ...baseMethods,
        { value: 'razorpay', label: 'Online Payment (Razorpay)', icon: '💳' },
      ];
    }

    return baseMethods;
  };

  const getPlanIcon = (plan: PaymentPlan) => {
    switch (plan) {
      case 'one_shot':
        return <DollarSign className="h-8 w-8 text-green-600" />;
      case 'sem_wise':
        return <Building2 className="h-8 w-8 text-blue-600" />;
      case 'instalment_wise':
        return <FileText className="h-8 w-8 text-purple-600" />;
      default:
        return <CreditCard className="h-8 w-8 text-gray-600" />;
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
      return `${feeStructure.one_shot_discount_percentage}% discount`;
    }
    return null;
  };

  const plans: PaymentPlan[] = ['one_shot', 'sem_wise', 'instalment_wise'];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Choose Your Payment Plan</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the payment plan that works best for you. Each plan offers different payment methods and flexibility.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const paymentMethods = getPaymentMethods(plan);
          const discount = getPlanDiscount(plan);

          return (
            <Card key={plan} className="relative hover:shadow-lg transition-shadow flex flex-col h-[600px]">
              {discount && (
                <Badge className="absolute -top-2 -right-2 bg-green-600 text-white">
                  {discount}
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4 flex-shrink-0">
                <div className="flex justify-center mb-2">
                  {getPlanIcon(plan)}
                </div>
                <CardTitle className="text-xl">{getPlanTitle(plan)}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {getPlanDescription(plan)}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col h-full">
                <div className="flex-grow space-y-4">
                  {/* Payment Methods */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Available Payment Methods:</h4>
                    <div className="flex flex-wrap gap-2">
                      {paymentMethods.map((method) => (
                        <Badge key={method.value} variant="outline" className="text-xs">
                          <span className="mr-1">{method.icon}</span>
                          {method.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Features:</h4>
                    <ul className="text-sm space-y-1">
                      {plan === 'one_shot' && (
                        <>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>Maximum discount available</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>No recurring payments</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>Online payment option</span>
                          </li>
                        </>
                      )}
                      {plan === 'sem_wise' && (
                        <>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>Pay per semester</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>Manageable amounts</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>Clear payment schedule</span>
                          </li>
                        </>
                      )}
                      {plan === 'instalment_wise' && (
                        <>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>Monthly installments</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>Maximum flexibility</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>Lower monthly payments</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Select Button */}
                <div className="pt-4 mt-auto">
                  <Button 
                    onClick={() => handlePlanSelection(plan)}
                    disabled={isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      'Selecting...'
                    ) : (
                      <>
                        Preview Payment Plan
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>⚠️ <strong>Important:</strong> Once you select a payment plan, it cannot be changed. Please choose carefully.</p>
        <p className="mt-1">To change your payment plan after selection, please contact the administration.</p>
      </div>

      <PaymentPlanPreviewModal
        isOpen={showPreview}
        onClose={cancelPlanSelection}
        onConfirm={confirmPlanSelection}
        selectedPlan={selectedPlan}
        feeStructure={feeStructure}
        studentData={studentData}
        cohortData={cohortData}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default PaymentPlanSelection;
