# Feature Flags System

This document describes how to use the feature flags system for controlling feature visibility in the application.

## Student Payment Dashboard Feature Flag

The student payment dashboard navigation can be easily toggled on/off using the feature flag system.

### Feature Flag ID
- **ID**: `student-payment-dashboard`
- **Description**: Enable payment dashboard navigation for students
- **Default State**: Enabled (true)
- **Target Roles**: Student

### How to Toggle During Development

#### Method 1: Visual Debugger (Recommended)
1. In development mode, you'll see a floating feature flag debugger in the bottom-right corner
2. Click the toggle switch next to "Student Payment Dashboard"
3. The navigation will update immediately

#### Method 2: Browser Console
Open the browser console and use these commands:

```javascript
// Enable the student payment dashboard
featureFlags.enableStudentPaymentDashboard()

// Disable the student payment dashboard  
featureFlags.disableStudentPaymentDashboard()

// Toggle the current state
featureFlags.toggleStudentPaymentDashboard()

// Check current state
featureFlags.getStudentPaymentDashboardState()
```

#### Method 3: Direct API
```javascript
// Toggle any feature flag
featureFlags.toggle('student-payment-dashboard')

// Set specific state
featureFlags.set('student-payment-dashboard', true)  // Enable
featureFlags.set('student-payment-dashboard', false) // Disable

// List all flags
featureFlags.list()

// Show help
featureFlags.help()
```

### Before Deployment

**IMPORTANT**: Before deploying to production, make sure to disable the student payment dashboard feature flag:

```javascript
// In browser console during development
featureFlags.disableStudentPaymentDashboard()

// Or in the visual debugger, turn off the toggle
```

### Code Implementation

The feature flag is implemented in `src/components/DashboardShell.tsx`:

```typescript
// Check if student payment dashboard feature flag is enabled
const { isEnabled: showStudentPaymentDashboard } = useFeatureFlag('student-payment-dashboard', {
  defaultValue: false,
});

// Conditionally add navigation item
...(showStudentPaymentDashboard ? [{
  title: 'Fee Payment',
  onClick: () => navigate('/dashboard/fee-payment'),
  icon: CreditCard,
}] : []),
```

### Adding New Feature Flags

To add a new feature flag:

1. **Add to FeatureFlagService** (`src/lib/feature-flags/FeatureFlagService.ts`):
```typescript
{
  id: 'your-feature-id',
  name: 'Your Feature Name',
  description: 'Description of what this feature does',
  enabled: true, // or false
  rolloutPercentage: 100,
  targetRoles: ['student', 'admin'], // or undefined for all roles
}
```

2. **Use in components**:
```typescript
import { useFeatureFlag } from '@/lib/feature-flags/useFeatureFlag';

const { isEnabled } = useFeatureFlag('your-feature-id', {
  defaultValue: false,
});
```

3. **Add to debugger** (optional):
Update `src/components/debug/FeatureFlagDebugger.tsx` to include your new flag.

### Production Considerations

- Feature flags are only available in development mode by default
- For production feature flags, consider using a remote feature flag service
- Always test with feature flags disabled before deployment
- Document any feature flags that should be enabled/disabled in production

### Troubleshooting

**Feature flag not working?**
1. Check if you're in development mode (`NODE_ENV === 'development'`)
2. Verify the feature flag ID is correct
3. Check the browser console for any errors
4. Try refreshing the page after toggling the flag

**Debugger not showing?**
1. Ensure you're in development mode
2. Check if the component is properly imported in `App.tsx`
3. Look for any console errors
