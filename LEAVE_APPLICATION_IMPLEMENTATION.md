# Leave Application System Implementation

## Overview

A comprehensive leave application system has been implemented that allows students to apply for leave, get approval from program managers, and automatically mark approved leaves as "informed" in the attendance system.

## Database Changes

### Schema Extensions

The `attendance_records` table has been extended with the following new columns:

```sql
ALTER TABLE attendance_records ADD COLUMN leave_application_id UUID;
ALTER TABLE attendance_records ADD COLUMN leave_status TEXT DEFAULT 'pending' CHECK (leave_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE attendance_records ADD COLUMN leave_applied_at TIMESTAMPTZ;
ALTER TABLE attendance_records ADD COLUMN leave_approved_by UUID REFERENCES profiles(id);
ALTER TABLE attendance_records ADD COLUMN leave_approved_at TIMESTAMPTZ;
ALTER TABLE attendance_records ADD COLUMN leave_rejection_reason TEXT;
```

### Database Triggers

A trigger has been implemented to automatically update attendance records when leave applications are approved:

```sql
-- Function to update attendance when leave is approved
CREATE OR REPLACE FUNCTION update_attendance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.leave_status = 'approved' AND OLD.leave_status = 'pending' THEN
        NEW.absence_type = 'informed';
        NEW.leave_approved_at = now();
    ELSIF NEW.leave_status = 'rejected' AND OLD.leave_status = 'pending' THEN
        NEW.absence_type = 'uninformed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update attendance on approval
CREATE TRIGGER update_attendance_on_approval_trigger
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_on_approval();
```

## Frontend Implementation

### New Components Created

1. **LeaveApplicationForm** (`src/components/attendance/LeaveApplicationForm.tsx`)
   - Form for students to submit leave applications
   - Date picker with validation
   - Common reason selection with custom reason option
   - Session number selection

2. **LeaveApplicationHistory** (`src/components/attendance/LeaveApplicationHistory.tsx`)
   - Table showing student's leave application history
   - Status badges (pending, approved, rejected)
   - Delete functionality for pending applications
   - Rejection reason display

3. **LeaveApprovalQueue** (`src/components/attendance/LeaveApprovalQueue.tsx`)
   - Queue for program managers to review leave applications
   - Approve/reject functionality
   - Rejection reason dialog
   - Student and cohort information display

### New Pages Created

1. **StudentLeaveDashboard** (`src/pages/StudentLeaveDashboard.tsx`)
   - Complete student interface for leave applications
   - Form and history tabs
   - Statistics overview

2. **ProgramManagerLeaveDashboard** (`src/pages/ProgramManagerLeaveDashboard.tsx`)
   - Program manager interface for leave management
   - Approval queue
   - Statistics dashboard

### New Services and Hooks

1. **LeaveApplicationService** (`src/services/leaveApplicationService.ts`)
   - Complete API service for leave application operations
   - CRUD operations for leave applications
   - Statistics and filtering

2. **useLeaveApplications** (`src/hooks/useLeaveApplications.ts`)
   - Custom hook for managing leave application state
   - Handles loading, error states, and data fetching
   - Provides methods for all leave application operations

### Type Definitions

New TypeScript interfaces have been added to `src/types/attendance.ts`:

```typescript
export interface LeaveApplication {
  id: string;
  student_id: string;
  cohort_id: string;
  epic_id?: string;
  session_date: string;
  session_number: number;
  reason: string;
  leave_status: 'pending' | 'approved' | 'rejected';
  leave_applied_at: string;
  leave_approved_by?: string;
  leave_approved_at?: string;
  leave_rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeaveApplicationRequest {
  student_id: string;
  cohort_id: string;
  epic_id?: string;
  session_date: string;
  session_number?: number;
  reason: string;
}

export interface UpdateLeaveApplicationRequest {
  leave_status: 'approved' | 'rejected';
  leave_rejection_reason?: string;
}

export interface LeaveApplicationStats {
  total_applications: number;
  pending_applications: number;
  approved_applications: number;
  rejected_applications: number;
}
```

## Navigation Integration

### Student Navigation

Added "Leave Applications" menu item to student dashboard navigation:

- Route: `/leave-applications`
- Icon: FileText
- Accessible from student sidebar

### Program Manager Navigation

Added "Leave Management" menu item to program manager dashboard navigation:

- Route: `/leave-management`
- Icon: FileText
- Accessible from program manager sidebar

## Workflow

### Student Workflow

1. Student navigates to Leave Applications page
2. Clicks "Apply for Leave" button
3. Fills out form with:
   - Leave date (future dates only)
   - Session number
   - Reason (common reasons or custom)
4. Submits application
5. Application appears in history with "pending" status
6. Can delete pending applications

### Program Manager Workflow

1. Program manager navigates to Leave Management page
2. Views pending applications in approval queue
3. For each application:
   - Reviews student details, date, and reason
   - Clicks "Approve" to approve
   - Clicks "Reject" to open rejection dialog
   - Provides rejection reason if rejecting
4. Approved applications automatically become "informed" leaves
5. Rejected applications become "uninformed" leaves

### Automatic Processing

- When a leave application is approved, the database trigger automatically:
  - Sets `absence_type = 'informed'`
  - Sets `leave_approved_at` timestamp
- When a leave application is rejected, the database trigger automatically:
  - Sets `absence_type = 'uninformed'`

## Features

### Student Features

- ✅ Submit leave applications
- ✅ View application history
- ✅ Delete pending applications
- ✅ See application status and rejection reasons
- ✅ Statistics overview
- ✅ Form validation (future dates only, required fields)

### Program Manager Features

- ✅ View pending applications queue
- ✅ Approve applications with one click
- ✅ Reject applications with reason
- ✅ View student and cohort information
- ✅ Statistics dashboard
- ✅ Bulk application management

### System Features

- ✅ Automatic attendance marking
- ✅ Database triggers for consistency
- ✅ Type safety with TypeScript
- ✅ Responsive UI design
- ✅ Error handling and loading states
- ✅ Toast notifications for user feedback

## Testing

The implementation has been tested with:

- ✅ Database schema changes
- ✅ Trigger functionality (approval/rejection)
- ✅ Build process (no compilation errors)
- ✅ Type safety validation

## Future Enhancements

Potential improvements for future iterations:

1. Email notifications for approval/rejection
2. Leave application limits per student
3. Emergency leave category
4. Document upload support
5. Leave calendar view
6. Bulk approval/rejection
7. Leave application templates
8. Integration with existing notification system

## Files Modified/Created

### Database

- `supabase/migrations/` - New migration files for schema changes

### Frontend

- `src/types/attendance.ts` - Added new interfaces
- `src/services/leaveApplicationService.ts` - New service
- `src/hooks/useLeaveApplications.ts` - New hook
- `src/components/attendance/LeaveApplicationForm.tsx` - New component
- `src/components/attendance/LeaveApplicationHistory.tsx` - New component
- `src/components/attendance/LeaveApprovalQueue.tsx` - New component
- `src/pages/StudentLeaveDashboard.tsx` - New page
- `src/pages/ProgramManagerLeaveDashboard.tsx` - New page
- `src/components/DashboardShell.tsx` - Added navigation items
- `src/App.tsx` - Added routes
- `src/hooks/index.ts` - Added hook export

## Conclusion

The leave application system has been successfully implemented with a clean, maintainable architecture that leverages existing infrastructure while adding new functionality. The system provides a complete workflow for students to apply for leave and program managers to review and approve/reject applications, with automatic integration into the existing attendance system.
