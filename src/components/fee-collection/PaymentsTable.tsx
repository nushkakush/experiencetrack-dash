import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { StudentPaymentSummary, PaymentType, PaymentPlan } from '@/types/fee';
import { Eye, Mail, Search, Filter } from 'lucide-react';

interface PaymentsTableProps {
  students: StudentPaymentSummary[];
  onStudentSelect: (student: StudentPaymentSummary) => void;
  selectedStudent?: StudentPaymentSummary;
}

export const PaymentsTable: React.FC<PaymentsTableProps> = ({
  students,
  onStudentSelect,
  selectedStudent
}) => {
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

  const getPaymentProgress = (student: StudentPaymentSummary) => {
    if (student.total_amount === 0) return 0;
    return Math.round((student.paid_amount / student.total_amount) * 100);
  };

  const getNextDuePayment = (student: StudentPaymentSummary) => {
    const pendingPayments = student.payments?.filter(p => 
      p.status === 'pending' || p.status === 'overdue' || p.status === 'partially_paid_overdue'
    );
    
    if (!pendingPayments || pendingPayments.length === 0) return null;
    
    return pendingPayments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPaymentTypeDisplay = (paymentType: PaymentType) => {
    switch (paymentType) {
      case 'admission_fee':
        return 'Admission Fee';
      case 'instalments':
        return 'Instalments';
      case 'one_shot':
        return 'One-Shot';
      case 'sem_plan':
        return 'Sem Plan';
      default:
        return paymentType;
    }
  };

  const getPlanDisplay = (plan: PaymentPlan) => {
    switch (plan) {
      case 'one_shot':
        return 'One-Shot';
      case 'sem_wise':
        return 'Semester-wise';
      case 'instalment_wise':
        return 'Installment-wise';
      default:
        return plan;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Payment Breakdown Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payments</h2>
        <Button className="bg-green-600 hover:bg-green-700">
          Payment Breakdown
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="verification_pending">Verification Pending</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="dropped">Dropped</SelectItem>
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="one_shot">One-Shot</SelectItem>
            <SelectItem value="sem_wise">Semester-wise</SelectItem>
            <SelectItem value="instalment_wise">Installment-wise</SelectItem>
          </SelectContent>
        </Select>

        <Select value={scholarshipFilter} onValueChange={setScholarshipFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Scholarships" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scholarships</SelectItem>
            <SelectItem value="with_scholarship">With Scholarship</SelectItem>
            <SelectItem value="without_scholarship">Without Scholarship</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => {
              const nextDue = getNextDuePayment(student);
              const progress = getPaymentProgress(student);
              
              return (
                <TableRow 
                  key={student.student_id}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    selectedStudent?.student_id === student.student_id ? 'bg-muted' : ''
                  }`}
                  onClick={() => onStudentSelect(student)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {student.student?.first_name} {student.student?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {student.student?.email}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {getPlanDisplay(student.payment_plan)}
                      </div>
                      {student.scholarship_name && (
                        <div className="text-sm text-blue-600">
                          {student.scholarship_name} ({student.scholarship_percentage}%)
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="w-32">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{progress}%</span>
                        <span>{formatCurrency(student.paid_amount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {nextDue ? (
                      <div>
                        <div className="font-medium">
                          {getPaymentTypeDisplay(nextDue.payment_type)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(nextDue.due_date)}
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(nextDue.amount_payable)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No pending payments</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      {student.payments?.map((payment) => (
                        <div key={payment.id} className="flex items-center gap-2">
                          <PaymentStatusBadge status={payment.status} />
                          <span className="text-xs text-muted-foreground">
                            {getPaymentTypeDisplay(payment.payment_type)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStudentSelect(student);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement send communication
                        }}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No students found matching the criteria</p>
        </div>
      )}
    </div>
  );
};
