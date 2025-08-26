# Payment Breakdown Consistency

## Problem

The payment breakdown was showing different values and formatting between the student side and admin side when recording payments. This was causing confusion and potential discrepancies.

The root cause was that the admin side was missing several critical parameters when calling the payment engine:

- **Scholarship ID** - Student's scholarship information
- **Additional Discount Percentage** - Extra discount from student scholarship
- **Program Fee Includes GST** - Whether GST is included in program fee
- **Equal Scholarship Distribution** - Whether to distribute scholarship equally

## Solution

1. **Created a shared `SharedPaymentBreakdown` component** that both student and admin sides use to ensure consistent display formatting.

2. **Fixed the admin side calculation** to include all the same parameters as the student side when calling the payment engine.

## Changes Made

### 1. Created Shared Component

- **File**: `src/components/common/payments/SharedPaymentBreakdown.tsx`
- **Purpose**: Single source of truth for payment breakdown display
- **Features**:
  - Consistent formatting (Base Fee → One-shot Discount → GST → Scholarship Waiver → Total)
  - Consistent styling (green for discounts, red for scholarships, blue for total)
  - Configurable variants (compact/detailed)
  - Optional title display

### 2. Updated Admin Side

- **File**: `src/components/fee-collection/components/student-details/PaymentBreakdownCard.tsx`
- **Change**: Replaced custom breakdown display with `SharedPaymentBreakdown` component
- **UI Improvements**:
  - Removed card border and extra padding for cleaner look
  - Simplified title to "Fee Breakup" instead of verbose payment type breakdown
  - Streamlined layout with better spacing
- **Result**: Admin side now shows the same breakdown format as student side with improved UI

### 3. Fixed Admin Side Calculation

- **File**: `src/components/fee-collection/components/student-details/hooks/useAdminPaymentRecording.ts`
- **Changes**:
  - Added scholarship data fetching using `studentScholarshipsService.getByStudent()`
  - Added missing parameters to payment engine call:
    - `scholarshipId` - Student's scholarship ID
    - `additionalDiscountPercentage` - Additional discount from student scholarship
    - `program_fee_includes_gst` - Whether program fee includes GST
    - `equal_scholarship_distribution` - Whether to distribute scholarship equally
  - **Fixed infinite re-rendering loop** by removing circular dependency between scholarship fetching and payment breakdown calculation
- **Result**: Admin side now uses identical calculation logic as student side, and performance issues are resolved

### 4. Updated Student Side

- **File**: `src/pages/dashboards/student/components/FeeBreakdown.tsx`
- **Change**: Refactored to use `SharedPaymentBreakdown` component
- **Result**: Student side maintains same display but now uses shared component

## Benefits

1. **Consistency**: Both sides now show identical breakdown format and calculations
2. **Maintainability**: Single component to update for all breakdown displays
3. **Reliability**: No risk of calculation or display differences
4. **User Experience**: Students and admins see the same information
5. **Data Integrity**: Both sides use the same payment engine with identical parameters

## Usage

```tsx
import { SharedPaymentBreakdown } from '@/components/common/payments/SharedPaymentBreakdown';

// Basic usage
<SharedPaymentBreakdown
  baseAmount={100000}
  gstAmount={17365.42}
  discountAmount={2000}
  scholarshipAmount={10000}
  totalAmount={87999.99}
/>

// With custom title and variant
<SharedPaymentBreakdown
  baseAmount={100000}
  gstAmount={17365.42}
  discountAmount={2000}
  scholarshipAmount={10000}
  totalAmount={87999.99}
  title="Program Fee Breakdown"
  variant="compact"
  showTitle={true}
/>
```

## Display Format

The shared component displays breakdown in this consistent order:

1. **Base Fee** - The base amount
2. **One-shot Discount** - Any applicable discounts (green, negative)
3. **GST** - Tax amount
4. **Scholarship Waiver** - Scholarship reductions (red, negative)
5. **Total** - Final payable amount (blue, bold)

## Testing

Both student and admin payment recording flows now use:

- The same calculation source (payment engine)
- The same parameters (scholarship ID, additional discount, GST settings, etc.)
- The same display component (`SharedPaymentBreakdown`)

This ensures complete consistency between student and admin views.
