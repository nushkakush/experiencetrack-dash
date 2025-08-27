import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getConditionBadgeVariant } from '../../utils/badgeUtils';

interface EquipmentConditionBadgeProps {
  condition: string;
  className?: string;
}

export const EquipmentConditionBadge: React.FC<
  EquipmentConditionBadgeProps
> = ({ condition, className }) => {
  return (
    <Badge variant={getConditionBadgeVariant(condition)} className={className}>
      {condition.charAt(0).toUpperCase() + condition.slice(1).replace('_', ' ')}
    </Badge>
  );
};
