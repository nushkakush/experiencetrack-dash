import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EmptyBorrowingStateProps {
  tabType: 'all' | 'active' | 'overdue' | 'returned';
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const EmptyBorrowingState: React.FC<EmptyBorrowingStateProps> = ({
  tabType,
  onRefresh,
  isLoading = false,
}) => {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
      toast.info('Refreshing borrowing history...');
    }
  };

  const getTabConfig = () => {
    switch (tabType) {
      case 'all':
        return {
          icon: Package,
          title: 'No Borrowing Records',
          description:
            'No equipment borrowing history found. Equipment will appear here once students start borrowing items.',
          iconColor: 'text-muted-foreground',
        };
      case 'active':
        return {
          icon: Clock,
          title: 'No Active Borrowings',
          description:
            'There are currently no active equipment borrowings. All equipment has been returned.',
          iconColor: 'text-blue-500',
        };
      case 'overdue':
        return {
          icon: AlertTriangle,
          title: 'No Overdue Items',
          description:
            'Great! All borrowed equipment has been returned on time.',
          iconColor: 'text-green-500',
        };
      case 'returned':
        return {
          icon: CheckCircle,
          title: 'No Returned Items',
          description:
            'No equipment has been returned yet. Returned items will appear here.',
          iconColor: 'text-green-500',
        };
      default:
        return {
          icon: Search,
          title: 'No Results Found',
          description: 'No borrowing records match your current filters.',
          iconColor: 'text-muted-foreground',
        };
    }
  };

  const config = getTabConfig();
  const IconComponent = config.icon;

  return (
    <Card className='border-dashed'>
      <CardContent className='flex flex-col items-center justify-center py-12 px-6'>
        <div className={`mb-4 p-3 rounded-full bg-muted/50`}>
          <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
        </div>

        <h3 className='text-lg font-semibold text-center mb-2'>
          {config.title}
        </h3>

        <p className='text-sm text-muted-foreground text-center max-w-md mb-6'>
          {config.description}
        </p>

        {onRefresh && (
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={isLoading}
            className='gap-2'
          >
            <Search className='h-4 w-4' />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
