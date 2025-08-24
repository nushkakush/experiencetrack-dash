# Avatar System Documentation

## Overview

The avatar system provides a consistent way to display user and student profile pictures throughout the LIT OS application. When no avatar is available, the system automatically falls back to displaying user initials.

## Components

### UserAvatar Component

The main reusable component for displaying avatars:

```tsx
import { UserAvatar } from '@/components/ui/UserAvatar';

<UserAvatar
  avatarUrl={user.avatar_url}
  name={user.name}
  size="md"
  className="custom-class"
/>
```

#### Props

- `avatarUrl?: string | null` - URL of the avatar image
- `name: string` - User/student name for initials fallback
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Avatar size (default: 'md')
- `className?: string` - Additional CSS classes

#### Sizes

- `sm`: 24x24px (h-6 w-6)
- `md`: 32x32px (h-8 w-8) 
- `lg`: 48x48px (h-12 w-12)
- `xl`: 64x64px (h-16 w-16)

### ProfileAvatarUpload Component

Interactive avatar upload component for user profiles:

```tsx
import ProfileAvatarUpload from '@/components/ui/ProfileAvatarUpload';

<ProfileAvatarUpload
  userId={profile.user_id}
  currentAvatarUrl={profile.avatar_url}
  userName={userName}
  onAvatarUpdated={handleAvatarUpdated}
  disabled={!isEditing}
  size="lg"
/>
```

## Implementation Locations

### Phase 1: High Priority Components ✅

1. **Dashboard Shell** (`src/components/DashboardShell.tsx`)
   - User profile avatar in top-right navigation
   - Shows user's profile picture or initials

2. **Fee Collection Tables** (`src/components/fee-collection/components/payments-table/StudentNameCell.tsx`)
   - Student avatars in payment tables
   - Integrated with existing student name display

3. **Attendance Leaderboards** 
   - Grid Layout (`src/components/attendance/leaderboard/layouts/GridLayout.tsx`)
   - Table Layout (`src/components/attendance/leaderboard/layouts/TableLayout.tsx`)
   - Student avatars in both grid and table views

4. **Cohort Students Table** (`src/domains/cohorts/components/CohortStudentsTable/StudentTableRow.tsx`)
   - Student avatars in cohort management tables

5. **User Management Table** (`src/pages/user-management/components/UserTable.tsx`)
   - User avatars in admin user management

6. **Payment Recording Forms** (`src/domains/payments/components/AdminPaymentRecording/PaymentRecordingForm.tsx`)
   - Student avatars in payment recording interfaces

7. **Payment Summary** (`src/domains/payments/components/AdminPaymentRecording/PaymentSummary.tsx`)
   - Student avatars in payment summaries

8. **Student Payment Details** (`src/pages/StudentPaymentDetails/components/PaymentHeader.tsx`)
   - Student avatars in payment detail headers

### Phase 2: Medium Priority Components ✅

1. **Payment Approval Dialogs**
   - Partial Approval Dialog (`src/components/common/payments/PartialApprovalDialog.tsx`)
   - Simple Partial Approval Dialog (`src/components/common/payments/SimplePartialApprovalDialog.tsx`)

2. **Payment Recording Dialogs** (`src/domains/payments/components/AdminPaymentRecording/AdminPaymentRecordingDialog.tsx`)
   - Student avatars in payment recording dialogs

3. **Payment Plan Dialogs** (`src/domains/payments/components/PaymentPlan/PaymentPlanDialog.tsx`)
   - Student avatars in payment plan management

### Phase 3: Low Priority Components ✅

1. **User Invitation Page** (`src/pages/UserInvitationPage.tsx`)
   - Placeholder avatar for invited users

2. **Student Details Dialog Header** (`src/components/fee-collection/components/student-details/DialogHeader.tsx`)
   - Student avatars in dialog headers

3. **Transactions Dialog** (`src/components/fee-collection/components/payments-table/TransactionsDialog.tsx`)
   - Student avatars in transaction review dialogs

## Database Schema

### Profiles Table

```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON public.profiles (avatar_url);
```

### UserProfile Interface

```typescript
export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  email: string | null;
  avatar_url: string | null; // Avatar URL for user profile
  created_at: string;
  updated_at: string;
}
```

### Single Avatar System

The avatar system uses **only the `profiles.avatar_url` field** for all users and students. This eliminates the need for synchronization between multiple tables and ensures consistency across the application.

## Avatar Service

The `AvatarService` handles avatar upload, deletion, and URL generation:

```typescript
// Upload avatar
const result = await AvatarService.uploadAvatar(userId, file);

// Get optimized avatar URL
const avatarUrl = AvatarService.getAvatarUrl(fileName, {
  width: 48,
  height: 48,
  quality: 80
});

// Delete avatar
const result = await AvatarService.deleteAvatar(fileName);
```

## File Storage

Avatars are stored in Supabase Storage under the `avatars` bucket with the following structure:

- **File naming**: `{userId}-{timestamp}.{extension}`
- **Supported formats**: JPEG, PNG, WebP, GIF
- **Size limit**: 5MB per file
- **Optimization**: Automatic image optimization with width/height/quality parameters
- **Single source**: All avatars are stored and referenced from the `profiles.avatar_url` field

## Usage Guidelines

### When to Use Avatars

1. **User Identification**: Anywhere user/student names are displayed
2. **Navigation**: User profile in dashboard shell
3. **Tables and Lists**: Student/user tables and lists
4. **Dialogs**: Payment, approval, and management dialogs
5. **Leaderboards**: Student rankings and statistics

### Best Practices

1. **Consistent Sizing**: Use appropriate sizes for different contexts
2. **Fallback Handling**: Always provide a name for initials fallback
3. **Loading States**: Show loading indicators during avatar operations
4. **Error Handling**: Gracefully handle avatar loading failures
5. **Accessibility**: Include proper alt text and ARIA labels

### Performance Considerations

1. **Image Optimization**: Use AvatarService for optimized URLs
2. **Lazy Loading**: Avatars load on demand
3. **Caching**: Supabase Storage provides CDN caching
4. **Size Limits**: Enforce 5MB file size limit

## Migration Guide

### Adding Avatars to New Components

1. Import the UserAvatar component:
   ```tsx
   import { UserAvatar } from '@/components/ui/UserAvatar';
   ```

2. Add avatar display:
   ```tsx
   <UserAvatar
     avatarUrl={user.avatar_url}
     name={`${user.first_name} ${user.last_name}`}
     size="md"
   />
   ```

3. Update interfaces to include avatar_url:
   ```typescript
   interface UserData {
     avatar_url?: string | null;
     // ... other fields
   }
   ```

### Updating Existing Components

1. Replace static avatar displays with UserAvatar component
2. Update component interfaces to include avatar_url
3. Pass avatar data from parent components
4. Test fallback behavior with null avatar URLs

## Troubleshooting

### Common Issues

1. **Avatar not displaying**: Check if avatar_url is properly passed
2. **Incorrect initials**: Ensure name prop is correctly formatted
3. **Loading issues**: Verify AvatarService configuration
4. **Size problems**: Check size prop and CSS classes

### Debug Steps

1. Check browser console for errors
2. Verify avatar_url in component props
3. Test with null avatar_url for fallback behavior
4. Check Supabase Storage permissions

## Future Enhancements

1. **Avatar Cropping**: Enhanced image cropping interface
2. **Multiple Sizes**: Automatic generation of multiple avatar sizes
3. **Avatar Groups**: Support for displaying multiple avatars
4. **Custom Themes**: Theme-aware avatar styling
5. **Animation**: Smooth avatar loading animations
