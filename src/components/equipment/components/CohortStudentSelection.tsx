import React, { useState, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Search, User } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useCohorts } from '@/hooks/useCohorts';
import { useStudents } from '@/hooks/useStudents';
import { useBlacklistedStudents } from '@/hooks/equipment/useEquipment';
import { IssuanceFormData } from '../schemas/issuanceFormSchema';

interface CohortStudentSelectionProps {
  form: UseFormReturn<IssuanceFormData>;
}

export const CohortStudentSelection: React.FC<CohortStudentSelectionProps> = ({
  form,
}) => {
  const {
    cohorts,
    isLoading: cohortsLoading,
    error: cohortsError,
  } = useCohorts();
  const { data: students } = useStudents(form.watch('cohort_id'));
  const { data: blacklistedStudents = [] } = useBlacklistedStudents();
  const [searchTerm, setSearchTerm] = useState('');

  // Get blacklisted student IDs
  const blacklistedStudentIds = useMemo(() => {
    return blacklistedStudents.map(blacklist => blacklist.student_id);
  }, [blacklistedStudents]);

  // Filter students based on search term and exclude blacklisted students
  const filteredStudents = useMemo(() => {
    if (!students) return [];

    // First filter out blacklisted students
    const availableStudents = students.filter(
      student => !blacklistedStudentIds.includes(student.id)
    );

    // Then filter by search term
    if (!searchTerm.trim()) return availableStudents;

    return availableStudents.filter(
      student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm, blacklistedStudentIds]);

  const selectedStudent = students?.find(
    s => s.id === form.watch('student_id')
  );

  // Helper function to generate initials safely
  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className='space-y-6'>
      {/* Cohort Selection */}
      <FormField
        control={form.control}
        name='cohort_id'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cohort *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder='Select a cohort' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {cohortsLoading ? (
                  <SelectItem value='loading' disabled>
                    Loading cohorts...
                  </SelectItem>
                ) : cohortsError ? (
                  <SelectItem value='error' disabled>
                    Error loading cohorts
                  </SelectItem>
                ) : (
                  cohorts?.map(cohort => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Student Selection */}
      {form.watch('cohort_id') && (
        <FormField
          control={form.control}
          name='student_id'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student *</FormLabel>

              {/* Search Input */}
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                <Input
                  placeholder='Search students...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>

              {/* Students List */}
              <ScrollArea className='h-64 border rounded-md p-2'>
                {filteredStudents.length === 0 ? (
                  <div className='flex items-center justify-center h-full text-muted-foreground'>
                    {searchTerm
                      ? 'No students found'
                      : 'No students in this cohort'}
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {filteredStudents.map(student => (
                      <Button
                        key={student.id}
                        type='button'
                        variant={
                          field.value === student.id ? 'default' : 'ghost'
                        }
                        className='w-full justify-start h-auto p-3'
                        onClick={() => field.onChange(student.id)}
                      >
                        <div className='flex items-center space-x-3 w-full'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage
                              src={student.avatar_url}
                              alt={student.name || 'Student'}
                            />
                            <AvatarFallback>
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex flex-col items-start text-left'>
                            <span className='font-medium'>
                              {student.name || 'Unknown Student'}
                            </span>
                            <span className='text-sm text-muted-foreground'>
                              {student.email || 'No email'}
                            </span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Blacklisted Students Section */}
              {(() => {
                const blacklistedInCohort =
                  students?.filter(
                    student =>
                      blacklistedStudentIds.includes(student.id) &&
                      (searchTerm.trim() === '' ||
                        student.name
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        student.email
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()))
                  ) || [];

                if (blacklistedInCohort.length > 0) {
                  return (
                    <div className='mt-4'>
                      <div className='text-sm font-medium text-muted-foreground mb-2'>
                        Blacklisted Students (Not Available)
                      </div>
                      <div className='space-y-2'>
                        {blacklistedInCohort.map(student => {
                          const blacklistInfo = blacklistedStudents.find(
                            b => b.student_id === student.id
                          );
                          return (
                            <div
                              key={student.id}
                              className='flex items-center space-x-3 w-full p-3 border rounded-md bg-muted/50 opacity-60'
                            >
                              <Avatar className='h-8 w-8'>
                                <AvatarImage
                                  src={student.avatar_url}
                                  alt={student.name || 'Student'}
                                />
                                <AvatarFallback>
                                  {getInitials(student.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className='flex flex-col items-start text-left flex-1'>
                                <div className='flex items-center gap-2'>
                                  <span className='font-medium'>
                                    {student.name || 'Unknown Student'}
                                  </span>
                                  <Badge
                                    variant='destructive'
                                    className='text-xs'
                                  >
                                    Blacklisted
                                  </Badge>
                                </div>
                                <span className='text-sm text-muted-foreground'>
                                  {student.email || 'No email'}
                                </span>
                                {blacklistInfo?.reason && (
                                  <span className='text-xs text-muted-foreground'>
                                    Reason: {blacklistInfo.reason}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};
