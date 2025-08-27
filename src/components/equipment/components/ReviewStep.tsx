import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCohorts } from '@/hooks/useCohorts';
import { useStudents } from '@/hooks/useStudents';
import { useAvailableEquipment } from '@/hooks/equipment/useEquipment';
import { IssuanceFormData } from '../schemas/issuanceFormSchema';

interface ReviewStepProps {
  form: UseFormReturn<IssuanceFormData>;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ form }) => {
  const { cohorts } = useCohorts();
  const { data: students } = useStudents(form.watch('cohort_id'));
  const { data: availableEquipment } = useAvailableEquipment();

  const selectedCohort = cohorts?.find(c => c.id === form.watch('cohort_id'));
  const selectedStudent = students?.find(
    s => s.id === form.watch('student_id')
  );
  const selectedEquipment = availableEquipment?.filter(e =>
    form.watch('equipment_ids').includes(e.id)
  );

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span className='font-medium'>Name:</span>
              <span>
                {selectedStudent?.first_name} {selectedStudent?.last_name}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Email:</span>
              <span>{selectedStudent?.email}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Cohort:</span>
              <span>{selectedCohort?.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipment to Issue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {selectedEquipment?.map(equipment => (
              <div
                key={equipment.id}
                className='flex justify-between items-center p-2 border rounded'
              >
                <div>
                  <div className='font-medium'>{equipment.name}</div>
                  <div className='text-sm text-muted-foreground'>
                    {equipment.category?.name} • {equipment.location?.name}
                  </div>
                </div>
                <Badge variant='outline'>{equipment.serial_number}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Borrowing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span className='font-medium'>Purpose:</span>
              <span className='text-right'>{form.watch('reason')}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Return Date:</span>
              <span>
                {form.watch('expected_return_date')} at{' '}
                {form.watch('expected_return_time')}
              </span>
            </div>
            {form.watch('notes') && (
              <div className='flex justify-between'>
                <span className='font-medium'>Notes:</span>
                <span className='text-right'>{form.watch('notes')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
