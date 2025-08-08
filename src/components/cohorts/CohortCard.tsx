
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users } from "lucide-react";
import { CohortWithCounts } from "@/types/cohort";
import { cn } from "@/lib/utils";

interface CohortCardProps {
  cohort: CohortWithCounts;
  onClick?: () => void;
}

export default function CohortCard({ cohort, onClick }: CohortCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-transform hover:scale-[1.01] hover:shadow-md bg-card border",
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{cohort.name}</span>
          <span className="text-xs font-normal text-muted-foreground">ID: {cohort.cohort_id}</span>
        </CardTitle>
        <CardDescription className="line-clamp-2">{cohort.description || "No description"}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span>{cohort.start_date} → {cohort.end_date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{cohort.students_count} students</span>
        </div>
      </CardContent>
    </Card>
  );
}
