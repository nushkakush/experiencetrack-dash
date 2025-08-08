import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CohortWizard from '@/components/cohorts/CohortWizard';
import { useState } from 'react';
import { useCohorts } from '@/hooks/useCohorts';
import CohortCard from '@/components/cohorts/CohortCard';
import CohortDetailsDialog from '@/components/cohorts/CohortDetailsDialog';

const SuperAdminDashboard = () => {
  const { profile } = useAuth();

  // Cohorts module state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const { cohorts, isLoading, refetch } = useCohorts();

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name} {profile?.last_name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">0 active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View system analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No data available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Generate system reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No reports generated</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Cohorts</h2>
              <p className="text-sm text-muted-foreground">Create cohorts, define epics, and manage students.</p>
            </div>
            <Button onClick={() => setWizardOpen(true)}>Create Cohort</Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* simple skeletons */}
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="h-32 bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : cohorts && cohorts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cohorts.map((c) => (
                <CohortCard
                  key={c.id}
                  cohort={c}
                  onClick={() => {
                    setSelectedCohortId(c.id);
                    setDetailsOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No cohorts yet. Click "Create Cohort" to get started.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-3xl p-0">
          <CohortWizard
            onCreated={() => refetch()}
            onClose={() => setWizardOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {selectedCohortId && (
        <CohortDetailsDialog
          cohortId={selectedCohortId}
          open={detailsOpen}
          onOpenChange={(o) => setDetailsOpen(o)}
        />
      )}
    </DashboardShell>
  );
};

export default SuperAdminDashboard;
