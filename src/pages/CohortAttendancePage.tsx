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
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Users, TrendingUp, AlertCircle, Zap, UserX, CheckCircle, Settings } from 'lucide-react';
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

interface AttendanceStats {
  todayPresent: number;
  todayTotal: number;
  overallAverage: number;
  needsAttention: boolean;
  topStreak: number;
  uninformedAbsents: number;
  informedAbsents: number;
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
  const [stats, setStats] = useState<AttendanceStats>({
    todayPresent: 0,
    todayTotal: 0,
    overallAverage: 0,
    needsAttention: false,
    topStreak: 0,
    uninformedAbsents: 0,
    informedAbsents: 0
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!cohortId) return;

      try {
        setLoading(true);
        
        // Load cohort
        const { data: cohortData } = await supabase
          .from('cohorts')
          .select('*')
          .eq('id', cohortId)
          .single();
        
        if (cohortData) setCohort(cohortData);

        // Load epics
        const { data: epicsData } = await supabase
          .from('cohort_epics')
          .select('*')
          .eq('cohort_id', cohortId)
          .order('order_index');
        
        if (epicsData?.length) {
          setEpics(epicsData);
          setSelectedEpic(epicsData[0].id);
        }

        // Load students
        const { data: studentsData } = await supabase
          .from('cohort_students')
          .select('*')
          .eq('cohort_id', cohortId);
        
        if (studentsData) setStudents(studentsData);

      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load cohort data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [cohortId]);

  // Load sessions when epic or date changes
  useEffect(() => {
    const loadSessions = async () => {
      if (!selectedEpic || !cohortId) return;

      try {
        const sessionDate = format(selectedDate, 'yyyy-MM-dd');
        const sessionInfos = await AttendanceService.getSessionsForDate(cohortId, selectedEpic, sessionDate);
        setSessions(sessionInfos);
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
        calculateStats(records);
      } catch (error) {
        console.error('Error loading attendance:', error);
        toast.error('Failed to load attendance records');
      }
    };

    loadAttendance();
  }, [selectedSession, selectedEpic, selectedDate, cohortId, students]);

  const calculateStats = (records: AttendanceRecord[]) => {
    const todayPresent = records.filter(r => r.status === 'present').length;
    const todayTotal = students.length;
    const uninformedAbsents = records.filter(r => r.status === 'absent' && r.absence_type === 'uninformed').length;
    const informedAbsents = records.filter(r => r.status === 'absent' && r.absence_type === 'informed').length;
    
    setStats({
      todayPresent,
      todayTotal,
      overallAverage: todayTotal > 0 ? (todayPresent / todayTotal) * 100 : 0,
      needsAttention: uninformedAbsents > 0,
      topStreak: 0, // TODO: Calculate actual streak
      uninformedAbsents,
      informedAbsents
    });
  };

  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (!selectedSession || !selectedEpic || !cohortId) return;

    const currentSession = sessions.find(s => s.sessionNumber === selectedSession);
    if (currentSession?.isCancelled || isAfter(selectedDate, new Date())) {
      toast.error('Cannot mark attendance for cancelled or future sessions');
      return;
    }

    if (status === 'present') {
      // Mark present directly
      try {
        const sessionDate = format(selectedDate, 'yyyy-MM-dd');
        await AttendanceService.markAttendance(cohortId, selectedEpic, selectedSession, sessionDate, studentId, status);
        
        // Reload attendance
        const records = await AttendanceService.getSessionAttendance(cohortId, selectedEpic, selectedSession, sessionDate);
        setAttendanceRecords(records);
        calculateStats(records);
        toast.success('Attendance marked as present');
      } catch (error) {
        console.error('Error marking attendance:', error);
        toast.error('Failed to mark attendance');
      }
    } else {
      // Show dialog for absent/late
      const student = students.find(s => s.id === studentId);
      if (student) {
        setSelectedStudent(student);
        setSelectedStatus(status);
        setShowReasonDialog(true);
      }
    }
  };

