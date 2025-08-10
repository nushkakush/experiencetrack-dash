import { useMemo, useState, useEffect } from "react";
import { addMonths, formatISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cohortsService } from "@/services/cohorts.service";
import { Cohort, NewCohortInput, NewEpicInput, CohortEpic } from "@/types/cohort";
import EpicsInput from "./EpicsInput";
import { cn } from "@/lib/utils";

function toISODate(date: Date) {
  return formatISO(date, { representation: "date" });
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

interface CohortEditWizardProps {
  cohort: Cohort;
  onUpdated?: () => void;
  onClose?: () => void;
}

export default function CohortEditWizard({ cohort, onUpdated, onClose }: CohortEditWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [checkingId, setCheckingId] = useState<boolean>(false);
  const [idAvailable, setIdAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(cohort.name);
  const [cohortId, setCohortId] = useState(cohort.cohort_id);
  const [startDate, setStartDate] = useState(cohort.start_date);
  const [duration, setDuration] = useState(cohort.duration_months);
  const [endDate, setEndDate] = useState(cohort.end_date);
  const [description, setDescription] = useState(cohort.description || "");
  const [sessionsPerDay, setSessionsPerDay] = useState(cohort.sessions_per_day);
  const [epics, setEpics] = useState<NewEpicInput[]>([]);

  // Load existing epics
  useEffect(() => {
    const loadEpics = async () => {
      try {
        const response = await cohortsService.getEpics(cohort.id);
        if (response.success && response.data) {
          const existingEpics: NewEpicInput[] = response.data.map(epic => ({
            name: epic.name,
            duration_months: epic.duration_months
          }));
          setEpics(existingEpics);
        }
      } catch (error) {
        console.error('Error loading epics:', error);
        setEpics([{ name: "", duration_months: 1 }]);
      }
    };
    loadEpics();
  }, [cohort.id]);

  // Remove auto-calculation of end date to make it editable
  // useMemo(() => {
  //   const newEnd = addMonths(new Date(startDate), Number(duration) || 1);
  //   setEndDate(toISODate(newEnd));
  // }, [startDate, duration]);

  const validateStep1 = async () => {
    if (!name.trim()) {
      toast.error("Please enter a cohort name.");
      return false;
    }
    if (!cohortId.trim()) {
      toast.error("Cohort ID is required.");
      return false;
    }
    
    // Only check uniqueness if the cohort ID has changed
    if (cohortId.trim() !== cohort.cohort_id) {
      setCheckingId(true);
      const unique = await cohortsService.isCohortIdUnique(cohortId.trim(), cohort.id);
      setCheckingId(false);
      setIdAvailable(unique);
      if (!unique) {
        toast.error("Cohort ID is already taken. Please choose a different one.");
        return false;
      }
    }
    return true;
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const input: NewCohortInput = {
        name: name.trim(),
        cohort_id: cohortId.trim(),
        start_date: startDate,
        duration_months: Number(duration) || 1,
        end_date: endDate,
        description: description.trim(),
        sessions_per_day: Number(sessionsPerDay) || 1,
      };

      const filteredEpics = (epics || []).filter((e) => e.name.trim() && (Number(e.duration_months) || 0) > 0);

      // Update cohort
      const updateResponse = await cohortsService.update(cohort.id, input);
      if (!updateResponse.success) {
        throw new Error('Failed to update cohort');
      }

      // Update epics (delete existing and create new ones)
      await supabase.from("cohort_epics").delete().eq("cohort_id", cohort.id);
      
      if (filteredEpics.length > 0) {
        const items = filteredEpics.map((e, idx) => ({
          cohort_id: cohort.id,
          name: e.name,
          duration_months: e.duration_months,
          position: idx + 1,
        }));
        await supabase.from("cohort_epics").insert(items);
      }

      toast.success("Cohort updated successfully!");
      onUpdated?.();
      onClose?.();
    } catch (error) {
      console.error('Error updating cohort:', error);
      toast.error("Failed to update cohort. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Edit Cohort</h2>
        <p className="text-muted-foreground">Update cohort details and epics.</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm">
          <div className={cn("h-2 w-2 rounded-full", step === 1 ? "bg-primary" : "bg-muted")} />
          <span className={cn(step === 1 ? "text-foreground" : "text-muted-foreground")}>Step 1: Cohort details</span>
          <Separator orientation="vertical" className="mx-2" />
          <div className={cn("h-2 w-2 rounded-full", step === 2 ? "bg-primary" : "bg-muted")} />
          <span className={cn(step === 2 ? "text-foreground" : "text-muted-foreground")}>Step 2: Epics</span>
        </div>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cohort name</Label>
            <Input placeholder="e.g. Full Stack Web Dev - 2025" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cohort ID</Label>
            <Input
              placeholder="auto-generated (editable)"
              value={cohortId}
              onChange={(e) => setCohortId(e.target.value)}
              onBlur={async () => {
                if (cohortId.trim() && cohortId.trim() !== cohort.cohort_id) {
                  setCheckingId(true);
                  const unique = await cohortsService.isCohortIdUnique(cohortId.trim(), cohort.id);
                  setCheckingId(false);
                  setIdAvailable(unique);
                }
              }}
            />
            {checkingId && <p className="text-xs text-muted-foreground">Checking availability...</p>}
            {idAvailable === false && <p className="text-xs text-destructive">This ID is already taken.</p>}
            {idAvailable === true && <p className="text-xs text-emerald-500">This ID is available.</p>}
          </div>
          <div className="space-y-2">
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Duration (months)</Label>
            <Input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2">
            <Label>End date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Sessions per day</Label>
            <Input
              type="number"
              min={1}
              value={sessionsPerDay}
              onChange={(e) => setSessionsPerDay(Number(e.target.value) || 1)}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Describe the cohort..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={async () => { if (await validateStep1()) setStep(2); }}>Next</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <EpicsInput value={epics} onChange={setEpics} />
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Updating..." : "Update cohort"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
