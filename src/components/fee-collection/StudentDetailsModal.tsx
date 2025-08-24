import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentPaymentSummary } from '@/types/fee';
import {
  StudentInfo,
  FinancialSummary,
  PaymentSchedule,
  CommunicationHistory,
  useStudentDetails,
} from './components/student-details';

interface StudentDetailsModalProps {
  student: StudentPaymentSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeStructure?: {
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    one_shot_dates?: Record<string, string>;
    sem_wise_dates?: Record<string, unknown>;
    instalment_wise_dates?: Record<string, unknown>;
  };
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  student,
  open,
  onOpenChange,
  feeStructure,
}) => {
  const { communications, loading } = useStudentDetails({ student });

  if (!student || !student.student) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          <div className='p-6'>
            <p className='text-muted-foreground'>No student data available</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='max-w-4xl max-h-[90vh] overflow-y-auto'
        aria-describedby='student-details-description'
      >
        <DialogHeader className='pb-6 border-b'>
          <div className='flex items-center justify-between'>
            <DialogTitle className='text-xl font-semibold'>
              Student Details
            </DialogTitle>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onOpenChange(false)}
              className='text-muted-foreground hover:text-foreground'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </DialogHeader>

        <div className='space-y-6 px-6 pb-6'>
          <div id='student-details-description' className='sr-only'>
            Student details modal containing financial summary, payment
            schedule, and communication history
          </div>
          {/* Student Info */}
          <StudentInfo student={student} />

          {/* Tabs for Financial Summary, Payment Schedule, and Communication History */}
          <Tabs defaultValue='financial' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='financial'>Financial Summary</TabsTrigger>
              <TabsTrigger value='schedule'>Payment Schedule</TabsTrigger>
              <TabsTrigger value='communication'>
                Communication History
              </TabsTrigger>
            </TabsList>

            <TabsContent value='financial' className='mt-4'>
              <FinancialSummary student={student} feeStructure={feeStructure} />
            </TabsContent>

            <TabsContent value='schedule' className='mt-4'>
              <PaymentSchedule student={student} feeStructure={feeStructure} />
            </TabsContent>

            <TabsContent value='communication' className='mt-4'>
              <CommunicationHistory communications={communications} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