  const handleConfirmReason = async () => {
    if (!selectedStudent || !selectedSession || !selectedEpic || !cohortId) return;

    try {
      const sessionDate = format(selectedDate, 'yyyy-MM-dd');
      const finalReason = absenceType === 'uninformed' ? undefined : reason;
      
      await AttendanceService.markAttendance(cohortId, selectedEpic, selectedSession, sessionDate, selectedStudent.id, selectedStatus, absenceType, finalReason);
      
      // Reload attendance
      const records = await AttendanceService.getSessionAttendance(cohortId, selectedEpic, selectedSession, sessionDate);
      setAttendanceRecords(records);
      calculateStats(records);
      
      setShowReasonDialog(false);
      setReason('');
      setSelectedStudent(null);
      toast.success(`Attendance marked as ${selectedStatus}`);
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
      
      // Reload sessions
      const sessionInfos = await AttendanceService.getSessionsForDate(cohortId, selectedEpic, sessionDate);
      setSessions(sessionInfos);
      toast.success('Session cancelled');
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
      
      // Reload sessions
      const sessionInfos = await AttendanceService.getSessionsForDate(cohortId, selectedEpic, sessionDate);
      setSessions(sessionInfos);
      toast.success('Session reactivated');
    } catch (error) {
      console.error('Error reactivating session:', error);
      toast.error('Failed to reactivate session');
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    const record = attendanceRecords.find(r => r.student_id === studentId);
    return record?.status || null;
  };

  const getAttendanceReason = (studentId: string) => {
    const record = attendanceRecords.find(r => r.student_id === studentId);
    if (!record || record.status === 'present') return '-';
    
    if (record.absence_type === 'uninformed') return 'Uninformed';
    if (record.absence_type === 'informed') return record.reason || 'Informed';
    if (record.absence_type === 'exempted') return record.reason || 'Exempted';
    if (record.status === 'late') return record.reason || 'Late';
    
    return '-';
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
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/cohorts')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cohorts
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Attendance Tracker</h1>
              <p className="text-muted-foreground">{cohort?.name || 'Loading...'}</p>
            </div>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Mark Holidays
          </Button>
        </div>

        {/* Epic Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">EPIC:</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                <span className="font-medium">{currentEpic?.name || 'Epic 1'}</span>
                <Badge variant="secondary">Active</Badge>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Start: {cohort?.start_date ? format(parseISO(cohort.start_date), 'MMM d, yyyy') : 'N/A'}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-700">Today's Attendance</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.todayPresent}/{stats.todayTotal}</p>
                  <p className="text-xs text-blue-600">{stats.todayTotal > 0 ? ((stats.todayPresent / stats.todayTotal) * 100).toFixed(1) : 0}% present</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-700">Overall Average</p>
                  <p className="text-2xl font-bold text-green-900">{stats.overallAverage.toFixed(1)}%</p>
                  <p className="text-xs text-green-600">All-time attendance rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-700">Attendance Status</p>
                  <p className="text-sm font-bold text-orange-900">{stats.needsAttention ? 'Needs Attention' : 'Good'}</p>
                  <p className="text-xs text-orange-600">Current status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-700">Top Streak</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.topStreak}</p>
                  <p className="text-xs text-purple-600">-</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <UserX className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-700">Uninformed Absents</p>
                  <p className="text-2xl font-bold text-red-900">{stats.uninformedAbsents}</p>
                  <p className="text-xs text-red-600">For this EPIC only</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-teal-50 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-teal-600" />
                <div>
                  <p className="text-sm font-medium text-teal-700">Informed Absents</p>
                  <p className="text-2xl font-bold text-teal-900">{stats.informedAbsents}</p>
                  <p className="text-xs text-teal-600">For this EPIC only</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>Attendance - {format(selectedDate, 'MMM d, yyyy')}</CardTitle>
                
                {/* Date Navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        {format(selectedDate, 'dd/MM/yyyy')}
                        <CalendarIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                    disabled={!isAfter(addDays(selectedDate, 1), new Date())}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Select defaultValue="table">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Table View</SelectItem>
                    <SelectItem value="grid">Grid View</SelectItem>
                  </SelectContent>
                </Select>

                {/* Session Control Button */}
                <Button
                  variant={isSessionCancelled ? "default" : "destructive"}
                  size="sm"
                  onClick={() => {
                    if (isSessionCancelled) {
                      handleReactivateSession();
                    } else {
                      handleCancelSession();
                    }
                  }}
                >
                  {isSessionCancelled ? "Reactivate Session" : "Cancel Session"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedSession.toString()} onValueChange={(value) => setSelectedSession(parseInt(value))}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                {sessions.map(session => (
                  <TabsTrigger 
                    key={session.sessionNumber} 
                    value={session.sessionNumber.toString()}
                    className="relative"
                  >
                    Session {session.sessionNumber}
                    {session.isCancelled && (
                      <X className="h-3 w-3 ml-2 text-red-500" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {sessions.map(session => (
                <TabsContent key={session.sessionNumber} value={session.sessionNumber.toString()}>
                  {/* Attendance Table */}
                  {students.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No students found</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map(student => {
                          const attendanceStatus = getAttendanceStatus(student.id);
                          const reason = getAttendanceReason(student.id);
                          return (
                            <TableRow key={`${student.id}-${attendanceStatus}`}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                                    {student.first_name?.[0]}{student.last_name?.[0]}
                                  </div>
                                  <span className="font-medium">
                                    {student.first_name} {student.last_name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {attendanceStatus ? (
                                  <Badge variant={
                                    attendanceStatus === 'present' ? 'default' :
                                    attendanceStatus === 'absent' ? 'destructive' : 'secondary'
                                  }>
                                    {attendanceStatus === 'present' ? 'Present' :
                                     attendanceStatus === 'absent' ? 'Absent' : 'Late'}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {reason}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant={getButtonVariant(student.id, 'present')}
                                    className={getButtonClassName(student.id, 'present')}
                                    onClick={() => handleMarkAttendance(student.id, 'present')}
                                    disabled={isSessionCancelled || isFutureDate}
                                  >
                                    Present
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={getButtonVariant(student.id, 'absent')}
                                    className={getButtonClassName(student.id, 'absent')}
                                    onClick={() => handleMarkAttendance(student.id, 'absent')}
                                    disabled={isSessionCancelled || isFutureDate}
                                  >
                                    Absent
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={getButtonVariant(student.id, 'late')}
                                    className={getButtonClassName(student.id, 'late')}
                                    onClick={() => handleMarkAttendance(student.id, 'late')}
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
                </TabsContent>
              ))}
            </Tabs>
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
                {selectedStatus === 'absent' 
                  ? 'Please specify the type of absence and provide a reason if needed.'
                  : 'Please specify if this is an informed or uninformed late arrival and provide a reason if needed.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="absence-type">Type</Label>
                <Select
                  value={absenceType}
                  onValueChange={(value: 'informed' | 'uninformed' | 'exempted') => setAbsenceType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedStatus === 'absent' ? (
                      <>
                        <SelectItem value="uninformed">Uninformed Absence</SelectItem>
                        <SelectItem value="informed">Informed Absence</SelectItem>
                        <SelectItem value="exempted">Exempted</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="uninformed">Uninformed Late</SelectItem>
                        <SelectItem value="informed">Informed Late</SelectItem>
                      </>
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
                    placeholder="Enter reason..."
                    className="min-h-[80px]"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReasonDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmReason}>
                Mark as {selectedStatus}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
};

export default CohortAttendancePage;