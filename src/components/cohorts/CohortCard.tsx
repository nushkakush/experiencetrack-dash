
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
      <CardContent className="space-y-4">
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
          
          <CohortFeatureGate action="edit">
            <Button
              onClick={handleEditClick}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </CohortFeatureGate>
        </div>
      </CardContent>
    </Card>
  );
}
