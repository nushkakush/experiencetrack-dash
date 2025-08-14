import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Award, 
  Calendar, 
  DollarSign,
  Building2,
  FileText,
  CreditCard,
  ArrowRight,
  X
} from 'lucide-react';
import { PaymentPlan } from '@/types/fee';
import { PaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';
import { 
  calculateOneShotBreakdown,
  calculateSemesterWiseBreakdown,
  calculateInstallmentWiseBreakdown,
  calculateScholarshipAmount
} from '../utils/paymentCalculationUtils';
import { calculateOneShotPayment, calculateSemesterPayment } from '@/utils/fee-calculations/payment-plans';
import { toast } from 'sonner';

interface PaymentPlanPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedPlan: PaymentPlan | null;
  feeStructure?: any;
  studentData?: any;
  cohortData?: any;
  isSubmitting?: boolean;
}

export const PaymentPlanPreviewModal: React.FC<PaymentPlanPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedPlan,
  feeStructure,
  studentData,
  cohortData,
  isSubmitting = false
}) => {
  const [paymentBreakdown, setPaymentBreakdown] = React.useState<PaymentBreakdown | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [hasScholarshipAwarded, setHasScholarshipAwarded] = React.useState(false);

  // Calculate payment breakdown for preview
  React.useEffect(() => {
    const calculatePreviewBreakdown = async () => {
      if (!selectedPlan || !feeStructure) {
        setPaymentBreakdown(null);
        return;
      }

      setLoading(true);
      try {
        const totalProgramFee = Number(feeStructure.total_program_fee);
        const admissionFee = Number(feeStructure.admission_fee);
        const admissionFeeGST = (admissionFee * 18) / 118; // Extract GST from admission fee

        // Calculate scholarship amount
        const scholarshipAmount = studentData?.id 
          ? await calculateScholarshipAmount(studentData.id, totalProgramFee)
          : 0;

        // Set scholarship status
        setHasScholarshipAwarded(scholarshipAmount > 0);

        let breakdown: PaymentBreakdown;

        if (selectedPlan === 'one_shot') {
          const oneShotResult = calculateOneShotBreakdown(feeStructure, scholarshipAmount, admissionFeeGST);
          breakdown = {
            admissionFee: {
              baseAmount: admissionFee - admissionFeeGST,
              scholarshipAmount: 0,
              discountAmount: 0,
              gstAmount: admissionFeeGST,
              totalPayable: admissionFee,
            },
            semesters: [],
            oneShotPayment: {
              paymentDate: oneShotResult.oneShotPayment.paymentDate,
              baseAmount: oneShotResult.oneShotPayment.baseAmount,
              scholarshipAmount: oneShotResult.oneShotPayment.scholarshipAmount,
              discountAmount: oneShotResult.oneShotPayment.discountAmount,
              gstAmount: oneShotResult.oneShotPayment.gstAmount,
              amountPayable: oneShotResult.oneShotPayment.amountPayable,
            },
            overallSummary: {
              totalProgramFee,
              admissionFee,
              totalGST: oneShotResult.overallSummary.totalGST,
              totalDiscount: oneShotResult.overallSummary.totalDiscount,
              totalScholarship: scholarshipAmount,
              totalAmountPayable: oneShotResult.overallSummary.totalAmountPayable,
            },
          };
        } else if (selectedPlan === 'sem_wise') {
          const semesterResult = calculateSemesterWiseBreakdown(feeStructure, scholarshipAmount, admissionFeeGST, admissionFee);
          breakdown = {
            admissionFee: {
              baseAmount: admissionFee - admissionFeeGST,
              scholarshipAmount: 0,
              discountAmount: 0,
              gstAmount: admissionFeeGST,
              totalPayable: admissionFee,
            },
            semesters: semesterResult.semesters.map(semester => ({
              semesterNumber: semester.semesterNumber,
              baseAmount: semester.total.baseAmount,
              scholarshipAmount: semester.total.scholarshipAmount,
              discountAmount: semester.total.discountAmount,
              gstAmount: semester.total.gstAmount,
              totalPayable: semester.total.totalPayable,
              instalments: semester.instalments.map((inst, index) => ({
                installmentNumber: index + 1,
                baseAmount: inst.baseAmount,
                scholarshipAmount: inst.scholarshipAmount,
                discountAmount: inst.discountAmount,
                gstAmount: inst.gstAmount,
                totalPayable: inst.amountPayable,
                paymentDate: new Date(inst.paymentDate),
                status: 'pending' as const
              }))
            })),
            overallSummary: {
              totalProgramFee,
              admissionFee,
              totalGST: semesterResult.overallSummary.totalGST,
              totalDiscount: 0,
              totalScholarship: scholarshipAmount,
              totalAmountPayable: semesterResult.overallSummary.totalAmountPayable,
            },
          };
        } else if (selectedPlan === 'instalment_wise') {
          const installmentResult = calculateInstallmentWiseBreakdown(feeStructure, scholarshipAmount, admissionFeeGST, admissionFee);
          breakdown = {
            admissionFee: {
              baseAmount: admissionFee - admissionFeeGST,
              scholarshipAmount: 0,
              discountAmount: 0,
              gstAmount: admissionFeeGST,
              totalPayable: admissionFee,
            },
            semesters: installmentResult.semesters.map(semester => ({
              semesterNumber: semester.semesterNumber,
              baseAmount: semester.total.baseAmount,
              scholarshipAmount: semester.total.scholarshipAmount,
              discountAmount: semester.total.discountAmount,
              gstAmount: semester.total.gstAmount,
              totalPayable: semester.total.totalPayable,
              instalments: semester.instalments.map((inst, index) => ({
                installmentNumber: index + 1,
                baseAmount: inst.baseAmount,
                scholarshipAmount: inst.scholarshipAmount,
                discountAmount: inst.discountAmount,
                gstAmount: inst.gstAmount,
                totalPayable: inst.amountPayable,
                paymentDate: new Date(inst.paymentDate),
                status: 'pending' as const
              }))
            })),
            overallSummary: {
              totalProgramFee,
              admissionFee,
              totalGST: installmentResult.overallSummary.totalGST,
              totalDiscount: 0,
              totalScholarship: scholarshipAmount,
              totalAmountPayable: installmentResult.overallSummary.totalAmountPayable,
            },
          };
        } else {
          breakdown = null;
        }

        setPaymentBreakdown(breakdown);
      } catch (error) {
        console.error('Error calculating payment breakdown:', error);
        setPaymentBreakdown(null);
        toast.error('Failed to generate payment preview. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    calculatePreviewBreakdown();
  }, [selectedPlan, feeStructure, studentData?.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPlanIcon = (plan: PaymentPlan) => {
    switch (plan) {
      case 'one_shot':
        return <DollarSign className="h-6 w-6 text-green-600" />;
      case 'sem_wise':
        return <Building2 className="h-6 w-6 text-blue-600" />;
      case 'instalment_wise':
        return <FileText className="h-6 w-6 text-purple-600" />;
      default:
        return <CreditCard className="h-6 w-6 text-gray-600" />;
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
        return 'One-time payment for the entire program with maximum discount';
      case 'sem_wise':
        return 'Payments divided by semesters with clear payment schedule';
      case 'instalment_wise':
        return 'Payments divided into monthly installments for maximum flexibility';
      default:
        return 'Payment plan preview';
    }
  };

  if (!selectedPlan) return null;

  if (!feeStructure) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Payment Plan Preview</DialogTitle>
            <DialogDescription>
              Unable to generate preview. Fee structure information is not available.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              Please contact the administration to set up your fee structure.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getPlanIcon(selectedPlan)}
            <div>
              <DialogTitle className="text-2xl font-bold">
                {getPlanTitle(selectedPlan)} - Preview
              </DialogTitle>
              <DialogDescription className="text-base">
                {getPlanDescription(selectedPlan)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : paymentBreakdown ? (
            <>
              {/* Payment Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Amount Card */}
                <Card className="border-2 border-blue-200 bg-blue-600/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold">
                          {formatCurrency(paymentBreakdown.overallSummary.totalAmountPayable)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total Amount Payable
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Admission Fee Card */}
                <Card className="border-2 border-green-200 bg-green-600/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold">
                          {formatCurrency(paymentBreakdown.admissionFee.totalPayable)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Admission Fee
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Scholarship Card */}
                {paymentBreakdown.overallSummary.totalScholarship > 0 && (
                  <Card className="border-2 border-purple-200 bg-purple-600/10">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600">
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-semibold">
                            {formatCurrency(paymentBreakdown.overallSummary.totalScholarship)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Scholarship Applied
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Plan Summary */}
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Plan</p>
                      <p className="text-lg font-semibold">{getPlanTitle(selectedPlan)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Semesters</p>
                      <p className="text-lg font-semibold">
                        {selectedPlan === 'one_shot' ? 'N/A' : paymentBreakdown.semesters.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Installments</p>
                      <p className="text-lg font-semibold">
                        {selectedPlan === 'one_shot' ? '1' : paymentBreakdown.semesters.reduce((sum, semester) => sum + semester.instalments.length, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Program Duration</p>
                      <p className="text-lg font-semibold">
                        {selectedPlan === 'one_shot' ? 'One-time' : `${paymentBreakdown.semesters.length * 6} months`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admission Fee Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Admission Fee
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Base Amount</p>
                      <p className="text-lg font-semibold">{formatCurrency(paymentBreakdown.admissionFee.baseAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">GST (18%)</p>
                      <p className="text-lg font-semibold">{formatCurrency(paymentBreakdown.admissionFee.gstAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Scholarship</p>
                      <p className="text-lg font-semibold">{formatCurrency(paymentBreakdown.admissionFee.scholarshipAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Payable</p>
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(paymentBreakdown.admissionFee.totalPayable)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* One-Shot Payment Breakdown */}
              {selectedPlan === 'one_shot' && paymentBreakdown.oneShotPayment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Program Fee (One-Shot Payment)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Full Payment</span>
                            <Badge variant="secondary">Due: {formatDate(paymentBreakdown.oneShotPayment.paymentDate)}</Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrency(paymentBreakdown.oneShotPayment.amountPayable)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {paymentBreakdown.oneShotPayment.scholarshipAmount > 0 && `-${formatCurrency(paymentBreakdown.oneShotPayment.scholarshipAmount)} scholarship`}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Base:</span>
                            <span className="ml-1">{formatCurrency(paymentBreakdown.oneShotPayment.baseAmount)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">GST:</span>
                            <span className="ml-1">{formatCurrency(paymentBreakdown.oneShotPayment.gstAmount)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Discount:</span>
                            <span className="ml-1">{formatCurrency(paymentBreakdown.oneShotPayment.discountAmount)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Scholarship:</span>
                            <span className="ml-1">{formatCurrency(paymentBreakdown.oneShotPayment.scholarshipAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Semester/Installment Breakdown - Only for non-one-shot plans */}
              {selectedPlan !== 'one_shot' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Payment Schedule</h3>
                  {paymentBreakdown.semesters.map((semester) => (
                    <Card key={semester.semesterNumber}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Semester {semester.semesterNumber}
                          </CardTitle>
                          <Badge variant="outline">
                            {semester.instalments.length} {semester.instalments.length === 1 ? 'Payment' : 'Payments'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {semester.instalments.map((installment, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {selectedPlan === 'sem_wise' ? `Semester ${semester.semesterNumber} Payment` :
                                     `Installment ${installment.installmentNumber || index + 1}`}
                                  </span>
                                  <Badge variant="secondary">Due: {formatDate(installment.paymentDate.toISOString())}</Badge>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-semibold text-green-600">
                                    {formatCurrency(installment.totalPayable)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {installment.scholarshipAmount > 0 && `-${formatCurrency(installment.scholarshipAmount)} scholarship`}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Base:</span>
                                  <span className="ml-1">{formatCurrency(installment.baseAmount)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">GST:</span>
                                  <span className="ml-1">{formatCurrency(installment.gstAmount)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Discount:</span>
                                  <span className="ml-1">{formatCurrency(installment.discountAmount)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Scholarship:</span>
                                  <span className="ml-1">{formatCurrency(installment.scholarshipAmount)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Separator className="my-4" />
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Semester Total:</span>
                          <span className="text-lg font-semibold">{formatCurrency(semester.totalPayable)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Overall Summary */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle>Complete Payment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Program Fee</p>
                      <p className="text-lg font-semibold">{formatCurrency(paymentBreakdown.overallSummary.totalProgramFee)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total GST</p>
                      <p className="text-lg font-semibold">{formatCurrency(paymentBreakdown.overallSummary.totalGST)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Discount</p>
                      <p className="text-lg font-semibold">{formatCurrency(paymentBreakdown.overallSummary.totalDiscount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount Payable</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(paymentBreakdown.overallSummary.totalAmountPayable)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Payment Plan Benefits */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Plan Benefits</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {selectedPlan === 'one_shot' && (
                        <>
                          <li>• Maximum discount of {feeStructure?.one_shot_discount_percentage || 0}% applied</li>
                          <li>• Single payment - no recurring payments</li>
                          <li>• Online payment option available</li>
                        </>
                      )}
                      {selectedPlan === 'sem_wise' && (
                        <>
                          <li>• Pay per semester - manageable amounts</li>
                          <li>• Clear payment schedule</li>
                          <li>• Flexible payment methods</li>
                        </>
                      )}
                      {selectedPlan === 'instalment_wise' && (
                        <>
                          <li>• Monthly installments - maximum flexibility</li>
                          <li>• Lower monthly payments</li>
                          <li>• Spread payments over program duration</li>
                        </>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Scholarship Information Message */}
              {!hasScholarshipAwarded && (
                <Card className="border-2 border-amber-200 bg-amber-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-1">Scholarship Information</h4>
                        <p className="text-sm text-amber-800">
                          Once you are awarded a scholarship, it will be applied to your payment plan. Currently, no scholarship has been awarded to you.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Unable to generate payment preview. Please try again.
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isSubmitting || !paymentBreakdown}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              'Confirming...'
            ) : (
              <>
                Select Payment Plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
