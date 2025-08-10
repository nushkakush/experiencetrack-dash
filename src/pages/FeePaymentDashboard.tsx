import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  ArrowLeft, 
  DollarSign, 
  Users, 
  Calendar, 
  Clock,
  Send,
  Download,
  Mail
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import DashboardShell from "@/components/DashboardShell";
import { FeeCollectionSetupModal } from "@/components/fee-collection";
import { FeeStructureService } from "@/services/feeStructure.service";
import { studentPaymentsService } from "@/services/studentPayments.service";
import { cohortsService } from "@/services/cohorts.service";
import { FeeFeatureGate } from "@/components/common";
import { PaymentsTable } from "@/components/fee-collection/PaymentsTable";
import { StudentPaymentDetails } from "@/components/fee-collection/StudentPaymentDetails";
import { StudentPaymentSummary, CohortWithCounts } from "@/types/fee";
import { toast } from "sonner";

interface FeePaymentDashboardProps {}

const FeePaymentDashboard: React.FC<FeePaymentDashboardProps> = () => {
  const { cohortId } = useParams<{ cohortId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [feeStructure, setFeeStructure] = useState<any>(null);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cohortData, setCohortData] = useState<CohortWithCounts | null>(null);
  const [students, setStudents] = useState<StudentPaymentSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentPaymentSummary | null>(null);
  const [activeTab, setActiveTab] = useState('payments');
  const { canSetupFeeStructure } = useFeaturePermissions();

  useEffect(() => {
    if (cohortId) {
      loadData();
    }
  }, [cohortId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading data for cohort:', cohortId);
      
      // Load cohort data
      const cohortResult = await cohortsService.getByIdWithCounts(cohortId!);
      console.log('Cohort result:', cohortResult);
      if (cohortResult.success && cohortResult.data) {
        setCohortData(cohortResult.data);
      }

      // Load fee structure
      const { feeStructure: feeData, scholarships: scholarshipData } = 
        await FeeStructureService.getCompleteFeeStructure(cohortId!);
      console.log('Fee structure result:', { feeData, scholarshipData });
      
      setFeeStructure(feeData);
      setScholarships(scholarshipData);

      // Load student payment summaries
      const studentsResult = await studentPaymentsService.getStudentPaymentSummary(cohortId!);
      console.log('Students result:', studentsResult);
      if (studentsResult.success && studentsResult.data) {
        console.log('Setting students:', studentsResult.data);
        setStudents(studentsResult.data);
      } else {
        console.log('No students data or error:', studentsResult.error);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsComplete = () => {
    loadData(); // Refresh data after settings are updated
  };

  const handleBackClick = () => {
    navigate('/cohorts');
  };

  const handleStudentSelect = (student: StudentPaymentSummary) => {
    setSelectedStudent(student);
  };

  const handleCloseStudentDetails = () => {
    setSelectedStudent(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getSeatsProgress = () => {
    if (!cohortData) return 0;
    // For now, using students_count as filled seats
    // You might want to add a total_seats field to the cohort
    const totalSeats = 50; // This should come from cohort data
    return Math.round((cohortData.students_count / totalSeats) * 100);
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!cohortData) {
    return (
      <DashboardShell>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cohort Not Found</h2>
          <p className="text-gray-600">The cohort you're looking for doesn't exist or you don't have permission to view it.</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackClick}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cohorts
          </Button>
        </div>

        {/* Cohort Header */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{cohortData.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Open
                </Badge>
                <span className="text-muted-foreground">Cohort ID: {cohortData.cohort_id}</span>
                <span className="text-muted-foreground">{cohortData.description}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Schedule
              </Button>
              <FeeFeatureGate action="setup_structure">
                <Button
                  onClick={() => setSettingsModalOpen(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </FeeFeatureGate>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Batch Details</p>
              <p className="font-medium">Morning Batch (M-W-F)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">
                {formatDate(cohortData.start_date)} - {formatDate(cohortData.end_date)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Seats</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">Filled {cohortData.students_count}/50</span>
                <Progress value={getSeatsProgress()} className="w-20 h-2" />
              </div>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatDate(cohortData.start_date)} - {formatDate(cohortData.end_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">Payments</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Send Reminders
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex gap-6">
              {/* Payments Table */}
              <div className="flex-1">
                <PaymentsTable
                  students={students}
                  onStudentSelect={handleStudentSelect}
                  selectedStudent={selectedStudent}
                  feeStructure={feeStructure}
                />
              </div>

              {/* Student Details Sidebar */}
              {selectedStudent && (
                <StudentPaymentDetails
                  student={selectedStudent}
                  onClose={handleCloseStudentDetails}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="communication" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Communication</h2>
                <Button className="gap-2">
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Send Manual Email</CardTitle>
                  <CardDescription>
                    Compose and send emails to specific students in this cohort
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Select Students</label>
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                        {students.map((student) => (
                          <div key={student.student_id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={student.student_id}
                              className="rounded"
                            />
                            <label htmlFor={student.student_id} className="text-sm">
                              {student.student?.first_name} {student.student?.last_name} ({student.student?.email})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Subject</label>
                      <input
                        type="text"
                        placeholder="Enter email subject..."
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Message</label>
                      <textarea
                        placeholder="Enter your email message..."
                        rows={6}
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Cancel</Button>
                      <Button>Send Email</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Settings Modal */}
        {cohortData && (
          <FeeFeatureGate action="setup_structure">
            <FeeCollectionSetupModal
              open={settingsModalOpen}
              onOpenChange={setSettingsModalOpen}
              cohortId={cohortData.id}
              cohortStartDate={cohortData.start_date}
              onSetupComplete={handleSettingsComplete}
            />
          </FeeFeatureGate>
        )}
      </div>
    </DashboardShell>
  );
};

export default FeePaymentDashboard;
