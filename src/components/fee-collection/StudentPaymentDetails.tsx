import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { studentPaymentsService } from '@/services/studentPayments.service';
import { StudentPaymentSummary, PaymentTransaction, CommunicationHistory } from '@/types/fee';
import { 
  Eye, 
  Mail, 
  Download, 
  Award, 
  UserX, 
  Calendar, 
  DollarSign, 
  Phone, 
  Mail as MailIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface StudentPaymentDetailsProps {
  student: StudentPaymentSummary;
  onClose: () => void;
}

export const StudentPaymentDetails: React.FC<StudentPaymentDetailsProps> = ({ 
  student, 
  onClose 
}) => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [communications, setCommunications] = useState<CommunicationHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      loadStudentData();
    }
  }, [student]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      // Load transactions for all payments
      const allTransactions: PaymentTransaction[] = [];
      for (const payment of student.payments || []) {
        const result = await studentPaymentsService.getPaymentTransactions(payment.id);
        if (result.success && result.data) {
          allTransactions.push(...result.data);
        }
      }
      setTransactions(allTransactions);

      // Load communication history
      const commResult = await studentPaymentsService.getCommunicationHistory(student.student_id);
      if (commResult.success && commResult.data) {
        setCommunications(commResult.data);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const getStudentInitials = () => {
    const firstName = student.student?.first_name || '';
    const lastName = student.student?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getProgressPercentage = () => {
    if (student.total_amount === 0) return 0;
    return Math.round((student.paid_amount / student.total_amount) * 100);
  };

  const getPaymentPlanDisplay = () => {
    if (!student.payment_plan || student.payment_plan === 'not_selected') {
      return 'Not Selected';
    }
    
    switch (student.payment_plan) {
      case 'one_shot':
        return 'One-Shot Payment';
      case 'sem_wise':
        return 'Semester-wise Payment';
      case 'instalment_wise':
        return 'Installment-wise Payment';
      default:
        return student.payment_plan;
    }
  };

  const getPaymentProgress = () => {
    if (!student.payment_plan || student.payment_plan === 'not_selected') {
      return null;
    }

    const paidInstallments = student.payments?.filter(p => 
      p.status === 'paid' || p.status === 'complete'
    ).length || 0;

    const totalInstallments = student.payments?.length || 0;

    if (totalInstallments === 0) return null;

    return { paidInstallments, totalInstallments, percentage: Math.round((paidInstallments / totalInstallments) * 100) };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'complete':
      case 'on_time':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
      case 'partially_paid_overdue':
      case 'dropped':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'verification_pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCommunicationIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <MailIcon className="h-4 w-4" />;
      case 'whatsapp':
        return <Phone className="h-4 w-4" />;
      case 'sms':
        return <Mail className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  if (!student.student) {
    return (
      <Card className="w-80 h-full">
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No student data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 h-full overflow-y-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Student Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Student Info */}
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{getStudentInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">
              {student.student.first_name} {student.student.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">{student.student.email}</p>
            {student.student.phone && (
              <p className="text-sm text-muted-foreground">{student.student.phone}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Financial Summary */}
        <div>
          <h4 className="font-semibold mb-3">Financial Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Amount:</span>
              <span className="font-semibold">{formatCurrency(student.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Paid Amount:</span>
              <span className="font-semibold text-green-600">{formatCurrency(student.paid_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Payment Plan:</span>
              <span className="font-semibold text-blue-600">{getPaymentPlanDisplay()}</span>
            </div>
            {student.scholarship_name && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Scholarship:</span>
                <span className="font-semibold text-blue-600">
                  {student.scholarship_name} ({student.scholarship_percentage}%)
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Token Fee:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">₹25,000</span>
                {student.token_fee_paid ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            {getPaymentProgress() ? (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <span>{formatCurrency(student.paid_amount)} / {formatCurrency(student.total_amount)}</span>
                  <span>{getPaymentProgress()?.percentage}%</span>
                </div>
                <Progress value={getPaymentProgress()?.percentage || 0} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {getPaymentProgress()?.paidInstallments} of {getPaymentProgress()?.totalInstallments} installments paid
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Payment plan not selected</p>
                <p className="text-xs">Student needs to choose a payment plan</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div>
          <h4 className="font-semibold mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Schedule Present
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="h-3 w-3 mr-1" />
              Download Files
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Award className="h-3 w-3 mr-1" />
              Award Scholarship
            </Button>
            <Button variant="destructive" size="sm" className="text-xs">
              <UserX className="h-3 w-3 mr-1" />
              Mark as Dropped
            </Button>
          </div>
        </div>

        <Separator />

        {/* Payment Schedule */}
        <div>
          <h4 className="font-semibold mb-3">Payment Schedule</h4>
          {student.payments && student.payments.length > 0 ? (
            <div className="space-y-3">
              {student.payments?.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {payment.payment_type === 'admission_fee' ? 'Admission Fee' :
                       payment.payment_type === 'instalments' ? `Instalment ${payment.installment_number}` :
                       payment.payment_type === 'sem_plan' ? `Semester ${payment.semester_number}` :
                       'One-Shot Payment'}
                    </span>
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Amount Payable:</span>
                      <span>{formatCurrency(payment.amount_payable)}</span>
                    </div>
                    {payment.scholarship_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Scholarship Waiver:</span>
                        <span className="text-blue-600">-{formatCurrency(payment.scholarship_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Due:</span>
                      <span>{formatDate(payment.due_date)}</span>
                    </div>
                    {payment.payment_date && (
                      <div className="flex justify-between">
                        <span>Paid:</span>
                        <span>{formatDate(payment.payment_date)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    {payment.status === 'paid' ? (
                      <Button variant="outline" size="sm" className="text-xs">
                        <Download className="h-3 w-3 mr-1" />
                        Download Receipt
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Upload Receipt
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No payment schedule available</p>
              <p className="text-xs">Student needs to select a payment plan first</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Communication History */}
        <div>
          <h4 className="font-semibold mb-3">Communication History</h4>
          <div className="space-y-2">
            {communications.map((comm) => (
              <div key={comm.id} className="border rounded-lg p-2">
                <div className="flex items-center gap-2 mb-1">
                  {getCommunicationIcon(comm.channel)}
                  <span className="text-xs font-medium capitalize">{comm.type}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comm.sent_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{comm.subject}</p>
                <p className="text-xs">{comm.message}</p>
              </div>
            ))}
            {communications.length === 0 && (
              <p className="text-xs text-muted-foreground">No communication history</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
