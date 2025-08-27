import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CalendarIcon,
  User,
  AlertTriangle,
  Clock,
  X,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { useCohorts } from '@/hooks/useCohorts';
import {
  useBlacklistedStudents,
  useBlacklistStudent,
  useRemoveFromBlacklist,
  useCohortStudents,
} from '@/hooks/equipment/useEquipment';
import { useEquipmentPermissions } from '@/hooks/equipment/useEquipmentPermissions';
import { CreateBlacklistData, EquipmentBlacklist } from '@/types/equipment';
import { CohortStudent } from '@/types/cohort';
import { toast } from 'sonner';

interface BlacklistStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlacklistStudentDialog({
  open,
  onOpenChange,
}: BlacklistStudentDialogProps) {
  const [selectedCohort, setSelectedCohort] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [viewMode, setViewMode] = useState<'blacklist' | 'view'>('blacklist');
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);

  const { cohorts } = useCohorts();
  const { data: blacklistedStudents = [], isLoading: blacklistLoading } =
    useBlacklistedStudents();
  const { data: cohortStudents = [], isLoading: cohortStudentsLoading } =
    useCohortStudents(selectedCohort);
  const blacklistStudentMutation = useBlacklistStudent();
  const removeFromBlacklistMutation = useRemoveFromBlacklist();
  const { canManageBlacklist } = useEquipmentPermissions();

  const handleBlacklistStudent = async () => {
    if (!selectedStudent || !reason.trim()) {
      toast.error('Please select a student and provide a reason');
      return;
    }

    const blacklistData: CreateBlacklistData = {
      student_id: selectedStudent,
      reason: reason.trim(),
      expires_at: expiresAt || undefined,
    };

    try {
      await blacklistStudentMutation.mutateAsync(blacklistData);
      // Reset form
      setSelectedCohort('');
      setSelectedStudent('');
      setSelectedStudentName('');
      setReason('');
      setExpiresAt('');
      toast.success('Student blacklisted successfully');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleRemoveFromBlacklist = async (blacklistId: string) => {
    try {
      await removeFromBlacklistMutation.mutateAsync(blacklistId);
      toast.success('Student removed from blacklist');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form when closing
    setSelectedCohort('');
    setSelectedStudent('');
    setSelectedStudentName('');
    setReason('');
    setExpiresAt('');
    setViewMode('blacklist');
    setStudentSearchOpen(false);
  };

  const isBlacklistFormValid = selectedStudent && reason.trim();

  // If user doesn't have permission, don't render the dialog
  if (!canManageBlacklist) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-destructive' />
            Equipment Blacklist Management
          </DialogTitle>
        </DialogHeader>

        <div className='flex gap-4 mb-4'>
          <Button
            variant={viewMode === 'blacklist' ? 'default' : 'outline'}
            onClick={() => setViewMode('blacklist')}
            className='flex-1'
          >
            Blacklist Student
          </Button>
          <Button
            variant={viewMode === 'view' ? 'default' : 'outline'}
            onClick={() => setViewMode('view')}
            className='flex-1'
          >
            View Blacklisted Students ({blacklistedStudents.length})
          </Button>
        </div>

        {viewMode === 'blacklist' ? (
          <div className='space-y-6'>
            {/* Cohort Selection */}
            <div className='space-y-2'>
              <Label htmlFor='cohort'>Select Cohort</Label>
              <Select value={selectedCohort} onValueChange={setSelectedCohort}>
                <SelectTrigger>
                  <SelectValue placeholder='Choose a cohort' />
                </SelectTrigger>
                <SelectContent>
                  {cohorts?.map(cohort => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Selection */}
            {selectedCohort && (
              <div className='space-y-2'>
                <Label htmlFor='student'>Select Student</Label>
                {cohortStudentsLoading ? (
                  <div className='text-sm text-muted-foreground'>
                    Loading students...
                  </div>
                ) : cohortStudents.length === 0 ? (
                  <div className='text-sm text-muted-foreground'>
                    No students found in this cohort
                  </div>
                ) : (
                  <Popover
                    open={studentSearchOpen}
                    onOpenChange={setStudentSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        role='combobox'
                        aria-expanded={studentSearchOpen}
                        className='w-full justify-between'
                      >
                        {selectedStudentName || 'Search for a student...'}
                        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-full p-0' align='start'>
                      <Command>
                        <CommandInput placeholder='Search students...' />
                        <CommandList>
                          <CommandEmpty>No student found.</CommandEmpty>
                          <CommandGroup>
                            {cohortStudents.map(student => {
                              const studentName =
                                student.first_name && student.last_name
                                  ? `${student.first_name} ${student.last_name}`
                                  : student.email;
                              return (
                                <CommandItem
                                  key={student.id}
                                  value={studentName}
                                  onSelect={() => {
                                    setSelectedStudent(student.id);
                                    setSelectedStudentName(studentName);
                                    setStudentSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedStudent === student.id
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    }`}
                                  />
                                  <User className='mr-2 h-4 w-4' />
                                  {studentName}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}

            {/* Reason */}
            <div className='space-y-2'>
              <Label htmlFor='reason'>Reason for Blacklisting *</Label>
              <Textarea
                id='reason'
                placeholder='Enter the reason for blacklisting this student...'
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Expiration Date (Optional) */}
            <div className='space-y-2'>
              <Label htmlFor='expires-at'>Expiration Date (Optional)</Label>
              <Input
                id='expires-at'
                type='datetime-local'
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
              />
              <p className='text-sm text-muted-foreground'>
                Leave empty for permanent blacklist
              </p>
            </div>

            <DialogFooter>
              <Button variant='outline' onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleBlacklistStudent}
                disabled={
                  !isBlacklistFormValid || blacklistStudentMutation.isPending
                }
              >
                {blacklistStudentMutation.isPending
                  ? 'Blacklisting...'
                  : 'Blacklist Student'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className='space-y-4'>
            {blacklistLoading ? (
              <div className='text-center py-8'>
                Loading blacklisted students...
              </div>
            ) : blacklistedStudents.length === 0 ? (
              <Card>
                <CardContent className='text-center py-8'>
                  <AlertTriangle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                  <h3 className='text-lg font-semibold mb-2'>
                    No Blacklisted Students
                  </h3>
                  <p className='text-muted-foreground'>
                    There are currently no students on the equipment blacklist.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Cohort</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Blacklisted By</TableHead>
                    <TableHead>Blacklisted At</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blacklistedStudents.map((blacklist: EquipmentBlacklist) => (
                    <TableRow key={blacklist.id}>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <User className='h-4 w-4 text-muted-foreground' />
                          <span>
                            {blacklist.student?.first_name &&
                            blacklist.student?.last_name
                              ? `${blacklist.student.first_name} ${blacklist.student.last_name}`
                              : blacklist.student?.email || 'Unknown Student'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className='font-medium'>
                          {blacklist.student?.cohort?.name || 'Unknown Cohort'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div
                          className='max-w-xs truncate'
                          title={blacklist.reason}
                        >
                          {blacklist.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        {blacklist.blacklisted_by_user?.first_name &&
                        blacklist.blacklisted_by_user?.last_name
                          ? `${blacklist.blacklisted_by_user.first_name} ${blacklist.blacklisted_by_user.last_name}`
                          : blacklist.blacklisted_by_user?.email || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <CalendarIcon className='h-4 w-4 text-muted-foreground' />
                          {format(
                            new Date(blacklist.blacklisted_at),
                            'MMM dd, yyyy HH:mm'
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {blacklist.expires_at ? (
                          <div className='flex items-center gap-2'>
                            <Clock className='h-4 w-4 text-muted-foreground' />
                            {format(
                              new Date(blacklist.expires_at),
                              'MMM dd, yyyy HH:mm'
                            )}
                          </div>
                        ) : (
                          <span className='text-muted-foreground'>
                            Permanent
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            blacklist.is_active ? 'destructive' : 'secondary'
                          }
                        >
                          {blacklist.is_active ? 'Active' : 'Expired'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            handleRemoveFromBlacklist(blacklist.id)
                          }
                          disabled={removeFromBlacklistMutation.isPending}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
