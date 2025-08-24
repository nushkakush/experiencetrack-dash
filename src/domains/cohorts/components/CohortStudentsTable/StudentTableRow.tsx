/**
 * Student Table Row Component
 * Extracted from large CohortStudentsTable.tsx
 */

import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Edit2, Trash2, Mail, Award, CreditCard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CohortStudent } from '@/types/cohort';
import { formatDate } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface StudentTableRowProps {
  student: CohortStudent;
  isSelected: boolean;
  onToggleSelection: (studentId: string) => void;
  onEdit?: (student: CohortStudent) => void;
  onRemove?: (studentId: string) => void;
  onManagePayments?: (student: CohortStudent) => void;
  onManageScholarships?: (student: CohortStudent) => void;
  onSendEmail?: (student: CohortStudent) => void;
  isRemoving?: boolean;
  showActions?: boolean;
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  dropped_out: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
} as const;

export const StudentTableRow: React.FC<StudentTableRowProps> = React.memo(({
  student,
  isSelected,
  onToggleSelection,
  onEdit,
  onRemove,
  onManagePayments,
  onManageScholarships,
  onSendEmail,
  isRemoving = false,
  showActions = true,
}) => {
  // The student object now contains the cohort_students data directly
  // The user_id is in the student object itself
  const studentData = student;
  
  if (!studentData) {
    return null;
  }

  // Construct the full name from first_name and last_name
  const studentName = `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim() || studentData.email;

  const handleToggleSelection = () => {
    onToggleSelection(studentData.id);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TableRow className={isSelected ? 'bg-muted/50' : ''}>
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleToggleSelection}
          aria-label={`Select ${studentName}`}
        />
      </TableCell>
      
      <TableCell className="font-medium">
        <div className="flex items-center space-x-3">

          <UserAvatar
            avatarUrl={null}
            name={studentName}
            size="md"
            userId={studentData.user_id}
          />
          <div>
            <div className="font-medium">{studentName}</div>
            <div className="text-sm text-muted-foreground">{studentData.email}</div>
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <Badge className={statusColors[student.dropped_out_status as keyof typeof statusColors] || statusColors.pending}>
          {student.dropped_out_status}
        </Badge>
      </TableCell>
      
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(student.created_at)}
      </TableCell>
      
      <TableCell className="text-sm">
        {studentData.phone || '—'}
      </TableCell>
      
      <TableCell className="text-sm">
        <div className="flex flex-col space-y-1">
          <span>Current: ₹{student.current_amount_due || 0}</span>
          <span className="text-xs text-muted-foreground">
            Total: ₹{student.total_program_fee || 0}
          </span>
        </div>
      </TableCell>
      
      {showActions && (
        <TableCell className="w-12">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={isRemoving}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(student)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Student
                </DropdownMenuItem>
              )}
              
              {onSendEmail && (
                <DropdownMenuItem onClick={() => onSendEmail(student)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {onManagePayments && (
                <DropdownMenuItem onClick={() => onManagePayments(student)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment Plan
                </DropdownMenuItem>
              )}
              
              {onManageScholarships && (
                <DropdownMenuItem onClick={() => onManageScholarships(student)}>
                  <Award className="mr-2 h-4 w-4" />
                  Scholarships
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {onRemove && (
                <DropdownMenuItem 
                  onClick={() => onRemove(studentData.id)}
                  className="text-red-600 focus:text-red-600"
                  disabled={isRemoving}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isRemoving ? 'Removing...' : 'Remove Student'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
    </TableRow>
  );
});

StudentTableRow.displayName = 'StudentTableRow';
