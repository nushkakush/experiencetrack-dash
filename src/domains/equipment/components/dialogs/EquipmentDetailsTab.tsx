import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Calendar,
  User,
  MapPin,
  Tag,
  IndianRupee,
  AlertTriangle,
} from 'lucide-react';
import { Equipment } from '../../types';
import { formatDate, formatCurrency } from '@/utils/dateUtils';
import { EquipmentStatusBadge, EquipmentConditionBadge } from '../ui';

interface EquipmentDetailsTabProps {
  equipment: Equipment;
}

export const EquipmentDetailsTab: React.FC<EquipmentDetailsTabProps> = ({
  equipment,
}) => {
  return (
    <div className='space-y-6'>
      {/* Equipment Header */}
      <div className='flex items-start space-x-4'>
        {equipment.images && equipment.images.length > 0 ? (
          <img
            src={equipment.images[0]}
            alt={equipment.name}
            className='h-24 w-24 object-cover rounded-lg border'
          />
        ) : (
          <div className='h-24 w-24 bg-muted rounded-lg flex items-center justify-center'>
            <Package className='h-8 w-8 text-muted-foreground' />
          </div>
        )}

        <div className='flex-1 space-y-2'>
          <div className='flex items-center space-x-2'>
            <h3 className='text-lg font-semibold'>{equipment.name}</h3>
            <EquipmentStatusBadge status={equipment.availability_status} />
            <EquipmentConditionBadge condition={equipment.condition_status} />
          </div>

          {equipment.description && (
            <p className='text-sm text-muted-foreground'>
              {equipment.description}
            </p>
          )}

          {equipment.serial_number && (
            <p className='text-sm'>
              <span className='font-medium'>Serial Number:</span>{' '}
              {equipment.serial_number}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Equipment Information */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center space-x-2'>
              <Tag className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                <span className='font-medium'>Category:</span>{' '}
                {equipment.category?.name || 'N/A'}
              </span>
            </div>

            <div className='flex items-center space-x-2'>
              <MapPin className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                <span className='font-medium'>Location:</span>{' '}
                {equipment.location?.name || 'N/A'}
              </span>
            </div>

            <div className='flex items-center space-x-2'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                <span className='font-medium'>Purchase Date:</span>{' '}
                {equipment.purchase_date
                  ? formatDate(equipment.purchase_date)
                  : 'N/A'}
              </span>
            </div>

            <div className='flex items-center space-x-2'>
              <IndianRupee className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                <span className='font-medium'>Purchase Cost:</span>{' '}
                {equipment.purchase_cost
                  ? formatCurrency(equipment.purchase_cost)
                  : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Status Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center space-x-2'>
              <Package className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                <span className='font-medium'>Availability:</span>
              </span>
              <EquipmentStatusBadge status={equipment.availability_status} />
            </div>

            <div className='flex items-center space-x-2'>
              <AlertTriangle className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                <span className='font-medium'>Condition:</span>
              </span>
              <EquipmentConditionBadge condition={equipment.condition_status} />
            </div>

            <div className='flex items-center space-x-2'>
              <User className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                <span className='font-medium'>Created:</span>{' '}
                {formatDate(equipment.created_at)}
              </span>
            </div>

            <div className='flex items-center space-x-2'>
              <User className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                <span className='font-medium'>Updated:</span>{' '}
                {formatDate(equipment.updated_at)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Condition Notes */}
      {equipment.condition_notes && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Condition Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm'>{equipment.condition_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
