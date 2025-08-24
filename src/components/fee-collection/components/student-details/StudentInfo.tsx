import React from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Separator } from '@/components/ui/separator';
import { StudentPaymentSummary } from '@/types/fee';

interface StudentInfoProps {
  student: StudentPaymentSummary;
}

export const StudentInfo: React.FC<StudentInfoProps> = ({ student }) => {
  if (!student.student) {
    return null;
  }

  const studentName = `${student.student.first_name || ''} ${student.student.last_name || ''}`.trim() || student.student.email;

  return (
    <>
      <div className="flex items-center space-x-4 py-2">
        <UserAvatar
          avatarUrl={null}
          name={studentName}
          size="lg"
          userId={student.student.user_id}
          className="flex-shrink-0"
        />
        <div className="space-y-1 min-w-0 flex-1">
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
