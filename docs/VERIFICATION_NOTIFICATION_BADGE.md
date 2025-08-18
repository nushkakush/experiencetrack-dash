# Verification Notification Badge

## Overview

The Fee Payment Dashboard now includes a notification badge that displays the number of pending payment verifications that require admin attention. This feature helps administrators quickly identify and prioritize payment verification tasks.

## Features

### Notification Badge

- **Location**: Top-right corner of the "Payments" tab header in the Fee Payment Dashboard
- **Display**: Shows a red badge with the count of pending verifications
- **Visibility**: Only appears when there are pending verifications (count > 0)
- **Format**: Shows the exact count, or "99+" if there are more than 99 pending verifications

### Functionality

- **Real-time Updates**: The badge count updates automatically when payments are verified
- **Click Action**: Clicking the badge refreshes the pending verification count
- **Visual Indicator**: Uses a document icon with a red notification badge overlay

## Technical Implementation

### Components

1. **VerificationBadge**: A reusable component that displays the notification badge
2. **usePendingVerifications**: A custom hook that manages the pending verification count
3. **PaymentTransactionService**: Service method to count pending verifications

### Database Query

The system counts payment transactions with `verification_status = 'verification_pending'` for the specific cohort:

```sql
SELECT COUNT(*)
FROM payment_transactions
WHERE verification_status = 'verification_pending'
AND payment_id IN (
  SELECT id FROM student_payments WHERE cohort_id = ?
)
```

### Integration Points

- **FeePaymentDashboard**: Main dashboard component that uses the hook
- **PaymentsTab**: Tab component that displays the badge
- **ActionsCell**: Table cell that triggers count refresh on verification

## Usage

### For Administrators

1. Navigate to the Fee Payment Dashboard for a specific cohort
2. Look for the red notification badge next to the "Payments" tab title
3. The number indicates how many payment verifications are pending
4. Click on the badge to refresh the count
5. Use the "View Transactions" button in the Actions column to review and verify payments

### For Developers

1. The badge automatically appears when there are pending verifications
2. The count refreshes automatically when payments are verified
3. The badge is responsive and works on all screen sizes
4. The component is reusable and can be used in other parts of the application

## Styling

The notification badge uses the following design:

- **Background**: Red (`destructive` variant)
- **Text**: White, bold, small font
- **Position**: Absolute positioning over the document icon
- **Size**: 24x24px (h-6 w-6)
- **Border Radius**: Fully rounded (rounded-full)
- **Hover Effect**: Slightly darker red on hover

## Future Enhancements

Potential improvements for the notification badge:

1. **Real-time Updates**: WebSocket integration for live count updates
2. **Sound Notifications**: Audio alerts for new pending verifications
3. **Email Notifications**: Automated email alerts for admins
4. **Priority Levels**: Different colors for different verification priorities
5. **Filtering**: Ability to filter by verification type or amount
6. **Bulk Actions**: Select and verify multiple payments at once

## Testing

The feature includes unit tests for:

- Service method functionality
- Error handling
- Count accuracy
- Component rendering
- Hook behavior

Run tests with:

```bash
npm run test
```
