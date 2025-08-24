import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { studentPaymentsService } from '@/services/studentPayments.service';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { cohortsService } from '@/services/cohorts.service';
import { FeeStructureService } from '@/services/feeStructure.service';
import { studentScholarshipsService } from '@/services/studentScholarships.service';
import { profileService } from '@/services/profile.service';

export const useStudentPaymentData = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [cohortData, setCohortData] = useState<any>(null);
  const [feeStructure, setFeeStructure] = useState<any>(null);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<string>('');
  const [paymentBreakdown, setPaymentBreakdown] = useState<any>(null);

  useEffect(() => {
    // Only load data when auth is ready and profile exists
    if (!authLoading && profile) {
      loadStudentData();
    }
  }, [authLoading, profile]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      // Check if profile and user_id exist
      if (!profile?.user_id) {
        toast.error('User profile not found. Please log in again.');
        navigate('/login');
        return;
      }

      // Load student profile
      const studentResult = await profileService.getByUserId(profile.user_id);
      if (!studentResult.success || !studentResult.data) {
        toast.error('Failed to load student data');
        return;
      }
      setStudentData(studentResult.data);

      // Get the student record from cohort_students table
      const cohortStudentResult = await cohortStudentsService.getByUserId(profile.user_id);
      if (!cohortStudentResult.success || !cohortStudentResult.data) {
        toast.error('Student not found in any cohort');
        return;
      }

      // Load cohort data using the cohort_id from the student record
      const cohortResult = await cohortsService.getById(cohortStudentResult.data.cohort_id);
      if (!cohortResult.success || !cohortResult.data) {
        toast.error('Failed to load cohort data');
        return;
      }
      setCohortData(cohortResult.data);

      // Load fee structure
      const feeStructureResult = await FeeStructureService.getByCohort(cohortResult.data.id);
      if (!feeStructureResult.success || !feeStructureResult.data) {
        toast.error('Failed to load fee structure');
        return;
      }
      setFeeStructure(feeStructureResult.data);

      // Load scholarships
      const scholarshipsResult = await studentScholarshipsService.getByCohort(cohortResult.data.id);
      if (scholarshipsResult.success && scholarshipsResult.data) {
        setScholarships(scholarshipsResult.data);
      }

      // Load student payments
      const paymentsResult = await studentPaymentsService.getByStudent(cohortStudentResult.data.id);
      if (paymentsResult.success && paymentsResult.data) {
        // Determine payment plan from existing payments
        const paymentPlan = determinePaymentPlan(paymentsResult.data);
        setSelectedPaymentPlan(paymentPlan);
        
        // Generate payment breakdown
        const breakdown = generatePaymentBreakdown(paymentsResult.data, feeStructureResult.data);
        setPaymentBreakdown(breakdown);
      }

    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const determinePaymentPlan = (payments: any[]): string => {
    // Logic to determine payment plan from existing payments
    // This would analyze the payment structure to determine if it's one-shot, semester-wise, or installment-wise
    return 'sem_wise'; // Default for now
  };

  const generatePaymentBreakdown = (payments: any[], feeStructure: any) => {
    // Logic to generate payment breakdown from payments and fee structure
    // This would create the semester/installment structure
    return {
      totalAmount: feeStructure.total_program_fee,
      paidAmount: payments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0),
      pendingAmount: feeStructure.total_program_fee - payments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0),
      semesters: [] // Would be populated based on payment structure
    };
  };

  return {
    loading,
    studentData,
    cohortData,
    feeStructure,
    scholarships,
    selectedPaymentPlan,
    paymentBreakdown,
    setSelectedPaymentPlan,
    reloadData: loadStudentData
  };
};
