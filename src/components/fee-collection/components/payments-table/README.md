# Payments Table Components

This directory contains the refactored components for the payments table functionality, specifically the ActionsCell component which was broken down into smaller, more manageable pieces.

## Components

### ActionsCell.tsx
The main component that orchestrates all the payment action functionality. It uses the `useActionsCell` hook for state management and renders smaller, focused components.

### ActionButtons.tsx
A focused component that renders the action buttons (View Details, View Transactions, Send Message) with the pending count badge.

### TransactionCard.tsx
A comprehensive component that displays individual transaction details including:
- Transaction metadata (amount, status, payment method)
- Partial payment context and indicators
- Transaction details (reference, bank info, UTR, dates, etc.)
- Proof documents
- Action buttons for verification

### TransactionsDialog.tsx
A dialog component that displays the list of transactions for a student, including loading states and empty states.

### RejectionDialog.tsx
A focused dialog for handling payment rejections with reason input.

### ResetConfirmationDialog.tsx
A confirmation dialog for resetting payment status to pending.

## Hooks

### useActionsCell.ts
A custom hook that encapsulates all the state management and business logic for the ActionsCell component, including:
- Transaction fetching and management
- Payment verification logic
- Partial payment calculations
- Dialog state management

## Utils

### partialPaymentUtils.ts
Utility functions for analyzing partial payment contexts and determining payment relationships.

## Benefits of Refactoring

1. **Separation of Concerns**: Each component now has a single, clear responsibility
2. **Reusability**: Components can be reused in other parts of the application
3. **Maintainability**: Easier to locate and fix issues in specific functionality
4. **Testability**: Smaller components are easier to unit test
5. **Readability**: Code is more organized and easier to understand
6. **Performance**: Smaller components can be optimized independently

## File Structure

```
payments-table/
├── ActionsCell.tsx              # Main orchestrator component
├── ActionButtons.tsx            # Action buttons with badge
├── TransactionCard.tsx          # Individual transaction display
├── TransactionsDialog.tsx       # Transactions list dialog
├── RejectionDialog.tsx          # Rejection reason dialog
├── ResetConfirmationDialog.tsx  # Reset confirmation dialog
├── hooks/
│   └── useActionsCell.ts        # State management hook
├── utils/
│   └── partialPaymentUtils.ts   # Partial payment utilities
├── index.ts                     # Export file
└── README.md                    # This file
```

## Usage

The main entry point is the `ActionsCell` component, which can be used in table cells:

```tsx
import { ActionsCell } from './payments-table';

<ActionsCell
  student={student}
  onStudentSelect={handleStudentSelect}
  onVerificationUpdate={handleVerificationUpdate}
  onPendingCountUpdate={handlePendingCountUpdate}
  feeStructure={feeStructure}
/>
```

All other components are internal to the payments table functionality and are used by the main `ActionsCell` component.
