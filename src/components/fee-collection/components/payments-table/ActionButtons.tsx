import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Mail, FileText } from 'lucide-react';

interface ActionButtonsProps {
  studentPendingCount: number;
  onViewStudentDetails: (e: React.MouseEvent) => void;
  onViewTransactions: (e: React.MouseEvent) => void;
  onSendMessage: (e: React.MouseEvent) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  studentPendingCount,
  onViewStudentDetails,
  onViewTransactions,
  onSendMessage,
}) => {
  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='ghost'
        size='sm'
        onClick={onViewStudentDetails}
        title='View Student Details'
      >
        <Eye className='h-4 w-4' />
      </Button>
      
      <div className='relative'>
        <Button
          variant='ghost'
          size='sm'
          onClick={onViewTransactions}
          title='View Transactions'
        >
          <FileText className='h-4 w-4' />
        </Button>
        {studentPendingCount > 0 && (
          <Badge
            variant='destructive'
            className='absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold'
          >
            {studentPendingCount > 99 ? '99+' : studentPendingCount}
          </Badge>
        )}
      </div>
      
      <Button
        variant='ghost'
        size='sm'
        onClick={onSendMessage}
        title='Message'
      >
        <Mail className='h-4 w-4' />
      </Button>
    </div>
  );
};
