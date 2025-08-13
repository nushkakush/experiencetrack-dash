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
import { Award, Plus, X, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<StudentScholarshipWithDetails | null>(null);
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>('');
  const [additionalDiscount, setAdditionalDiscount] = useState<number>(0);

  const selectedScholarship = scholarships.find(s => s.id === selectedScholarshipId);

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when dialog closes
        setSelectedScholarshipId('');
        setAdditionalDiscount(0);
        setIsEditing(false);
      }
    }
  };

  const loadCurrentAssignment = async () => {
    try {
      const result = await studentScholarshipsService.getByStudent(student.id);
      if (result.success && result.data) {
        setCurrentAssignment(result.data);
        // Only set form values if we're editing
        if (isEditing) {
          setSelectedScholarshipId(result.data.scholarship_id);
          setAdditionalDiscount(result.data.additional_discount_percentage);
        }
      } else {
        setCurrentAssignment(null);
        if (isEditing) {
          setSelectedScholarshipId('');
          setAdditionalDiscount(0);
        }
      }
    } catch (error) {
      console.error('Error loading current assignment:', error);
      setCurrentAssignment(null);
      if (isEditing) {
        setSelectedScholarshipId('');
        setAdditionalDiscount(0);
      }
    }
  };

  useEffect(() => {
    if (open) {
      loadCurrentAssignment();
    }
  }, [open, student.id]);

  const handleAssignScholarship = async () => {
    if (!selectedScholarshipId) {
      toast.error('Please select a scholarship');
      return;
    }

    setLoading(true);
    try {
      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }
      
      const result = await studentScholarshipsService.assignScholarship(
        student.id,
        selectedScholarshipId,
        additionalDiscount,
        user.id
      );

      if (result.success) {
        toast.success('Scholarship assigned successfully!');
        setOpen(false);
        setIsEditing(false);
        onScholarshipAssigned();
      } else {
        toast.error(result.error || 'Failed to assign scholarship');
      }
    } catch (error) {
      console.error('Error assigning scholarship:', error);
      toast.error('Failed to assign scholarship. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveScholarship = async () => {
    if (!currentAssignment) return;

    setLoading(true);
    try {
      const result = await studentScholarshipsService.removeScholarship(student.id);
      
      if (result.success) {
        toast.success('Scholarship removed successfully!');
        setOpen(false);
        setIsEditing(false);
        onScholarshipAssigned();
      } else {
        toast.error(result.error || 'Failed to remove scholarship');
      }
    } catch (error) {
      console.error('Error removing scholarship:', error);
      toast.error('Failed to remove scholarship. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentAssignment && !isEditing ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Award className="h-5 w-5" />
            )}
            {currentAssignment && !isEditing 
              ? 'Scholarship Details' 
              : isEditing 
                ? 'Edit Scholarship' 
                : 'Assign Scholarship'
            }
          </DialogTitle>
          <DialogDescription>
            {currentAssignment && !isEditing 
              ? 'View the scholarship assigned to this student.'
              : 'Select a scholarship and optional additional discount for this student.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentAssignment && !isEditing ? (
            // Read-only view when scholarship is assigned
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Scholarship Assigned
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Scholarship:</span> {currentAssignment.scholarship?.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Discount:</span> {currentAssignment.scholarship?.amount_percentage}%
                  </p>
                  {currentAssignment.additional_discount_percentage > 0 && (
                    <p className="text-sm">
                      <span className="font-medium">Additional Discount:</span> {currentAssignment.additional_discount_percentage}%
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Total Discount:</span> {currentAssignment.scholarship?.amount_percentage + currentAssignment.additional_discount_percentage}%
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex-1"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Edit Scholarship
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRemoveScholarship}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            // Edit form when no scholarship or editing
            <div className="space-y-4">
              {/* Current Assignment Display (when editing) */}
              {currentAssignment && isEditing && (
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
          )}
        </div>

        <DialogFooter>
          {currentAssignment && !isEditing ? (
            // Read-only view footer
            <Button onClick={() => setOpen(false)}>
              Close
            </Button>
          ) : (
            // Edit form footer
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                    // Reset form to current values
                    if (currentAssignment) {
                      setSelectedScholarshipId(currentAssignment.scholarship_id);
                      setAdditionalDiscount(currentAssignment.additional_discount_percentage);
                    }
                  } else {
                    setOpen(false);
                  }
                }} 
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleAssignScholarship} disabled={loading || !selectedScholarshipId}>
                {loading ? 'Assigning...' : (isEditing ? 'Update Scholarship' : 'Assign Scholarship')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
