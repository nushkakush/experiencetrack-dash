import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, addDays, subDays, isToday, isAfter, parseISO } from 'date-fns';
import DashboardShell from '@/components/DashboardShell';
import { Skeleton } from '@/components/ui/skeleton';
import { AttendanceService } from '@/services/attendance.service';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type CohortStudent = Database['public']['Tables']['cohort_students']['Row'];
type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'];
type CohortEpic = Database['public']['Tables']['cohort_epics']['Row'];
type Cohort = Database['public']['Tables']['cohorts']['Row'];

interface SessionInfo {
  sessionNumber: number;
  sessionDate: string;
  isCancelled: boolean;
}

const CohortAttendancePage = () => {
  const { cohortId } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<number>(1);
  const [selectedEpic, setSelectedEpic] = useState<string>('');
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [students, setStudents] = useState<CohortStudent[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [epics, setEpics] = useState<CohortEpic[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<CohortStudent | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'absent' | 'late'>('absent');
  const [reason, setReason] = useState('');
  const [absenceType, setAbsenceType] = useState<'informed' | 'uninformed' | 'exempted'>('uninformed');

  // Load initial data
  useEffect(() => {
    if (!cohortId) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load cohort details
        const { data: cohortData, error: cohortError } = await supabase
          .from('cohorts')
          .select('*')
          .eq('id', cohortId)
          .single();
        
        if (cohortError) throw cohortError;
        setCohort(cohortData);

        // Load epics
        const epicsData = await AttendanceService.getCohortEpics(cohortId);
        setEpics(epicsData);
        
        // Set active epic as default
        const activeEpic = epicsData.find(epic => epic.is_active);
        if (activeEpic) {
          setSelectedEpic(activeEpic.id);
        } else if (epicsData.length > 0) {
          setSelectedEpic(epicsData[0].id);
        }

        // Load students
        const { data: studentsData, error: studentsError } = await supabase
          .from('cohort_students')
          .select('*')
          .eq('cohort_id', cohortId);

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);

      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [cohortId]);

  // Load sessions when epic or date changes
  useEffect(() => {
    if (!selectedEpic || !cohortId) return;
    
    const loadSessions = async () => {
      try {
        const sessionDate = format(selectedDate, 'yyyy-MM-dd');
        const sessionInfos = await AttendanceService.getSessionsForDate(cohortId!, selectedEpic, sessionDate);
        setSessions(sessionInfos);
        
        // Set first session as selected
        if (sessionInfos.length > 0) {
          setSelectedSession(sessionInfos[0].sessionNumber);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        toast.error('Failed to load sessions');
      }
    };

    loadSessions();
  }, [selectedEpic, selectedDate, cohortId]);

  // Load attendance records when session changes
  useEffect(() => {
    if (!selectedSession || !selectedEpic || !cohortId) {
      return;
    }
    
    const loadAttendance = async () => {
      try {
        const sessionDate = format(selectedDate, 'yyyy-MM-dd');
        const records = await AttendanceService.getSessionAttendance(cohortId!, selectedEpic, selectedSession, sessionDate);
        setAttendanceRecords(records);
      } catch (error) {
        console.error('Error loading attendance:', error);
        toast.error('Failed to load attendance records');
      }
    };

    loadAttendance();
  }, [selectedSession, selectedEpic, selectedDate, cohortId]);



  const handleDateChange = (date: Date) => {
    // Allow any date that is not in the future
    if (!isAfter(date, new Date())) {
      setSelectedDate(date);
    }
  };

  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (!selectedSession || !selectedEpic || !cohortId) return;

    const currentSession = sessions.find(s => s.sessionNumber === selectedSession);
    if (currentSession?.isCancelled || isAfter(selectedDate, new Date())) {
      return;
    }

    try {
      if (status === 'present') {
        const sessionDate = format(selectedDate, 'yyyy-MM-dd');
        await AttendanceService.markAttendance(cohortId, selectedEpic, selectedSession, sessionDate, studentId, status);
        toast.success('Attendance marked as present');
      } else {
        setSelectedStudent(students.find(s => s.id === studentId) || null);
        setSelectedStatus(status);
        setShowReasonDialog(true);
        return;
      }
      
      // Reload attendance records
      const sessionDate = format(selectedDate, 'yyyy-MM-dd');
      const records = await AttendanceService.getSessionAttendance(cohortId, selectedEpic, selectedSession, sessionDate);
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const handleConfirmReason = async () => {
    if (!selectedStudent || !selectedSession || !selectedEpic || !cohortId) return;

    try {
      // For uninformed absence, no reason is required
      const finalReason = absenceType === 'uninformed' ? undefined : reason;
      const sessionDate = format(selectedDate, 'yyyy-MM-dd');
      
      await AttendanceService.markAttendance(
        cohortId,
        selectedEpic,
        selectedSession,
        sessionDate,
        selectedStudent.id,
        selectedStatus,
        absenceType,
        finalReason
      );
      
      toast.success(`Attendance marked as ${selectedStatus}`);
      setShowReasonDialog(false);
      setReason('');
      setSelectedStudent(null);
      setAbsenceType('uninformed'); // Reset to default
      
      // Reload attendance records
      const records = await AttendanceService.getSessionAttendance(cohortId, selectedEpic, selectedSession, sessionDate);
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const handleCancelSession = async () => {
    if (!selectedSession || !selectedEpic || !cohortId) return;

    try {
      const sessionDate = format(selectedDate, 'yyyy-MM-dd');
      await AttendanceService.toggleSessionCancellation(cohortId, selectedEpic, selectedSession, sessionDate, true);
      toast.success('Session cancelled');
      
      // Reload sessions
      const sessionInfos = await AttendanceService.getSessionsForDate(cohortId, selectedEpic, sessionDate);
      setSessions(sessionInfos);
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
    }
  };

  const handleReactivateSession = async () => {
    if (!selectedSession || !selectedEpic || !cohortId) return;

    try {
      const sessionDate = format(selectedDate, 'yyyy-MM-dd');
      await AttendanceService.toggleSessionCancellation(cohortId, selectedEpic, selectedSession, sessionDate, false);
      toast.success('Session reactivated');
      
      // Reload sessions
      const sessionInfos = await AttendanceService.getSessionsForDate(cohortId, selectedEpic, sessionDate);
      setSessions(sessionInfos);
    } catch (error) {
      console.error('Error reactivating session:', error);
      toast.error('Failed to reactivate session');
    }
  };

  const handleEpicChange = async (epicId: string) => {
    try {
      setSelectedEpic(epicId);
      await AttendanceService.setEpicActive(epicId);
      
      // Update epics list to reflect active status
      const updatedEpics = epics.map(epic => ({
        ...epic,
        is_active: epic.id === epicId
      }));
      setEpics(updatedEpics);
      
      // Clear attendance records when switching epics
      setAttendanceRecords([]);
      
      toast.success('Epic switched successfully');
    } catch (error) {
      console.error('Error switching epic:', error);
      toast.error('Failed to switch epic');
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    const record = attendanceRecords.find(r => r.student_id === studentId);
    return record?.status || null;
  };

  const getButtonVariant = (studentId: string, status: 'present' | 'absent' | 'late') => {
    const currentStatus = getAttendanceStatus(studentId);
    return currentStatus === status ? 'default' : 'outline';
  };

  const getButtonClassName = (studentId: string, status: 'present' | 'absent' | 'late') => {
    const currentStatus = getAttendanceStatus(studentId);
    
    if (currentStatus === status) {
      switch (status) {
        case 'present': return "min-w-[80px] bg-green-600 hover:bg-green-700 text-white border-green-600";
        case 'absent': return "min-w-[80px] bg-red-600 hover:bg-red-700 text-white border-red-600";
        case 'late': return "min-w-[80px] bg-orange-600 hover:bg-orange-700 text-white border-orange-600";
      }
    }
    return "min-w-[80px]";
  };

  const currentEpic = epics.find(e => e.id === selectedEpic);
  const currentSession = sessions.find(s => s.sessionNumber === selectedSession);
  const isSessionCancelled = currentSession?.isCancelled || false;
  const isFutureDate = isAfter(selectedDate, new Date());

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/cohorts')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cohorts
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {cohort?.name} Attendance
          </h1>
          <Select value={selectedEpic} onValueChange={handleEpicChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select epic" />
            </SelectTrigger>
            <SelectContent>
              {epics.map(epic => (
                <SelectItem key={epic.id} value={epic.id}>
                  <span>{epic.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Session Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Session Management</CardTitle>
                <CardDescription>
                  {currentEpic?.name} - {format(selectedDate, 'MMM d, yyyy')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                {/* Date Navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateChange(subDays(selectedDate, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedDate, 'MMM d, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && handleDateChange(date)}
                        disabled={(date) => isAfter(date, new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateChange(addDays(selectedDate, 1))}
                    disabled={isFutureDate}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Session Control Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    console.log('Cancel session button clicked');
                    handleCancelSession();
                  }}
                >
                  Cancel Session
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedSession.toString()} onValueChange={(value) => setSelectedSession(parseInt(value))}>
              <TabsList className="grid w-full grid-cols-2">
                {sessions.map(session => (
                  <TabsTrigger key={session.sessionNumber} value={session.sessionNumber.toString()}>
                    Session {session.sessionNumber} {session.isCancelled && '(Cancelled)'}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>





        {/* Attendance Table */}
        <Card>
          <CardContent className="pt-6">
            {students.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No students found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(student => {
                    const attendanceStatus = getAttendanceStatus(student.id);
                    return (
                      <TableRow key={`${student.id}-${attendanceStatus}`}>
                        <TableCell className="font-medium">
                          {student.first_name} {student.last_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{student.email}</TableCell>
                        <TableCell>
                                                           <div className="flex gap-1 justify-center">
                                   <Button
                                     size="sm"
                                     variant={getButtonVariant(student.id, 'present')}
                                     className={getButtonClassName(student.id, 'present')}
                                     onClick={() => {
                                       console.log('Present button clicked for student:', student.id);
                                       handleMarkAttendance(student.id, 'present');
                                     }}
                                     disabled={isSessionCancelled || isFutureDate}
                                   >
                                     Present
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant={getButtonVariant(student.id, 'absent')}
                                     className={getButtonClassName(student.id, 'absent')}
                                     onClick={() => {
                                       console.log('Absent button clicked for student:', student.id);
                                       handleMarkAttendance(student.id, 'absent');
                                     }}
                                     disabled={isSessionCancelled || isFutureDate}
                                   >
                                     Absent
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant={getButtonVariant(student.id, 'late')}
                                     className={getButtonClassName(student.id, 'late')}
                                     onClick={() => {
                                       console.log('Late button clicked for student:', student.id);
                                       handleMarkAttendance(student.id, 'late');
                                     }}
                                     disabled={isSessionCancelled || isFutureDate}
                                   >
                                     Late
                                   </Button>
                                 </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Reason Dialog */}
        <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Mark {selectedStudent?.first_name} {selectedStudent?.last_name} as {selectedStatus}
              </DialogTitle>
              <DialogDescription>
                Please provide additional details for this {selectedStatus} status.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={absenceType} onValueChange={(value: any) => setAbsenceType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="informed">Informed</SelectItem>
                    <SelectItem value="uninformed">Uninformed</SelectItem>
                    {selectedStatus === 'absent' && (
                      <SelectItem value="exempted">Exempted</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {absenceType !== 'uninformed' && (
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter the reason..."
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReasonDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmReason}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
};

export default CohortAttendancePage;
