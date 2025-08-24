# Cohorts Components

This directory contains the refactored components for the cohorts functionality, specifically the CohortStudentsTable component which was broken down into smaller, more manageable pieces.

## Components

### CohortStudentsTable.tsx
The main component that orchestrates all the cohort students table functionality. It uses the `useCohortStudentsTable` hook for state management and renders smaller, focused components.

### components/StudentFilters.tsx
A focused component that handles search and filtering functionality:
- Search input with icon
- Filter toggle button
- Status, scholarship, and payment plan filters
- Clear filters functionality

### components/StudentTableRow.tsx
A component that renders individual student table rows, including:
- Student information display
- Status badges
- Scholarship and payment plan cells
- Action buttons

### components/ScholarshipCell.tsx
A focused component for the scholarship column that displays:
- Scholarship assignment status
- Scholarship details (name, percentage)
- Assignment/editing button

### components/PaymentPlanCell.tsx
A focused component for the payment plan column that displays:
- Payment plan assignment status
- Payment plan details
- Assignment/editing button

### components/StudentActions.tsx
A component that renders action buttons for each student:
- Edit student dialog
- Send/resend invitation
- Mark as dropped out
- Delete student

### components/EmailConfirmationDialog.tsx
A focused dialog for confirming email invitations with:
- Dynamic title based on invitation status
- Confirmation message
- Action buttons

## Hooks

### hooks/useCohortStudentsTable.ts
A custom hook that encapsulates all the state management and business logic for the CohortStudentsTable component, including:
- Search and filter state management
- Student data loading and management
- Scholarship and payment plan assignments
- Email invitation handling
- Student deletion and dropout management
- Fee setup completion checking

## Benefits of Refactoring

1. **Separation of Concerns**: Each component now has a single, clear responsibility
2. **Reusability**: Components can be reused in other parts of the application
3. **Maintainability**: Easier to locate and fix issues in specific functionality
4. **Testability**: Smaller components are easier to unit test
5. **Readability**: Code is more organized and easier to understand
6. **Performance**: Smaller components can be optimized independently

## File Structure

```
cohorts/
├── CohortStudentsTable.tsx              # Main orchestrator component
├── components/
│   ├── StudentFilters.tsx               # Search and filter functionality
│   ├── StudentTableRow.tsx              # Individual student row
│   ├── ScholarshipCell.tsx              # Scholarship column
│   ├── PaymentPlanCell.tsx              # Payment plan column
│   ├── StudentActions.tsx               # Action buttons
│   ├── EmailConfirmationDialog.tsx      # Email confirmation dialog
│   └── index.ts                         # Export file
├── hooks/
│   └── useCohortStudentsTable.ts        # State management hook
└── README.md                            # This file
```

## Usage

The main entry point is the `CohortStudentsTable` component, which can be used in cohort management pages:

```tsx
import CohortStudentsTable from '@/components/cohorts/CohortStudentsTable';

<CohortStudentsTable
  students={students}
  scholarships={scholarships}
  onStudentDeleted={handleStudentDeleted}
  onStudentUpdated={handleStudentUpdated}
  loading={loading}
  cohortName={cohortName}
/>
```

All other components are internal to the cohorts functionality and are used by the main `CohortStudentsTable` component.

## Refactoring Summary

### Before:
- One massive file with 1,043 lines
- Mixed concerns (UI, business logic, state management)
- Difficult to maintain and test

### After:
- **7 focused components** with clear responsibilities
- **1 custom hook** for state management
- **1 index file** for clean exports
- **1 README** for documentation

The refactored code maintains all the original functionality while being much more maintainable and following React best practices for component composition and separation of concerns.
