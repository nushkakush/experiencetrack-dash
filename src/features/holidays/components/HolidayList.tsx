import { format, parseISO } from 'date-fns';
import { Trash2, Edit2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import type { Holiday, SelectedHoliday } from '@/types/holiday';

interface HolidayListProps {
  title: string;
  holidays: (Holiday | SelectedHoliday)[];
  onEdit?: (holiday: Holiday | SelectedHoliday) => void;
  onDelete: (id: string) => void;
  onPublish?: (id: string) => void;
  isLoading?: boolean;
  isDraft?: boolean;
}

export const HolidayList = ({ 
  title, 
  holidays, 
  onEdit, 
  onDelete, 
  onPublish,
  isLoading = false,
  isDraft = false 
}: HolidayListProps) => {
  const { canDeleteHolidays, canEditHolidays } = useFeaturePermissions();

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (canDeleteHolidays) {
      onDelete(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (holidays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No holidays {isDraft ? 'in draft' : 'found'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {title}
          <Badge variant="secondary">{holidays.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{holiday.title}</h4>
                  {isDraft && <Badge variant="outline">Draft</Badge>}
                  {'holiday_type' in holiday && holiday.holiday_type === 'global' && (
                    <Badge variant="secondary">Global</Badge>
                  )}
                  {'holiday_type' in holiday && holiday.holiday_type === 'cohort_specific' && (
                    <Badge variant="outline">Cohort</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(holiday.date), 'EEEE, MMMM d, yyyy')}
                </p>
                {holiday.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {holiday.description}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                {onEdit && canEditHolidays && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(holiday)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                {onPublish && 'status' in holiday && holiday.status === 'draft' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPublish(holiday.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
                {canDeleteHolidays && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleDelete(holiday.id, e)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
