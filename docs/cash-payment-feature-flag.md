# Cash Payment Feature Flag

## Overview

The cash payment feature flag (`cash-payment-disabled`) allows you to temporarily hide the cash payment method from both students and admins when they click "Record Payment".

## Feature Flag Details

- **Flag ID**: `cash-payment-disabled`
- **Name**: Cash Payment Disabled
- **Description**: Temporarily disable cash payment method for both students and admins
- **Default State**: Enabled (cash payments are hidden)
- **Target Roles**: `student`, `admin`, `super_admin`, `fee_collector`
- **Rollout Percentage**: 100% (affects all users)

## Implementation

### 1. Feature Flag Definition

The feature flag is defined in `src/lib/feature-flags/FeatureFlagService.ts`:

```typescript
{
  id: 'cash-payment-disabled',
  name: 'Cash Payment Disabled',
  description: 'Temporarily disable cash payment method for both students and admins',
  enabled: true,
  rolloutPercentage: 100,
  targetRoles: ['student', 'admin', 'super_admin', 'fee_collector'],
}
```

### 2. Components Updated

The following components have been updated to respect this feature flag:

#### Payment Method Selectors

- `src/components/common/payments/PaymentModeSelector.tsx` - Student payment method selector
- `src/domains/payments/components/AdminPaymentRecording/PaymentMethodSelector.tsx` - Admin payment method selector
- `src/pages/dashboards/student/components/PaymentPlanSelection.tsx` - Payment plan selection

#### Payment Method Configuration

- `src/types/payments/PaymentMethods.ts` - Payment method configuration and utilities
- `src/shared/components/Forms/FormBuilder.tsx` - Form builder payment configuration

#### Hooks

- `src/components/fee-collection/hooks/usePaymentMethodSelector.ts` - Payment method selector hook
- `src/pages/dashboards/student/hooks/usePaymentPlanManagement.ts` - Payment plan management hook

### 3. How It Works

When the feature flag is enabled (`enabled: true`):

1. **UI Components**: Cash payment options are filtered out from dropdowns and selection interfaces
2. **Configuration**: The `isPaymentMethodEnabled()` function returns `false` for cash payments
3. **Available Methods**: The `getAvailablePaymentMethods()` function excludes cash from the list
4. **Hooks**: Payment method hooks filter out cash from default payment methods

## Usage

### Enabling Cash Payments

To re-enable cash payments, set the feature flag to disabled:

```typescript
// In FeatureFlagService.ts
{
  id: 'cash-payment-disabled',
  enabled: false, // Change this to false
  // ... other properties
}
```

### Disabling Cash Payments

To disable cash payments (current state):

```typescript
// In FeatureFlagService.ts
{
  id: 'cash-payment-disabled',
  enabled: true, // Current state
  // ... other properties
}
```

### Runtime Control

You can also control the feature flag at runtime using the service methods:

```typescript
import { featureFlagService } from '@/lib/feature-flags/FeatureFlagService';

// Disable cash payments
featureFlagService.setFlagState('cash-payment-disabled', true);

// Enable cash payments
featureFlagService.setFlagState('cash-payment-disabled', false);
```

## Testing

### Manual Testing

1. **Student Side**:
   - Navigate to student payment dashboard
   - Try to record a payment
   - Verify that "Cash" option is not visible in payment method dropdown

2. **Admin Side**:
   - Navigate to admin payment recording interface
   - Try to record a payment for a student
   - Verify that "Cash" option is not visible in payment method selection

### Feature Flag Testing

You can test the feature flag behavior by toggling it:

```typescript
// In browser console or development tools
import { featureFlagService } from '@/lib/feature-flags/FeatureFlagService';

// Check current state
console.log(featureFlagService.isEnabled('cash-payment-disabled'));

// Toggle the flag
featureFlagService.toggleFlag('cash-payment-disabled');
```

## Rollback Plan

If you need to quickly re-enable cash payments:

1. **Immediate**: Set `enabled: false` in the feature flag definition
2. **Deploy**: The change will take effect after the next deployment
3. **No Code Changes**: No other code changes are required

## Future Enhancements

- Add date-based expiration to automatically re-enable cash payments
- Add role-based exceptions (e.g., allow cash for specific admin roles)
- Add gradual rollout capabilities for testing
- Add analytics to track usage patterns

## Related Files

- `src/lib/feature-flags/FeatureFlagService.ts` - Feature flag definition
- `src/lib/feature-flags/useFeatureFlag.ts` - React hook for feature flags
- `src/components/common/payments/PaymentModeSelector.tsx` - Student payment selector
- `src/domains/payments/components/AdminPaymentRecording/PaymentMethodSelector.tsx` - Admin payment selector
- `src/types/payments/PaymentMethods.ts` - Payment method configuration
