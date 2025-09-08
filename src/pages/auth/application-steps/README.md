# Application Steps - Modular Components

This directory contains the modularized components for the application step form, breaking down the large `ApplicationStep.tsx` into smaller, focused components.

## Structure

### Main Component

- **`ApplicationStep.tsx`** - Main component that orchestrates all sections and handles form state management

### Section Components

- **`PersonalInformationSection.tsx`** - Handles personal information fields (name, contact, address, etc.)
- **`EducationInformationSection.tsx`** - Manages education details and work experience
- **`ParentalInformationSection.tsx`** - Handles parental information and financial aid
- **`EmergencyContactSection.tsx`** - Manages emergency contact details

### Shared Resources

- **`types.ts`** - Shared TypeScript interfaces and constants
- **`index.ts`** - Barrel export file for easy imports

## Benefits of Modularization

1. **Maintainability** - Each section is focused on a specific area of the form
2. **Reusability** - Components can be reused in other parts of the application
3. **Testability** - Smaller components are easier to unit test
4. **Readability** - Code is more organized and easier to understand
5. **Performance** - Smaller components can be optimized individually

## Usage

```tsx
import { ApplicationStep } from './application-steps';

// Use the main component
<ApplicationStep
  data={applicationData}
  profileId={profileId}
  onComplete={handleComplete}
  onSave={handleSave}
  saving={isSaving}
/>;
```

## Component Props

All section components share the same props interface (`SectionProps`):

```tsx
interface SectionProps {
  formData: FormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: any) => void;
  onInputBlur: (field: string) => void;
  onDateOfBirthChange: (field: 'day' | 'month' | 'year', value: string) => void;
  onVerifyContact: () => void;
  isVerifying: boolean;
  getError: (field: string) => string;
}
```

This ensures consistency across all sections and makes the components easy to use and maintain.
