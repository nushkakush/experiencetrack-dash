import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useCohorts } from "@/hooks/useCohorts";
import CohortWizard from "@/components/cohorts/CohortWizard";
import CohortCard from "@/components/cohorts/CohortCard";
import CohortDetailsDialog from "@/components/cohorts/CohortDetailsDialog";
import DashboardShell from "@/components/DashboardShell";

const CohortsPage = () => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { cohorts, isLoading, refetch } = useCohorts();

  const handleCohortClick = (cohortId: string) => {
    setSelectedCohortId(cohortId);
    setDetailsOpen(true);
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cohorts</h1>
            <p className="text-muted-foreground">
              Manage your training cohorts and student enrollments
            </p>
          </div>
          <Button onClick={() => setWizardOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Cohort
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))
          ) : cohorts && cohorts.length > 0 ? (
            cohorts.map((cohort) => (
              <CohortCard
                key={cohort.id}
                cohort={cohort}
                onClick={() => handleCohortClick(cohort.id)}
              />
            ))
          ) : (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>No cohorts found</CardTitle>
                <CardDescription>
                  Get started by creating your first cohort.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setWizardOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Cohort
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
          <CohortWizard
            onCreated={() => {
              refetch();
              setWizardOpen(false);
            }}
            onClose={() => setWizardOpen(false)}
          />
        </Dialog>

        {selectedCohortId && (
          <CohortDetailsDialog
            cohortId={selectedCohortId}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          />
        )}
      </div>
    </DashboardShell>
  );
};

export default CohortsPage;