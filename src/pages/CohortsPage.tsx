import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useCohorts } from "@/hooks/useCohorts";
import CohortWizard from "@/components/cohorts/CohortWizard";
import CohortCard from "@/components/cohorts/CohortCard";
import DashboardShell from "@/components/DashboardShell";

const CohortsPage = () => {
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { cohorts, isLoading, refetch } = useCohorts();

  const handleCohortClick = (cohortId: string) => {
    navigate(`/cohorts/${cohortId}`);
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

        {isLoading ? (
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
        ) : cohorts && cohorts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cohorts.map((cohort) => (
              <CohortCard
                key={cohort.id}
                cohort={cohort}
                onClick={() => handleCohortClick(cohort.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>No cohorts found</CardTitle>
                <CardDescription>
                  Get started by creating your first cohort.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => setWizardOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Cohort
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
          <DialogContent className="max-w-4xl">
            <CohortWizard
              onCreated={() => {
                refetch();
                setWizardOpen(false);
              }}
              onClose={() => setWizardOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
};

export default CohortsPage;