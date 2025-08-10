
# Feature Permission System Documentation

## Overview

The Feature Permission System provides a scalable and maintainable way to control access to features based on user roles. It's designed to be:

- **Scalable**: Easy to add new features and roles
- **Maintainable**: Centralized configuration and clear separation of concerns
- **Type-safe**: Full TypeScript support with compile-time checking
- **Performance-optimized**: Memoized permission checks and efficient lookups
- **Developer-friendly**: Simple APIs and comprehensive debugging tools

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Feature Permission System                │
├─────────────────────────────────────────────────────────────┤
│  Types & Interfaces                                         │
│  ├── FeatureKey (string union of all features)             │
│  ├── FeatureMetadata (feature descriptions)                │
│  ├── RolePermissions (role-to-features mapping)            │
│  └── PermissionCheck (permission check results)            │
├─────────────────────────────────────────────────────────────┤
│  Configuration                                              │
│  ├── FEATURE_METADATA (all feature definitions)            │
│  ├── ROLE_PERMISSIONS (role-based permissions)             │
│  └── FEATURE_GROUPS (organized feature categories)         │
├─────────────────────────────────────────────────────────────┤
│  Core Hook                                                  │
│  └── useFeaturePermissions()                               │
├─────────────────────────────────────────────────────────────┤
│  Components                                                 │
│  ├── FeatureGate (conditional rendering)                   │
│  ├── FeatureProtectedRoute (route protection)              │
│  └── FeaturePermissionDebug (development tools)            │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Basic Permission Check

```tsx
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';

const MyComponent = () => {
  const { hasPermission } = useFeaturePermissions();
  
  if (hasPermission('cohorts.create')) {
    return <CreateCohortButton />;
  }
  
  return <AccessDeniedMessage />;
};
```

### 2. Using FeatureGate Component

```tsx
import { CohortFeatureGate } from '@/components/common';

const CohortsPage = () => {
  return (
    <div>
      <h1>Cohorts</h1>
      
      <CohortFeatureGate action="create">
        <Button>Create New Cohort</Button>
      </CohortFeatureGate>
      
      <CohortFeatureGate action="edit">
        <Button>Edit Cohort</Button>
      </CohortFeatureGate>
    </div>
  );
};
```

### 3. Route Protection

```tsx
import { CohortManagementProtectedRoute } from '@/components/common';

const App = () => {
  return (
    <Routes>
      <Route 
        path="/cohorts" 
        element={
          <CohortManagementProtectedRoute>
            <CohortsPage />
          </CohortManagementProtectedRoute>
        } 
      />
    </Routes>
  );
};
```

## Core Concepts

### Feature Keys

Features are identified by string keys following the pattern `{category}.{action}`:

```typescript
type FeatureKey = 
  | 'cohorts.view'
  | 'cohorts.create'
  | 'cohorts.edit'
  | 'cohorts.delete'
  | 'attendance.mark'
  | 'fees.collect'
  // ... and many more
```

### Feature Categories

Features are organized into categories:

- **cohorts**: Cohort management features
- **attendance**: Attendance tracking features
- **fees**: Fee collection and management
- **users**: User management features
- **system**: System administration
- **partnerships**: Partnership management
- **placements**: Placement management
- **holidays**: Holiday management
- **student**: Student-specific features

### User Roles

The system supports 6 user roles:

- `student`: Basic student access
- `program_manager`: Program management capabilities
- `fee_collector`: Fee collection capabilities
- `partnerships_head`: Partnership management
- `placement_coordinator`: Placement management
- `super_admin`: Full system access

## API Reference

### useFeaturePermissions Hook

The main hook that provides all permission checking functionality.

```typescript
const {
  // Core permission checking
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  checkPermissions,
  
  // Role-based helpers
  canManageCohorts,
  canManageAttendance,
  canManageFees,
  canManageUsers,
  canAccessSystem,
  
  // Feature-specific helpers
  canViewCohorts,
  canCreateCohorts,
  canEditCohorts,
  canDeleteCohorts,
  
  // Utility functions
  getRolePermissions,
  getFeatureMetadata,
  isFeatureDeprecated,
  isFeatureExperimental,
} = useFeaturePermissions();
```

