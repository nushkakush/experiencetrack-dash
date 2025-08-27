import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Copy, Package } from 'lucide-react';
import { toast } from 'sonner';
import { WithFeatureFlag } from '@/lib/feature-flags/FeatureFlagProvider';

interface EquipmentActionsProps {
  onAddEquipment: () => void;
  onIssueEquipment: () => void;
  onReportDamageLoss: () => void;
}

// Function to copy public link to clipboard
const copyPublicLink = async () => {
  const publicLink = `${window.location.origin}/public/equipment/issue`;
  try {
    await navigator.clipboard.writeText(publicLink);
    toast.success('Public link copied to clipboard!');
  } catch (error) {
    toast.error('Failed to copy link to clipboard');
  }
};

export const EquipmentActions: React.FC<EquipmentActionsProps> = ({
  onAddEquipment,
  onIssueEquipment,
  onReportDamageLoss,
}) => {
  return (
    <div className='flex items-center space-x-2'>
      <WithFeatureFlag flagId='equipment-create-super-admin-only'>
        <Button onClick={onAddEquipment}>
          <Plus className='mr-2 h-4 w-4' />
          Add Equipment
        </Button>
      </WithFeatureFlag>

      <Button variant='outline' onClick={onIssueEquipment}>
        <Package className='mr-2 h-4 w-4' />
        Issue Equipment
      </Button>

      <Button variant='outline' onClick={onReportDamageLoss}>
        <Package className='mr-2 h-4 w-4' />
        Report Damage/Loss
      </Button>

      <Button variant='outline' onClick={copyPublicLink}>
        <Copy className='mr-2 h-4 w-4' />
        Copy Public Link
      </Button>
    </div>
  );
};
