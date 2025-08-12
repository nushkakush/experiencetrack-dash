import { useState, useMemo } from 'react';
import { StudentPaymentSummary } from '@/types/fee';

interface UsePaymentsTableProps {
  students: StudentPaymentSummary[];
}

export const usePaymentsTable = ({ students }: UsePaymentsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [scholarshipFilter, setScholarshipFilter] = useState<string>('all');

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.student?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || 
        student.payments?.some(payment => payment.status === statusFilter);

      const matchesPlan = planFilter === 'all' || student.payment_plan === planFilter;

      const matchesScholarship = scholarshipFilter === 'all' || 
        (scholarshipFilter === 'with_scholarship' && student.scholarship_name) ||
        (scholarshipFilter === 'without_scholarship' && !student.scholarship_name);

      return matchesSearch && matchesStatus && matchesPlan && matchesScholarship;
    });
  }, [students, searchTerm, statusFilter, planFilter, scholarshipFilter]);

  return {
    searchTerm,
    statusFilter,
    planFilter,
    scholarshipFilter,
    filteredStudents,
    setSearchTerm,
    setStatusFilter,
    setPlanFilter,
    setScholarshipFilter
  };
};
