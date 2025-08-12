import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { StudentPaymentSummary } from '@/types/fee';
import { 
  StudentInfo, 
  FinancialSummary, 
  QuickActions, 
  PaymentSchedule, 
  CommunicationHistory, 
  useStudentDetails 
} from './components/student-details';

interface StudentPaymentDetailsProps {
  student: StudentPaymentSummary;
  onClose: () => void;
}

export const StudentPaymentDetails: React.FC<StudentPaymentDetailsProps> = ({ 
  student, 
  onClose 
}) => {
  const { communications, loading } = useStudentDetails({ student });

  if (!student.student) {
    return (
      <Card className="w-96 h-full">
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
    <Card className="w-96 h-full overflow-y-auto bg-background border-border">
      <CardHeader className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Student Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {/* Student Info */}
        <StudentInfo student={student} />

        {/* Financial Summary */}
        <FinancialSummary student={student} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Payment Schedule */}
        <PaymentSchedule student={student} />

        {/* Communication History */}
        <CommunicationHistory communications={communications} />
      </CardContent>
    </Card>
  );
};
