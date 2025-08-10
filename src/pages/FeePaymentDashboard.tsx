import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, ArrowLeft, DollarSign, Users, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import DashboardShell from "@/components/DashboardShell";
import { FeeCollectionSetupModal } from "@/components/fee-collection";
import { FeeStructureService } from "@/services/feeStructure.service";
import { FeeFeatureGate } from "@/components/common";
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
  const [cohortData, setCohortData] = useState<any>(null);
  const { canSetupFeeStructure } = useFeaturePermissions();

  useEffect(() => {
    if (cohortId) {
      loadFeeData();
    }
  }, [cohortId]);

  const loadFeeData = async () => {
    setIsLoading(true);
    try {
      const { feeStructure: feeData, scholarships: scholarshipData } = 
        await FeeStructureService.getCompleteFeeStructure(cohortId!);
      
      setFeeStructure(feeData);
      setScholarships(scholarshipData);
      
      // Load cohort data (you might need to create a service for this)
      // For now, we'll use placeholder data
      setCohortData({
        id: cohortId,
        name: "Cohort Name", // This should come from cohort service
        start_date: "2025-01-01", // This should come from cohort service
        description: "Cohort Description" // This should come from cohort service
      });
    } catch (error) {
      console.error('Error loading fee data:', error);
      toast.error('Failed to load fee structure');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsComplete = () => {
    loadFeeData(); // Refresh data after settings are updated
  };

  const handleBackClick = () => {
    navigate('/cohorts');
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

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
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
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fee Payment Dashboard</h1>
              <p className="text-muted-foreground">
                Manage fee structure and payment plans for {cohortData?.name || 'this cohort'}
              </p>
            </div>
          </div>
          <FeeFeatureGate action="setup_structure">
            <Button
              onClick={() => setSettingsModalOpen(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </FeeFeatureGate>
        </div>

        {/* Fee Structure Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Fee Structure Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feeStructure ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ₹{feeStructure.total_program_fee?.toLocaleString('en-IN') || '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Program Fee</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{feeStructure.admission_fee?.toLocaleString('en-IN') || '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Admission Fee</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {scholarships.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Scholarships</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${feeStructure.is_setup_complete ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="font-medium">
                      {feeStructure.is_setup_complete ? 'Fee Structure Complete' : 'Fee Structure Incomplete'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettingsModalOpen(true)}
                  >
                    {feeStructure.is_setup_complete ? 'Edit Settings' : 'Complete Setup'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Fee Structure Found</h3>
                <p className="text-muted-foreground mb-4">
                  Set up the fee structure for this cohort to start managing payments.
                </p>
                <FeeFeatureGate action="setup_structure">
                  <Button onClick={() => setSettingsModalOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Set Up Fee Structure
                  </Button>
                </FeeFeatureGate>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Plans Preview */}
        {feeStructure && feeStructure.is_setup_complete && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Plans</CardTitle>
              <CardDescription>
                Preview of available payment plans for students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-2 border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">One-Shot Payment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{(feeStructure.total_program_fee * (1 + 0.18) * (1 - feeStructure.one_shot_discount_percentage / 100)).toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {feeStructure.one_shot_discount_percentage}% discount applied
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-green-200 dark:border-green-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Semester-wise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {feeStructure.number_of_semesters} Semesters
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {feeStructure.instalments_per_semester} installments per semester
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-purple-200 dark:border-purple-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Installment-wise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {feeStructure.number_of_semesters * feeStructure.instalments_per_semester} Installments
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Flexible payment schedule
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

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
