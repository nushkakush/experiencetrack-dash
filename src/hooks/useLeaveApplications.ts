import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { LeaveApplicationService } from '@/services/leaveApplicationService';
import {
  LeaveApplication,
  CreateLeaveApplicationRequest,
  UpdateLeaveApplicationRequest,
  LeaveApplicationStats,
} from '@/types/attendance';
import { useAuth } from './useAuth';

export const useLeaveApplications = (studentId?: string, cohortId?: string) => {
  const { user, profile } = useAuth();
  const [leaveApplications, setLeaveApplications] = useState<
    LeaveApplication[]
  >([]);
  const [pendingApplications, setPendingApplications] = useState<
    LeaveApplication[]
  >([]);
  const [stats, setStats] = useState<LeaveApplicationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch student's leave applications
  const fetchStudentLeaveApplications = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const applications =
        await LeaveApplicationService.getStudentLeaveApplications(studentId);
      setLeaveApplications(applications);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch leave applications'
      );
      toast.error('Failed to fetch leave applications');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  // Fetch pending leave applications (for program managers)
  const fetchPendingLeaveApplications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const applications =
        await LeaveApplicationService.getPendingLeaveApplications(cohortId);
      setPendingApplications(applications);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch pending applications'
      );
      toast.error('Failed to fetch pending applications');
    } finally {
      setLoading(false);
    }
  }, [cohortId]);

  // Fetch all leave applications (for "All Applications" tab)
  const fetchAllLeaveApplications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const applications =
        await LeaveApplicationService.getAllLeaveApplications(cohortId);
      setLeaveApplications(applications);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch all applications'
      );
      toast.error('Failed to fetch all applications');
    } finally {
      setLoading(false);
    }
  }, [cohortId]);

  // Fetch leave application statistics
  const fetchLeaveApplicationStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const statsData =
        await LeaveApplicationService.getLeaveApplicationStats(cohortId);
      setStats(statsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch statistics'
      );
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, [cohortId]);

  // Create a new leave application
  const createLeaveApplication = useCallback(
    async (data: CreateLeaveApplicationRequest) => {
      setLoading(true);
      setError(null);

      try {
        const newApplication =
          await LeaveApplicationService.createLeaveApplication(data);
        setLeaveApplications(prev => [newApplication, ...prev]);
        toast.success('Leave application submitted successfully');
        return newApplication;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to submit leave application';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update leave application status (approve/reject)
  const updateLeaveApplication = useCallback(
    async (id: string, data: UpdateLeaveApplicationRequest) => {
      if (!profile?.id) {
        toast.error('User profile not found');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const updatedApplication =
          await LeaveApplicationService.updateLeaveApplication(
            id,
            data,
            profile.id
          );

        // Update in both lists
        setLeaveApplications(prev =>
          prev.map(app => (app.id === id ? updatedApplication : app))
        );
        setPendingApplications(prev => prev.filter(app => app.id !== id));

        const action =
          data.leave_status === 'approved' ? 'approved' : 'rejected';
        toast.success(`Leave application ${action} successfully`);

        return updatedApplication;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update leave application';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [profile?.id]
  );

  // Delete leave application (only if pending)
  const deleteLeaveApplication = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await LeaveApplicationService.deleteLeaveApplication(id);
      setLeaveApplications(prev => prev.filter(app => app.id !== id));
      toast.success('Leave application deleted successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to delete leave application';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    const promises: Promise<any>[] = [];

    if (studentId) {
      promises.push(fetchStudentLeaveApplications());
    }
    if (
      profile?.role === 'program_manager' ||
      profile?.role === 'super_admin'
    ) {
      promises.push(fetchPendingLeaveApplications());
      promises.push(fetchAllLeaveApplications());
      promises.push(fetchLeaveApplicationStats());
    }

    await Promise.all(promises);
  }, [
    studentId,
    profile?.role,
    fetchStudentLeaveApplications,
    fetchPendingLeaveApplications,
    fetchAllLeaveApplications,
    fetchLeaveApplicationStats,
  ]);

  // Initial data fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    leaveApplications,
    pendingApplications,
    stats,
    loading,
    error,
    createLeaveApplication,
    updateLeaveApplication,
    deleteLeaveApplication,
    refresh,
    fetchStudentLeaveApplications,
    fetchPendingLeaveApplications,
    fetchAllLeaveApplications,
    fetchLeaveApplicationStats,
  };
};