#### Core Methods

- `hasPermission(feature: FeatureKey): boolean` - Check if user has a specific permission
- `hasAnyPermission(features: FeatureKey[]): boolean` - Check if user has any of the specified permissions
- `hasAllPermissions(features: FeatureKey[]): boolean` - Check if user has all specified permissions
- `checkPermissions(features: FeatureKey[]): PermissionCheck[]` - Get detailed permission check results

#### Role-based Helpers

These provide quick access to common permission combinations:

- `canManageCohorts` - Can create, edit, or delete cohorts
- `canManageAttendance` - Can mark, edit, or delete attendance
- `canManageFees` - Can collect, waive, or refund fees
- `canManageUsers` - Can create, edit, or delete users
- `canAccessSystem` - Can access system settings or analytics

### FeatureGate Component

Conditionally renders content based on feature permissions.

```tsx
<FeatureGate 
  feature="cohorts.create"
  fallback={<p>No permission to create cohorts</p>}
>
  <CreateCohortButton />
</FeatureGate>

// Multiple features
<FeatureGate 
  features={['cohorts.view', 'cohorts.edit']}
  requireAll={false} // Show if user has ANY of the permissions
  fallback={<p>No cohort permissions</p>}
>
  <CohortManagementPanel />
</FeatureGate>
```

#### Specialized FeatureGate Components

For convenience, there are specialized components for each category:

```tsx
<CohortFeatureGate action="create">
  <Button>Create Cohort</Button>
</CohortFeatureGate>

<AttendanceFeatureGate action="mark">
  <Button>Mark Attendance</Button>
</AttendanceFeatureGate>

<FeeFeatureGate action="collect">
  <Button>Collect Fees</Button>
</FeeFeatureGate>
```

### FeatureProtectedRoute Component

Enhanced route protection with feature-based access control.

```tsx
// Role-based protection
<FeatureProtectedRoute allowedRoles={['super_admin', 'program_manager']}>
  <AdminPanel />
</FeatureProtectedRoute>

// Feature-based protection
<FeatureProtectedRoute requiredFeatures={['cohorts.create', 'cohorts.edit']}>
  <CohortManager />
</FeatureProtectedRoute>

// Combined protection
<FeatureProtectedRoute 
  allowedRoles={['super_admin']}
  requiredFeatures={['system.settings']}
  requireAllFeatures={true}
>
  <SystemSettings />
</FeatureProtectedRoute>
```

#### Convenience Components

- `AdminProtectedRoute` - Protects routes for admin users
- `SuperAdminProtectedRoute` - Protects routes for super admins only
- `CohortManagementProtectedRoute` - Protects cohort management routes
- `FeeManagementProtectedRoute` - Protects fee management routes
- `AttendanceManagementProtectedRoute` - Protects attendance management routes

## Configuration

### Adding New Features

1. **Add the feature key** to the `FeatureKey` type in `src/types/features.ts`:

```typescript
export type FeatureKey = 
  // ... existing features
  | 'new_feature.view'
  | 'new_feature.create'
  | 'new_feature.edit';
```

2. **Add feature metadata** in `src/config/featurePermissions.ts`:

```typescript
export const FEATURE_METADATA: Record<FeatureKey, FeatureMetadata> = {
  // ... existing features
  'new_feature.view': {
    key: 'new_feature.view',
    name: 'View New Feature',
    description: 'View new feature information',
    category: 'new_feature',
    requiresAuthentication: true,
  },
  'new_feature.create': {
    key: 'new_feature.create',
    name: 'Create New Feature',
    description: 'Create new feature items',
    category: 'new_feature',
    requiresAuthentication: true,
  },
};
```

3. **Assign permissions to roles** in the same file:

```typescript
export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'program_manager',
    features: [
      // ... existing features
      'new_feature.view',
      'new_feature.create',
    ],
  },
  // ... other roles
];
```

4. **Add to feature groups** (optional):

