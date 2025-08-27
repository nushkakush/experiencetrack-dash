import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, DollarSign } from 'lucide-react';
import { useCreateDamageReport } from '@/hooks/equipment/useEquipment';
import { CreateDamageReportData } from '@/types/equipment';
import { toast } from 'sonner';

interface ReportDamageLossDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipmentName: string;
}

export const ReportDamageLossDialog: React.FC<ReportDamageLossDialogProps> = ({
  open,
  onOpenChange,
  equipmentId,
  equipmentName,
}) => {
  const [formData, setFormData] = useState<CreateDamageReportData>({
    equipment_id: equipmentId,
    damage_description: '',
    estimated_repair_cost: undefined,
  });

  const createDamageReportMutation = useCreateDamageReport();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.damage_description.trim()) {
      toast.error('Please provide a description of the damage or loss');
      return;
    }

    try {
      await createDamageReportMutation.mutateAsync(formData);
      toast.success('Damage report submitted successfully');
      onOpenChange(false);
      setFormData({
        equipment_id: equipmentId,
        damage_description: '',
        estimated_repair_cost: undefined,
      });
    } catch (error) {
      toast.error('Failed to submit damage report');
      console.error('Error submitting damage report:', error);
    }
  };

  const handleInputChange = (
    field: keyof CreateDamageReportData,
    value: string | number | undefined
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-orange-500' />
            Report Equipment Issue
          </DialogTitle>
          <DialogDescription>
            Report damage or loss for equipment:{' '}
            <strong>{equipmentName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='damage_description'>Description *</Label>
            <Textarea
              id='damage_description'
              placeholder='Describe the damage or loss in detail...'
              value={formData.damage_description}
              onChange={e =>
                handleInputChange('damage_description', e.target.value)
              }
              required
              rows={4}
            />
          </div>

          <div className='space-y-2'>
            <Label
              htmlFor='estimated_repair_cost'
              className='flex items-center gap-2'
            >
              <DollarSign className='h-4 w-4' />
              Estimated Repair/Replacement Cost (Optional)
            </Label>
            <Input
              id='estimated_repair_cost'
              type='number'
              placeholder='0.00'
              value={formData.estimated_repair_cost || ''}
              onChange={e =>
                handleInputChange(
                  'estimated_repair_cost',
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              min='0'
              step='0.01'
            />
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createDamageReportMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={
                createDamageReportMutation.isPending ||
                !formData.damage_description.trim()
              }
            >
              {createDamageReportMutation.isPending
                ? 'Submitting...'
                : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
