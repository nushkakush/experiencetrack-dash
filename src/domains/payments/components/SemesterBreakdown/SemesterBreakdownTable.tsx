/**
 * Refactored Semester Breakdown Table
 * Replaces the monolithic 601-line SemesterBreakdown.tsx
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, FileText, Download } from 'lucide-react';
import { SemesterCard } from './SemesterCard';
import { SemesterSummary } from './SemesterSummary';
import { SemesterFilters } from './SemesterFilters';
import { formatCurrency } from '@/lib/utils';

export interface SemesterData {
  id: string;
  number: number;
  name: string;
  startDate: string;
  endDate: string;
  totalFee: number;
  paidAmount: number;
  remainingAmount: number;
  installments: InstallmentData[];
  status: 'upcoming' | 'current' | 'completed' | 'overdue';
}

export interface InstallmentData {
  id: string;
  number: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paidAmount?: number;
}

interface SemesterBreakdownTableProps {
  studentId: string;
  semesters: SemesterData[];
  onPayInstallment?: (installmentId: string) => void;
  onViewDetails?: (semesterId: string) => void;
  onExportBreakdown?: () => void;
  loading?: boolean;
}

export const SemesterBreakdownTable: React.FC<SemesterBreakdownTableProps> = React.memo(({
  studentId,
  semesters,
  onPayInstallment,
  onViewDetails,
  onExportBreakdown,
  loading = false,
}) => {
  const [filters, setFilters] = React.useState({
    status: 'all',
    semester: 'all',
  });

  // Filter semesters based on current filters
  const filteredSemesters = React.useMemo(() => {
    return semesters.filter(semester => {
      if (filters.status !== 'all' && semester.status !== filters.status) return false;
      if (filters.semester !== 'all' && semester.id !== filters.semester) return false;
      return true;
    });
  }, [semesters, filters]);

  // Calculate overall summary
  const summary = React.useMemo(() => {
    const totals = semesters.reduce((acc, semester) => {
      acc.totalFee += semester.totalFee;
      acc.paidAmount += semester.paidAmount;
      acc.remainingAmount += semester.remainingAmount;
      return acc;
    }, { totalFee: 0, paidAmount: 0, remainingAmount: 0 });

    const completionPercentage = totals.totalFee > 0 
      ? Math.round((totals.paidAmount / totals.totalFee) * 100) 
      : 0;

    return {
      ...totals,
      completionPercentage,
      totalSemesters: semesters.length,
      completedSemesters: semesters.filter(s => s.status === 'completed').length,
      currentSemester: semesters.find(s => s.status === 'current'),
    };
  }, [semesters]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading semester breakdown...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (semesters.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">
            No semester data available for this student
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <SemesterSummary summary={summary} />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Semester Breakdown</span>
              <Badge variant="secondary">{filteredSemesters.length} semesters</Badge>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {onExportBreakdown && (
                <Button variant="outline" size="sm" onClick={onExportBreakdown}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <SemesterFilters
            filters={filters}
            onFiltersChange={setFilters}
            semesters={semesters}
          />
        </CardHeader>

        <CardContent>
          {filteredSemesters.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                No semesters match the current filters
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSemesters.map((semester) => (
                <SemesterCard
                  key={semester.id}
                  semester={semester}
                  onPayInstallment={onPayInstallment}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

SemesterBreakdownTable.displayName = 'SemesterBreakdownTable';
