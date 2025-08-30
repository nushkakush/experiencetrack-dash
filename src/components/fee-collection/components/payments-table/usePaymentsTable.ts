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
    const filtered = students.filter(student => {
      // Create full name for searching (first + last name with space)
      const fullName = [student.student?.first_name, student.student?.last_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const searchLower = searchTerm.toLowerCase().trim();

      // Split search terms to handle multi-word searches
      const searchTerms = searchLower
        .split(' ')
        .filter(term => term.length > 0);

      const matchesSearch =
        student.student?.first_name?.toLowerCase().includes(searchLower) ||
        student.student?.last_name?.toLowerCase().includes(searchLower) ||
        fullName.includes(searchLower) ||
        student.student?.email?.toLowerCase().includes(searchLower) ||
        // Check if all search terms are found in either first name, last name, or full name
        (searchTerms.length > 1 &&
          searchTerms.every(
            term =>
              student.student?.first_name?.toLowerCase().includes(term) ||
              student.student?.last_name?.toLowerCase().includes(term) ||
              fullName.includes(term)
          ));

      const matchesStatus =
        statusFilter === 'all' ||
        student.payments?.some(payment => {
          // Map UI status values to database status values
          if (statusFilter === 'paid' && payment.status === 'success')
            return true;
          if (statusFilter === 'waived' && payment.status === 'waived')
            return true;
          if (
            statusFilter === 'partially_waived' &&
            payment.status === 'partially_waived'
          )
            return true;
          if (statusFilter === 'pending' && payment.status === 'pending')
            return true;
          if (
            statusFilter === 'verification_pending' &&
            payment.verification_status === 'verification_pending'
          )
            return true;
          return payment.status === statusFilter;
        });

      const matchesPlan =
        planFilter === 'all' || student.payment_plan === planFilter;

      const matchesScholarship =
        scholarshipFilter === 'all' ||
        (scholarshipFilter === 'with_scholarship' &&
          student.scholarship_name) ||
        (scholarshipFilter === 'without_scholarship' &&
          !student.scholarship_name);

      return (
        matchesSearch && matchesStatus && matchesPlan && matchesScholarship
      );
    });

    // Sort filtered students alphabetically by first name, then last name
    return filtered.sort((a, b) => {
      const aFirstName = (a.student?.first_name || '').toLowerCase();
      const bFirstName = (b.student?.first_name || '').toLowerCase();
      const aLastName = (a.student?.last_name || '').toLowerCase();
      const bLastName = (b.student?.last_name || '').toLowerCase();

      // First compare by first name
      if (aFirstName !== bFirstName) {
        return aFirstName.localeCompare(bFirstName);
      }

      // If first names are the same, compare by last name
      return aLastName.localeCompare(bLastName);
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
    setScholarshipFilter,
  };
};
