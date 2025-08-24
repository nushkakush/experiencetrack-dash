# Student Dashboard Components

This directory contains the refactored components for the student dashboard functionality, specifically the SemesterBreakdown component which was broken down into smaller, more manageable pieces.

## Components

### SemesterBreakdown.tsx
The main component that orchestrates all the semester breakdown functionality. It uses the `useSemesterBreakdown` hook for state management and renders smaller, focused components.

### AdmissionFeeCard.tsx
A focused component that displays the admission fee information, including:
- Admission fee amount display
- Status indicator (always "Paid")
- Consistent styling with green theme

### SemesterCard.tsx
A focused component that renders individual semester cards, including:
- Semester number and total amount display
- Completion status with appropriate icons
- Expandable/collapsible functionality
- Installment list rendering
- Complex status calculations for installments

### NoPaymentScheduleCard.tsx
A focused component for when no payment schedule is available, including:
- Informative message about payment plan selection

## Hooks

### hooks/useSemesterBreakdown.ts
A custom hook that encapsulates all the state management and business logic for the SemesterBreakdown component, including:
- Payment status calculations for one-shot and installment payments
- Currency formatting
- Semester completion checking
- One-shot payment installment creation
- Complex transaction-based status computation

## Benefits of Refactoring

1. **Separation of Concerns**: Each component now has a single, clear responsibility
2. **Reusability**: Components can be reused in other parts of the application
3. **Maintainability**: Easier to locate and fix issues in specific functionality
4. **Testability**: Smaller components are easier to unit test
5. **Readability**: Code is more organized and easier to understand
6. **Performance**: Smaller components can be optimized independently

## File Structure

```
student/components/
├── SemesterBreakdown.tsx                    # Main orchestrator component
├── AdmissionFeeCard.tsx                     # Admission fee display
├── SemesterCard.tsx                         # Individual semester card
├── NoPaymentScheduleCard.tsx                # No schedule state component
├── hooks/
│   └── useSemesterBreakdown.ts             # State management hook
├── index.ts                                # Export file
└── README.md                               # This file
```

## Usage

The main entry point is the `SemesterBreakdown` component, which can be used in student dashboard pages:

```tsx
import { SemesterBreakdown } from '@/pages/dashboards/student/components/SemesterBreakdown';

<SemesterBreakdown
  paymentBreakdown={paymentBreakdown}
  selectedPaymentPlan={selectedPaymentPlan}
  expandedSemesters={expandedSemesters}
  selectedInstallmentKey={selectedInstallmentKey}
  showPaymentForm={showPaymentForm}
  paymentSubmissions={paymentSubmissions}
  submittingPayments={submittingPayments}
  studentData={studentData}
  cohortData={cohortData}
  studentPayments={studentPayments}
  paymentTransactions={paymentTransactions}
  onToggleSemester={onToggleSemester}
  onInstallmentClick={onInstallmentClick}
  onPaymentSubmission={onPaymentSubmission}
/>
```

All other components are internal to the semester breakdown functionality and are used by the main `SemesterBreakdown` component.

## Refactoring Summary

### Before:
- One massive file with 605 lines
- Mixed concerns (UI, business logic, state management, complex calculations)
- Difficult to maintain and test

### After:
- **3 focused components** with clear responsibilities
- **1 custom hook** for state management
- **1 index file** for clean exports
- **1 README** for documentation

The refactored code maintains all the original functionality while being much more maintainable and following React best practices for component composition and separation of concerns.

## Complex Features Preserved

The refactoring successfully preserved all complex features:
- ✅ Payment status calculations for one-shot payments
- ✅ Payment status calculations for installment payments
- ✅ Transaction-based status computation
- ✅ Semester completion checking
- ✅ Expandable/collapsible semester cards
- ✅ Installment list rendering
- ✅ Currency formatting
- ✅ Complex date-based status logic
- ✅ Verification status handling
- ✅ Partial payment status handling