```typescript
export const FEATURE_GROUPS: FeatureGroup[] = [
  // ... existing groups
  {
    name: 'New Feature Management',
    description: 'Manage new feature functionality',
    category: 'new_feature',
    features: [
      'new_feature.view',
      'new_feature.create',
      'new_feature.edit',
    ],
  },
];
```

### Adding New Roles

1. **Add the role** to the `UserRole` type in `src/types/auth.ts`:

```typescript
export type UserRole = 
  // ... existing roles
  | 'new_role';
```

2. **Add role permissions** in `src/config/featurePermissions.ts`:

```typescript
export const ROLE_PERMISSIONS: RolePermissions[] = [
  // ... existing roles
  {
    role: 'new_role',
    features: [
      'cohorts.view',
      'attendance.view',
      // ... other permissions
    ],
  },
];
```

3. **Update database enum** (if needed):

```sql
ALTER TYPE public.user_role ADD VALUE 'new_role';
```

## Best Practices

### 1. Use Feature Gates for UI Elements

```tsx
// ✅ Good - Use FeatureGate for conditional rendering
<CohortFeatureGate action="create">
  <Button>Create Cohort</Button>
</CohortFeatureGate>

// ❌ Avoid - Manual permission checks in components
{hasPermission('cohorts.create') && <Button>Create Cohort</Button>}
```

### 2. Use Protected Routes for Page Access

```tsx
// ✅ Good - Use FeatureProtectedRoute for route protection
<FeatureProtectedRoute requiredFeatures={['cohorts.view']}>
  <CohortsPage />
</FeatureProtectedRoute>

// ❌ Avoid - Manual permission checks in page components
const CohortsPage = () => {
  if (!hasPermission('cohorts.view')) {
    return <AccessDenied />;
  }
  // ...
};
```

### 3. Use Role-based Helpers for Common Patterns

```tsx
// ✅ Good - Use role-based helpers
if (canManageCohorts) {
  // Show cohort management UI
}

// ❌ Avoid - Manual permission combinations
if (hasAnyPermission(['cohorts.create', 'cohorts.edit', 'cohorts.delete'])) {
  // Show cohort management UI
}
```

### 4. Group Related Permissions

```tsx
// ✅ Good - Group related permissions
const canManageAttendance = hasAnyPermission([
  'attendance.mark',
  'attendance.edit',
  'attendance.delete',
  'attendance.export'
]);

// ❌ Avoid - Scattered permission checks
const canMarkAttendance = hasPermission('attendance.mark');
const canEditAttendance = hasPermission('attendance.edit');
// ... etc
```

### 5. Use Fallbacks for Better UX

```tsx
// ✅ Good - Provide meaningful fallbacks
<CohortFeatureGate 
  action="create"
  fallback={<p>Contact your administrator to create cohorts</p>}
>
  <CreateCohortButton />
</CohortFeatureGate>

// ❌ Avoid - Empty fallbacks
<CohortFeatureGate action="create">
  <CreateCohortButton />
</CohortFeatureGate>
```

## Debugging

### Development Debug Panel

The `FeaturePermissionDebug` component provides a comprehensive debugging interface:

```tsx
import { FeaturePermissionDebug } from '@/components/common';

const MyComponent = () => {
  const [showDebug, setShowDebug] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setShowDebug(true)}>
        Debug Permissions
      </Button>
      
      <FeaturePermissionDebug 
        show={showDebug} 
        onClose={() => setShowDebug(false)} 
      />
    </div>
  );
};
```

The debug panel includes:
- Current user information and permissions
- Role-based capabilities overview
- All features with permission status
- Feature groups organization
- Permission testing tools
- Export/copy functionality

### Console Logging

For quick debugging, you can log permissions:

```tsx
const { getRolePermissions, hasPermission } = useFeaturePermissions();

console.log('User permissions:', getRolePermissions());
console.log('Can create cohorts:', hasPermission('cohorts.create'));
```

## Performance Considerations

### Memoization

The `useFeaturePermissions` hook uses `useMemo` to optimize performance:

