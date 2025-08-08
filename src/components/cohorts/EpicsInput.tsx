
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { NewEpicInput } from "@/types/cohort";
import { cn } from "@/lib/utils";

interface EpicsInputProps {
  value: NewEpicInput[];
  onChange: (epics: NewEpicInput[]) => void;
}

export default function EpicsInput({ value, onChange }: EpicsInputProps) {
  const [items, setItems] = useState<NewEpicInput[]>(value?.length ? value : [{ name: "", duration_months: 1 }]);

  const update = (next: NewEpicInput[]) => {
    setItems(next);
    onChange(next);
  };

  const addEpic = () => {
    update([...items, { name: "", duration_months: 1 }]);
  };

  const removeEpic = (index: number) => {
    update(items.filter((_, i) => i !== index));
  };

  const changeEpic = (index: number, patch: Partial<NewEpicInput>) => {
    const next = items.map((e, i) => (i === index ? { ...e, ...patch } : e));
    update(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground">Epics in this cohort</Label>
        <Button type="button" variant="secondary" size="sm" onClick={addEpic}>
          <Plus className="h-4 w-4 mr-2" /> Add epic
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((epic, idx) => (
          <div key={idx} className={cn("grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-md border bg-card p-3")}>
            <div className="md:col-span-7">
              <Label className="text-xs text-muted-foreground">Epic name</Label>
              <Input
                placeholder="e.g. Foundations of Web Dev"
                value={epic.name}
                onChange={(e) => changeEpic(idx, { name: e.target.value })}
              />
            </div>
            <div className="md:col-span-3">
              <Label className="text-xs text-muted-foreground">Duration (months)</Label>
              <Input
                type="number"
                min={1}
                value={epic.duration_months}
                onChange={(e) => changeEpic(idx, { duration_months: Number(e.target.value) || 1 })}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button variant="ghost" size="icon" type="button" onClick={() => removeEpic(idx)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground">No epics yet. Add at least one or keep it empty.</div>
        )}
      </div>
    </div>
  );
}
