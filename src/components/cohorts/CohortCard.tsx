
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, Clock, DollarSign, Edit } from "lucide-react";
import { CohortWithCounts } from "@/types/cohort";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import { AttendanceFeatureGate, FeeFeatureGate, CohortFeatureGate } from "@/components/common";

interface CohortCardProps {
  cohort: CohortWithCounts;
  onClick?: () => void;
  onFeeCollectionClick?: () => void;
  onEditClick?: () => void;
}

export default function CohortCard({ cohort, onClick, onFeeCollectionClick, onEditClick }: CohortCardProps) {
  const navigate = useNavigate();
  const { canViewAttendance, canViewFees, canSetupFeeStructure } = useFeaturePermissions();

  const handleAttendanceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/cohorts/${cohort.id}/attendance`);
  };

  const handleFeeCollectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFeeCollectionClick) {
      onFeeCollectionClick();
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditClick) {
      onEditClick();
    }
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-transform hover:scale-[1.01] hover:shadow-md bg-card border flex flex-col h-full min-h-[280px]",
      )}
    >
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="mb-1">{cohort.name}</CardTitle>
            <div className="text-xs font-normal text-blue-600 dark:text-blue-400 mb-2">ID: {cohort.cohort_id}</div>
            <CardDescription className="line-clamp-2">{cohort.description || "No description"}</CardDescription>
          </div>
          <CohortFeatureGate action="edit">
            <Button
              onClick={handleEditClick}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 h-8 w-8 p-0 ml-2"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </CohortFeatureGate>
        </div>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>{cohort.start_date} → {cohort.end_date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{cohort.students_count} students</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AttendanceFeatureGate action="view">
            <Button
              onClick={handleAttendanceClick}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Attendance
            </Button>
          </AttendanceFeatureGate>
          
          <FeeFeatureGate action="view">
            <Button
              onClick={handleFeeCollectionClick}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Fee Collection
            </Button>
          </FeeFeatureGate>
        </div>
      </CardContent>
    </Card>
  );
}
