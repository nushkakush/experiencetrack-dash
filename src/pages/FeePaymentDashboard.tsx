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
  Download
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
      // Load cohort data
      const cohortResult = await cohortsService.getByIdWithCounts(cohortId!);
      if (cohortResult.success && cohortResult.data) {
        setCohortData(cohortResult.data);
      }

      // Load fee structure
      const { feeStructure: feeData, scholarships: scholarshipData } = 
        await FeeStructureService.getCompleteFeeStructure(cohortId!);
      
      setFeeStructure(feeData);
      setScholarships(scholarshipData);

      // Load student payment summaries
      const studentsResult = await studentPaymentsService.getStudentPaymentSummary(cohortId!);
      if (studentsResult.success && studentsResult.data) {
        setStudents(studentsResult.data);
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="litmus">LITMUS Test</TabsTrigger>
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

          <TabsContent value="overview" className="mt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Overview</h3>
              <p className="text-muted-foreground">Overview content will be implemented here</p>
            </div>
          </TabsContent>

          <TabsContent value="applications" className="mt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Applications</h3>
              <p className="text-muted-foreground">Applications content will be implemented here</p>
            </div>
          </TabsContent>

          <TabsContent value="litmus" className="mt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">LITMUS Test</h3>
              <p className="text-muted-foreground">LITMUS Test content will be implemented here</p>
            </div>
          </TabsContent>

          <TabsContent value="communication" className="mt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Communication</h3>
              <p className="text-muted-foreground">Communication content will be implemented here</p>
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