- Role permissions are memoized based on user role
- Permission sets are memoized for O(1) lookups
- All computed values are memoized to prevent unnecessary recalculations

### Efficient Permission Checks

- Use `Set` for O(1) permission lookups
- Batch permission checks when possible
- Use role-based helpers for common patterns

### Lazy Loading

Consider lazy loading permission-heavy components:

```tsx
const AdminPanel = lazy(() => import('./AdminPanel'));

<FeatureProtectedRoute requiredFeatures={['system.settings']}>
  <Suspense fallback={<LoadingSpinner />}>
    <AdminPanel />
  </Suspense>
</FeatureProtectedRoute>
```

## Testing

### Unit Testing Permissions

```tsx
import { renderHook } from '@testing-library/react';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';

// Mock the auth context
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { role: 'program_manager' }
  })
}));

test('program manager can manage cohorts', () => {
  const { result } = renderHook(() => useFeaturePermissions());
  
  expect(result.current.canManageCohorts).toBe(true);
  expect(result.current.hasPermission('cohorts.create')).toBe(true);
});
```

### Component Testing

```tsx
import { render, screen } from '@testing-library/react';
import { CohortFeatureGate } from '@/components/common';

test('shows create button for users with permission', () => {
  // Mock permissions
  jest.mock('@/hooks/useFeaturePermissions', () => ({
    useFeaturePermissions: () => ({
      hasPermission: (feature: string) => feature === 'cohorts.create'
    })
  }));
  
  render(
    <CohortFeatureGate action="create">
      <button>Create Cohort</button>
    </CohortFeatureGate>
  );
  
  expect(screen.getByText('Create Cohort')).toBeInTheDocument();
});
```

## Migration Guide

### From Manual Permission Checks

If you're migrating from manual permission checks:

1. **Replace manual checks with FeatureGate**:

```tsx
// Before
{profile?.role === 'super_admin' && <AdminButton />}

// After
<FeatureGate feature="system.settings">
  <AdminButton />
</FeatureGate>
```

2. **Replace route checks with FeatureProtectedRoute**:

```tsx
// Before
const ProtectedPage = () => {
  if (!hasPermission('cohorts.view')) {
    return <AccessDenied />;
  }
  return <PageContent />;
};

// After
<FeatureProtectedRoute requiredFeatures={['cohorts.view']}>
  <PageContent />
</FeatureProtectedRoute>
```

3. **Use role-based helpers**:

```tsx
// Before
const canManageCohorts = profile?.role === 'super_admin' || profile?.role === 'program_manager';

// After
const { canManageCohorts } = useFeaturePermissions();
```

## Troubleshooting

### Common Issues

1. **Permission not working**
   - Check if the feature is defined in `FEATURE_METADATA`
   - Verify the role has the permission in `ROLE_PERMISSIONS`
   - Use the debug panel to verify current permissions

2. **TypeScript errors**
   - Ensure feature keys are added to the `FeatureKey` type
   - Check that all imports are correct
   - Verify component props match the expected types

3. **Performance issues**
   - Use role-based helpers instead of multiple `hasPermission` calls
   - Consider memoizing components that use permission checks
   - Use the debug panel to identify slow permission checks

### Getting Help

1. Use the `FeaturePermissionDebug` component to inspect current permissions
2. Check the console for any error messages
3. Verify the configuration in `src/config/featurePermissions.ts`
4. Test with different user roles to isolate the issue

## Future Enhancements

### Planned Features

- **Permission inheritance**: Allow roles to inherit permissions from other roles
- **Dynamic permissions**: Runtime permission changes without code deployment
- **Permission analytics**: Track permission usage and effectiveness
- **Advanced conditions**: Time-based or context-based permissions
- **Permission caching**: Server-side permission caching for better performance

### Extension Points

The system is designed to be extensible:

- Add new feature categories by extending the `FeatureKey` type
- Create custom permission checkers by extending the hook
- Build specialized components for your domain
- Integrate with external permission systems

---

For more information, see the example component at `src/components/examples/FeaturePermissionExample.tsx` or use the debug panel in development mode.