
import { useMemo, useState } from "react";
import { addMonths, formatISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cohortsService } from "@/services/cohorts.service";
import { NewCohortInput, NewEpicInput } from "@/types/cohort";
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

interface CohortWizardProps {
  onCreated?: () => void;
  onClose?: () => void;
}

export default function CohortWizard({ onCreated, onClose }: CohortWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [checkingId, setCheckingId] = useState<boolean>(false);
  const [idAvailable, setIdAvailable] = useState<boolean | null>(null);

  const [name, setName] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [startDate, setStartDate] = useState(toISODate(new Date()));
  const [duration, setDuration] = useState(6);
  const [endDate, setEndDate] = useState(toISODate(addMonths(new Date(startDate), duration)));
  const [description, setDescription] = useState("");
  const [sessionsPerDay, setSessionsPerDay] = useState(1);
  const [epics, setEpics] = useState<NewEpicInput[]>([{ name: "", duration_months: 1 }]);

  useMemo(() => {
    const auto = slugify(name || "cohort");
    const rnd = Math.floor(100 + Math.random() * 900);
    if (!cohortId) {
      setCohortId(`${auto}-${rnd}`);
    }
  }, [name]); // eslint-disable-line

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
    setCheckingId(true);
    const unique = await cohortsService.isCohortIdUnique(cohortId.trim());
    setCheckingId(false);
    setIdAvailable(unique);
    if (!unique) {
      toast.error("Cohort ID is already taken. Please choose a different one.");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
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

    const res = await cohortsService.createWithEpics(input, filteredEpics);
    if (res.success) {
      toast.success("Cohort created successfully!");
      onCreated?.();
      onClose?.();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Create Cohort</h2>
        <p className="text-muted-foreground">Set up a cohort and its epics in two quick steps.</p>
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
                if (cohortId.trim()) {
                  setCheckingId(true);
                  const unique = await cohortsService.isCohortIdUnique(cohortId.trim());
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
            <Button onClick={handleCreate}>Create cohort</Button>
          </div>
        </div>
      )}
    </div>
  );
}
