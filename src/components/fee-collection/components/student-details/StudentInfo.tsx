import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { StudentPaymentSummary } from '@/types/fee';

interface StudentInfoProps {
  student: StudentPaymentSummary;
}

export const StudentInfo: React.FC<StudentInfoProps> = ({ student }) => {
  const getStudentInitials = () => {
    const firstName = student.student?.first_name || '';
    const lastName = student.student?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!student.student) {
    return null;
  }

  return (
    <>
      <div className="flex items-center space-x-4">
        <Avatar className="h-12 w-12 bg-primary/10">
          <AvatarFallback className="text-primary font-semibold">{getStudentInitials()}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">
            {student.student.first_name} {student.student.last_name}
          </h3>
          <p className="text-sm text-muted-foreground">{student.student.email}</p>
          {student.student.phone && (
            <p className="text-sm text-muted-foreground">{student.student.phone}</p>
          )}
        </div>
      </div>
      <Separator className="bg-border" />
    </>
  );
};
