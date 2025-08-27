import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CalendarIcon,
  Clock,
  Package,
  User,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { toast } from 'sonner';
import {
  useReturnEquipment,
  useLocations,
} from '@/hooks/equipment/useEquipment';
import { useQueryClient } from '@tanstack/react-query';
import {
  EquipmentBorrowing,
  ReturnEquipmentData,
  EquipmentConditionStatus,
} from '@/types/equipment';

// Helper function to safely format dates
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid Date';
};

interface ReturnEquipmentDialogProps {
  borrowing: EquipmentBorrowing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EQUIPMENT_CONDITIONS = [
  {
    value: 'excellent',
    label: 'Excellent',
    description: 'No visible damage, fully functional',
  },
  { value: 'good', label: 'Good', description: 'Minor wear, fully functional' },
  { value: 'poor', label: 'Poor', description: 'Significant wear or damage' },
  {
    value: 'damaged',
    label: 'Damaged',
    description: 'Non-functional or severely damaged',
  },
];

export function ReturnEquipmentDialog({
  borrowing,
  open,
  onOpenChange,
  onSuccess,
}: ReturnEquipmentDialogProps) {
  const [condition, setCondition] = useState<EquipmentConditionStatus>('good');
  const [newLocationId, setNewLocationId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const returnEquipmentMutation = useReturnEquipment();
  const { data: locations } = useLocations();
  const queryClient = useQueryClient();

  // Refetch borrowing data when dialog opens to get latest equipment condition
  useEffect(() => {
    if (open && borrowing?.id) {
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
    }
  }, [open, borrowing?.id, queryClient]);

  // Initialize condition from equipment's current condition
  useEffect(() => {
    if (borrowing?.equipment?.condition_status) {
      setCondition(borrowing.equipment.condition_status);
    }
  }, [borrowing?.equipment?.condition_status]);

  // Initialize location from equipment's current location
  useEffect(() => {
    if (borrowing?.equipment?.location_id) {
      setNewLocationId(borrowing.equipment.location_id);
    }
  }, [borrowing?.equipment?.location_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!borrowing) {
      toast.error('Borrowing information is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const returnData: ReturnEquipmentData = {
        borrowing_id: borrowing.id,
        condition: condition,
        new_location_id: newLocationId || undefined,
        notes: notes.trim() || null,
        returned_at: new Date().toISOString(),
      };

      await returnEquipmentMutation.mutateAsync(returnData);

      toast.success('Equipment returned successfully');
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error returning equipment:', error);
      toast.error('Failed to return equipment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCondition('good');
    setNewLocationId('');
    setNotes('');
    setIsSubmitting(false);

    onOpenChange(false);
  };

  // Helper function to safely calculate overdue status
  const calculateOverdueStatus = () => {
    if (!borrowing?.expected_return_date)
      return { isOverdue: false, overdueDays: 0 };

    const expectedDate = new Date(borrowing.expected_return_date);
    if (!isValid(expectedDate)) return { isOverdue: false, overdueDays: 0 };

    const now = new Date();
    const isOverdue = expectedDate < now;
    const overdueDays = isOverdue
      ? Math.ceil(
          (now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    return { isOverdue, overdueDays };
  };

  const { isOverdue, overdueDays } = calculateOverdueStatus();

  if (!borrowing) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Package className='h-5 w-5' />
            Return Equipment
            {borrowing?.equipment?.serial_number && (
              <span className='text-sm font-normal text-muted-foreground'>
                ({borrowing.equipment.serial_number})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Return Assessment */}
          <div className='space-y-4'>
            <div>
              <Label htmlFor='condition' className='text-base font-medium'>
                Update Equipment Condition *
              </Label>
              <Select value={condition} onValueChange={setCondition} required>
                <SelectTrigger className='h-12'>
                  <SelectValue placeholder='Select equipment condition'>
                    {condition &&
                      (() => {
                        const selectedCondition = EQUIPMENT_CONDITIONS.find(
                          cond => cond.value === condition
                        );
                        return selectedCondition ? (
                          <div className='flex flex-col text-left'>
                            <span className='font-medium'>
                              {selectedCondition.label}
                            </span>
                            <span className='text-xs text-muted-foreground'>
                              {selectedCondition.description}
                            </span>
                          </div>
                        ) : null;
                      })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_CONDITIONS.map(cond => (
                    <SelectItem key={cond.value} value={cond.value}>
                      <div className='flex flex-col'>
                        <span className='font-medium'>{cond.label}</span>
                        <span className='text-xs text-muted-foreground'>
                          {cond.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='location' className='text-base font-medium'>
                Return Location
              </Label>
              <Select value={newLocationId} onValueChange={setNewLocationId}>
                <SelectTrigger className='h-12'>
                  <SelectValue placeholder='Select return location' />
                </SelectTrigger>
                <SelectContent>
                  {locations?.locations?.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className='flex items-center gap-2'>
                        <MapPin className='h-4 w-4' />
                        {location.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='notes' className='text-base font-medium'>
                Return Notes
              </Label>
              <p className='text-sm text-muted-foreground mb-2'>
                Any additional notes about the return (optional)
              </p>
              <Textarea
                id='notes'
                placeholder='Enter any notes about the equipment return...'
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={!condition || isSubmitting}
              className='min-w-[100px]'
            >
              {isSubmitting ? 'Returning...' : 'Return Equipment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
