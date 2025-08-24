import React, { useState, useEffect } from 'react';
import { TableCell } from '@/components/ui/table';
import { StudentPaymentSummary, PaymentPlan } from '@/types/fee';
import { getTotalDiscountPercentage } from '@/utils/scholarshipUtils';

interface PaymentPlanCellProps {
  student: StudentPaymentSummary;
}

export const PaymentPlanCell: React.FC<PaymentPlanCellProps> = ({ student }) => {
  const [scholarshipPercentage, setScholarshipPercentage] = useState<number>(0);

  useEffect(() => {
    const fetchScholarshipPercentage = async () => {
      if (student.scholarship_id && student.student_id) {
        const percentage = await getTotalDiscountPercentage(student.student_id, student.scholarship_id);
        console.log('🎓 [PaymentPlanCell] Total scholarship percentage:', {
          student_id: student.student_id,
          scholarship_id: student.scholarship_id,
          total_percentage: percentage
        });
        setScholarshipPercentage(percentage);
      }
    };

    fetchScholarshipPercentage();
  }, [student.scholarship_id, student.student_id]);

  const getPlanDisplay = (plan: PaymentPlan) => {
    if (!plan || plan === 'not_selected') {
      return '--';
    }
    
    switch (plan) {
      case 'one_shot':
        return 'One Shot';
      case 'sem_wise':
        return 'Semester Wise';
      case 'instalment_wise':
        return 'Instalment Wise';
      default:
        return plan;
    }
  };

  return (
    <TableCell>
      <div>
        <div className="font-medium">
          {getPlanDisplay(student.payment_plan)}
        </div>
        {student.scholarship_name && scholarshipPercentage > 0 && (
          <div className="text-sm text-blue-600">
            {student.scholarship_name} ({scholarshipPercentage}%)
          </div>
        )}
      </div>
    </TableCell>
  );
};
