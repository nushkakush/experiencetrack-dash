import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { X } from 'lucide-react';

interface DialogHeaderProps {
  studentName: string;
  studentData?: {
    avatar_url?: string | null;
    user_id?: string | null;
  };
  paymentItemType: string;
  onClose: () => void;
}

export const AdminDialogHeader: React.FC<DialogHeaderProps> = ({
  studentName,
  studentData,
  paymentItemType,
  onClose,
}) => {
  return (
    <DialogHeader>
      <div className='flex items-center justify-between'>
        <div className="flex items-center gap-3">
          <UserAvatar
            avatarUrl={null}
            name={studentName}
            size="md"
            userId={studentData?.user_id}
          />
          <DialogTitle className='text-lg font-semibold'>
            Record Payment for {studentName} - {paymentItemType}
          </DialogTitle>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={onClose}
          className='h-6 w-6 p-0'
        >
          <X className='h-4 w-4' />
        </Button>
      </div>
    </DialogHeader>
  );
};
