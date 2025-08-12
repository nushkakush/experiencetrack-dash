import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Logger } from "@/lib/logging/Logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { studentScholarshipsService } from "@/services/studentScholarships.service";
import { CohortStudent, Scholarship, StudentScholarshipWithDetails } from "@/types/fee";
import { Award, Plus, X } from "lucide-react";

interface StudentScholarshipDialogProps {
  student: CohortStudent;
  scholarships: Scholarship[];
  onScholarshipAssigned: () => void;
  children: React.ReactNode;
}

export default function StudentScholarshipDialog({ 
  student, 
  scholarships, 
  onScholarshipAssigned,
  children 
}: StudentScholarshipDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<StudentScholarshipWithDetails | null>(null);
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>('');
  const [additionalDiscount, setAdditionalDiscount] = useState<number>(0);

  // Load current scholarship assignment
  useEffect(() => {
    if (open && student.id) {
      loadCurrentAssignment();
    }
  }, [open, student.id]);

  const loadCurrentAssignment = async () => {
    try {
      const result = await studentScholarshipsService.getByStudent(student.id);
      if (result.success && result.data) {
        setCurrentAssignment(result.data);
        setSelectedScholarshipId(result.data.scholarship_id);
        setAdditionalDiscount(result.data.additional_discount_percentage);
      } else {
        setCurrentAssignment(null);
        setSelectedScholarshipId('');
        setAdditionalDiscount(0);
      }
    } catch (error) {
      console.error('Error loading current assignment:', error);
      setCurrentAssignment(null);
      setSelectedScholarshipId('');
      setAdditionalDiscount(0);
    }
  };

  const handleAssignScholarship = async () => {
    if (!selectedScholarshipId) {
      toast.error('Please select a scholarship');
      return;
    }

    setLoading(true);
    try {
      const result = await studentScholarshipsService.assignScholarship(
        student.id,
        selectedScholarshipId,
        additionalDiscount,
        'current-user-id' // TODO: Get from auth context
      );

      if (result.success) {
        toast.success('Scholarship assigned successfully');
        onScholarshipAssigned();
        setOpen(false);
      } else {
        toast.error('Failed to assign scholarship');
      }
    } catch (error) {
      console.error('Error assigning scholarship:', error);
      toast.error('An error occurred while assigning the scholarship');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveScholarship = async () => {
    if (!currentAssignment) return;

    setLoading(true);
    try {
      const result = await studentScholarshipsService.removeScholarship(
        student.id,
        currentAssignment.scholarship_id
      );

      if (result.success) {
        toast.success('Scholarship removed successfully');
        onScholarshipAssigned();
        setOpen(false);
      } else {
        toast.error('Failed to remove scholarship');
      }
    } catch (error) {
      console.error('Error removing scholarship:', error);
      toast.error('An error occurred while removing the scholarship');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when dialog closes
        setSelectedScholarshipId('');
        setAdditionalDiscount(0);
      }
    }
  };

  const selectedScholarship = scholarships.find(s => s.id === selectedScholarshipId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Assign Scholarship
          </DialogTitle>
          <DialogDescription>
            Assign a scholarship to {student.first_name} {student.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignment Display */}
          {currentAssignment && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Current Scholarship:</p>
                  <p className="text-sm text-muted-foreground">
                    {currentAssignment.scholarship?.name} ({currentAssignment.scholarship?.amount_percentage}%)
                  </p>
                  {currentAssignment.additional_discount_percentage > 0 && (
                    <p className="text-sm text-muted-foreground">
                      + {currentAssignment.additional_discount_percentage}% additional discount
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveScholarship}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Scholarship Selection */}
          <div className="space-y-2">
            <Label>Select Scholarship</Label>
            <div className="grid gap-2">
              <Button
                variant={selectedScholarshipId === '' ? 'default' : 'outline'}
                onClick={() => setSelectedScholarshipId('')}
                className="justify-start"
              >
                No Scholarship
              </Button>
              {scholarships.map((scholarship) => (
                <Button
                  key={scholarship.id}
                  variant={selectedScholarshipId === scholarship.id ? 'default' : 'outline'}
                  onClick={() => setSelectedScholarshipId(scholarship.id)}
                  className="justify-start"
                >
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>{scholarship.name}</span>
                    <Badge variant="secondary">{scholarship.amount_percentage}%</Badge>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Additional Discount */}
          {selectedScholarshipId && (
            <div className="space-y-2">
              <Label htmlFor="additional-discount">
                Additional Discount (%)
                <span className="text-xs text-muted-foreground ml-1">
                  (Optional extra discount on top of scholarship)
                </span>
              </Label>
              <Input
                id="additional-discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={additionalDiscount}
                onChange={(e) => setAdditionalDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full"
              />
            </div>
          )}

          {/* Summary */}
          {selectedScholarship && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Total Discount: {selectedScholarship.amount_percentage + additionalDiscount}%
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {selectedScholarship.amount_percentage}% scholarship + {additionalDiscount}% additional discount
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssignScholarship} disabled={loading || !selectedScholarshipId}>
            {loading ? 'Assigning...' : 'Assign Scholarship'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
