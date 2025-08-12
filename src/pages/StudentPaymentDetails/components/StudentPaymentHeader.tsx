import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StudentPaymentHeaderProps {
  studentData: any;
  cohortData: any;
  selectedPaymentPlan: string;
  onBackToDashboard: () => void;
}

export const StudentPaymentHeader = React.memo<StudentPaymentHeaderProps>(({
  studentData,
  cohortData,
  selectedPaymentPlan,
  onBackToDashboard
}) => {
  const navigate = useNavigate();

  const getPaymentPlanDisplay = (plan: string) => {
    switch (plan) {
      case 'one_shot': return 'One-Shot Payment';
      case 'sem_wise': return 'Semester-wise Payment';
      case 'instalment_wise': return 'Installment-wise Payment';
      default: return plan;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToDashboard}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            {getPaymentPlanDisplay(selectedPaymentPlan)}
          </Badge>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Student Info */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Payment Details - {studentData?.first_name} {studentData?.last_name}
        </h1>
        <p className="text-muted-foreground">
          {cohortData?.name} • {studentData?.email}
        </p>
      </div>
    </div>
  );
});

StudentPaymentHeader.displayName = 'StudentPaymentHeader';
