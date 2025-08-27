import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant } from '../../utils/badgeUtils';

interface EquipmentStatusBadgeProps {
  status: string;
  className?: string;
}

export const EquipmentStatusBadge: React.FC<EquipmentStatusBadgeProps> = ({
  status,
  className,
}) => {
  return (
    <Badge variant={getStatusBadgeVariant(status)} className={className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};
