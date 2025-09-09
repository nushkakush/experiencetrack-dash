import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Crown,
  CheckCircle,
  Upload,
  FileText,
  Clock,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CohortFeatureGate } from '@/components/common';
import { AttendanceService } from '@/services/attendance.service';
import { toast } from 'sonner';
import type { Cohort, CohortEpic } from '@/types/attendance';
import BulkAttendanceUploadDialog from '@/components/common/bulk-upload/BulkAttendanceUploadDialog';
import { BulkAttendanceConfig } from '@/components/common/bulk-upload/types/attendance';
import { LeaveApprovalQueue } from './LeaveApprovalQueue';
import { LeaveApplicationHistory } from './LeaveApplicationHistory';
import { LeaveApprovalQueueSkeleton } from './LeaveApprovalQueueSkeleton';
import { LeaveApplicationHistorySkeleton } from './LeaveApplicationHistorySkeleton';
import { DropOutRadarDialog } from './DropOutRadarDialog';
import { useLeaveApplications } from '@/hooks/useLeaveApplications';
import { UpdateLeaveApplicationRequest } from '@/types/attendance';

interface AttendanceHeaderProps {
  cohort: Cohort | null;
  epics: CohortEpic[];
  selectedEpic: string;
  onEpicChange: (epicId: string) => void;
  onMarkHolidays: () => void;
  onEpicActiveChanged?: () => void; // Callback to refresh data when active epic changes
  onAttendanceImported?: () => void; // Callback when bulk attendance is imported
  onAttendanceDataChanged?: () => void; // Callback to refresh attendance data when leave applications are approved/rejected
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  cohort,
  epics,
  selectedEpic,
  onEpicChange,
  onMarkHolidays,
  onEpicActiveChanged,
  onAttendanceImported,
  onAttendanceDataChanged,
}) => {
  const navigate = useNavigate();
  const [settingActiveEpic, setSettingActiveEpic] = useState(false);
  const [leaveManagementOpen, setLeaveManagementOpen] = useState(false);
  const [dropOutRadarOpen, setDropOutRadarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [modalLoading, setModalLoading] = useState(false);
  const [hasLeaveActions, setHasLeaveActions] = useState(false);

  // Leave applications hook - using cohort ID for program manager view
  const {
    leaveApplications,
    pendingApplications,
    loading: leaveLoading,
    updateLeaveApplication,
    refresh: refreshLeaveApplications,
    fetchPendingLeaveApplications,
    fetchAllLeaveApplications,
  } = useLeaveApplications('', cohort?.id || '');

  // Reload data when modal opens
  useEffect(() => {
    if (leaveManagementOpen) {
      setModalLoading(true);
      setHasLeaveActions(false); // Reset the flag when modal opens
      refreshLeaveApplications()
        .then(() => {
          setModalLoading(false);
        })
        .catch(() => {
          setModalLoading(false);
        });
    }
  }, [leaveManagementOpen, refreshLeaveApplications]);

  // Reload data when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setModalLoading(true);

    if (value === 'pending') {
      fetchPendingLeaveApplications()
        .then(() => {
          setModalLoading(false);
        })
        .catch(() => {
          setModalLoading(false);
        });
    } else if (value === 'all') {
      fetchAllLeaveApplications()
        .then(() => {
          setModalLoading(false);
        })
        .catch(() => {
          setModalLoading(false);
        });
    }
  };

  // Handle leave application approval
  const handleApproveLeave = async (
    id: string,
    data: UpdateLeaveApplicationRequest
  ) => {
    try {
      await updateLeaveApplication(id, data);
      toast.success('Leave application approved successfully');
      refreshLeaveApplications();
      // Refresh attendance data to show the updated "informed absent" status
      onAttendanceDataChanged?.();
      setHasLeaveActions(true);
    } catch (error) {
      console.error('Error approving leave application:', error);
      toast.error('Failed to approve leave application');
    }
  };

  // Handle leave application rejection
  const handleRejectLeave = async (
    id: string,
    data: UpdateLeaveApplicationRequest
  ) => {
    try {
      await updateLeaveApplication(id, data);
      toast.success('Leave application rejected successfully');
      refreshLeaveApplications();
      // Refresh attendance data to reflect any changes
      onAttendanceDataChanged?.();
      setHasLeaveActions(true);
    } catch (error) {
      console.error('Error rejecting leave application:', error);
      toast.error('Failed to reject leave application');
    }
  };

  const handleSetActiveEpic = async (epicId: string) => {
    if (!cohort) return;

    setSettingActiveEpic(true);
    try {
      await AttendanceService.setEpicActive(epicId);
      toast.success('Active epic updated successfully');
      onEpicActiveChanged?.(); // Refresh data to reflect the change
    } catch (error) {
      console.error('Error setting active epic:', error);
      toast.error('Failed to update active epic');
    } finally {
      setSettingActiveEpic(false);
    }
  };

  return (
    <>
      {/* Back Button */}
      <Button
        variant='outline'
        size='sm'
        onClick={() => navigate('/cohorts')}
        className='flex items-center gap-2'
      >
        <ArrowLeft className='h-4 w-4' />
        Back to Cohorts
      </Button>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>{cohort?.name} Attendance</h1>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            onClick={() => setDropOutRadarOpen(true)}
            className='flex items-center gap-2'
            disabled={!cohort || !selectedEpic}
          >
            <AlertTriangle className='h-4 w-4' />
            Drop Out Radar
          </Button>

          <Button
            variant='outline'
            onClick={onMarkHolidays}
            className='flex items-center gap-2'
          >
            <CalendarIcon className='h-4 w-4' />
            Mark Holidays
          </Button>

          <Button
            variant='outline'
            onClick={() => setLeaveManagementOpen(true)}
            className='flex items-center gap-2'
            disabled={modalLoading}
          >
            <FileText className='h-4 w-4' />
            Leave Management
            {modalLoading && <Loader2 className='h-4 w-4 animate-spin' />}
          </Button>

          {/* Epic-level Bulk Attendance Import - Hidden for now */}
          {/* {cohort && selectedEpic && (
            <BulkAttendanceUploadDialog
              config={{
                cohortId: cohort.id,
                epicId: selectedEpic,
                startDate: cohort.start_date,
                endDate: cohort.end_date,
                sessionsPerDay: cohort.sessions_per_day
              }}
              onSuccess={onAttendanceImported}
            >
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Bulk Import Epic
              </Button>
            </BulkAttendanceUploadDialog>
          )} */}
          <div className='flex items-center gap-2'>
            <Select value={selectedEpic} onValueChange={onEpicChange}>
              <SelectTrigger className='w-[250px]'>
                <SelectValue placeholder='Select epic' />
              </SelectTrigger>
              <SelectContent>
                {epics.map(epic => (
                  <SelectItem key={epic.id} value={epic.id}>
                    {epic.epic?.name || epic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <CohortFeatureGate action='set_active_epic'>
              {(() => {
                const selectedEpicData = epics.find(
                  epic => epic.id === selectedEpic
                );
                const isCurrentlyActive = selectedEpicData?.is_active;

                return (
                  <Button
                    variant={isCurrentlyActive ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => handleSetActiveEpic(selectedEpic)}
                    disabled={
                      settingActiveEpic || !selectedEpic || isCurrentlyActive
                    }
                    className={`flex items-center gap-2 ${
                      isCurrentlyActive
                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                        : ''
                    }`}
                  >
                    <Crown className='h-4 w-4' />
                    {settingActiveEpic
                      ? 'Setting...'
                      : isCurrentlyActive
                        ? 'Active'
                        : 'Set Active'}
                  </Button>
                );
              })()}
            </CohortFeatureGate>
          </div>
        </div>
      </div>

      {/* Leave Management Modal */}
      <Dialog
        open={leaveManagementOpen}
        onOpenChange={open => {
          setLeaveManagementOpen(open);
          // Refresh attendance data when modal is closed if there were any leave actions
          if (!open && hasLeaveActions) {
            onAttendanceDataChanged?.();
            setHasLeaveActions(false); // Reset the flag
          }
        }}
      >
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Leave Management</DialogTitle>
            <DialogDescription>
              Review and manage student leave applications for this cohort
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className='space-y-4'
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger
                value='pending'
                className='flex items-center gap-2'
                disabled={modalLoading}
              >
                <Clock className='h-4 w-4' />
                Pending Review
                {pendingApplications && pendingApplications.length > 0 && (
                  <Badge variant='secondary' className='ml-1'>
                    {pendingApplications.length}
                  </Badge>
                )}
                {modalLoading && activeTab === 'pending' && (
                  <Loader2 className='h-4 w-4 animate-spin' />
                )}
              </TabsTrigger>
              <TabsTrigger
                value='all'
                className='flex items-center gap-2'
                disabled={modalLoading}
              >
                <FileText className='h-4 w-4' />
                All Applications
                {modalLoading && activeTab === 'all' && (
                  <Loader2 className='h-4 w-4 animate-spin' />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value='pending' className='space-y-4'>
              {modalLoading ? (
                <LeaveApprovalQueueSkeleton />
              ) : (
                <LeaveApprovalQueue
                  applications={pendingApplications || []}
                  onApprove={handleApproveLeave}
                  onReject={handleRejectLeave}
                  loading={leaveLoading}
                />
              )}
            </TabsContent>

            <TabsContent value='all' className='space-y-4'>
              {modalLoading ? (
                <LeaveApplicationHistorySkeleton />
              ) : (
                <LeaveApplicationHistory
                  applications={leaveApplications || []}
                  loading={leaveLoading}
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Drop Out Radar Dialog */}
      {cohort && selectedEpic && (
        <DropOutRadarDialog
          open={dropOutRadarOpen}
          onOpenChange={setDropOutRadarOpen}
          cohortId={cohort.id}
          epicId={selectedEpic}
          cohortName={cohort.name}
          epicName={epics.find(epic => epic.id === selectedEpic)?.name}
        />
      )}
    </>
  );
};
