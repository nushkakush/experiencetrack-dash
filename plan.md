# Payment Engine Integration Fix Plan

## 🎯 Objective

Ensure all payment engine calls consistently pass the new GST and scholarship distribution toggles to fix scholarship amount calculation issues.

## 📊 Current Status Analysis

### ✅ Correctly Implemented (Passing All New Attributes)

These files are already correctly passing the new toggles to the payment engine:

1. **`src/pages/dashboards/student/components/FeePaymentSection.tsx`**
   - ✅ `program_fee_includes_gst`
   - ✅ `equal_scholarship_distribution`
   - ✅ All date fields

2. **`src/services/studentPayments/PaymentQueryService.ts`**
   - ✅ `program_fee_includes_gst`
   - ✅ `equal_scholarship_distribution`
   - ✅ All date fields

3. **`src/utils/progressCalculation.ts`**
   - ✅ `program_fee_includes_gst`
   - ✅ `equal_scholarship_distribution`
   - ✅ All date fields

4. **`src/components/fee-collection/components/student-details/hooks/usePaymentSchedule.ts`**
   - ✅ `program_fee_includes_gst`
   - ✅ `equal_scholarship_distribution`
   - ✅ All date fields

### ❌ Missing New Attributes (Need Fixing)

These files are missing the new toggles, causing inconsistent scholarship calculations:

1. **`src/pages/StudentPaymentDetails/hooks/usePaymentDetails.ts`**
   - ❌ Missing `feeStructureData` entirely
   - ❌ Falls back to database queries without new toggles

2. **`src/services/studentPayments/InstallmentCalculationService.ts`**
   - ❌ `feeStructureData` passed but doesn't include new toggles
   - ❌ Uses incomplete fee structure data

3. **`src/components/fee-collection/components/payments-table/StatusCell.tsx`**
   - ❌ Missing `program_fee_includes_gst` and `equal_scholarship_distribution` in `feeStructureData`
   - ❌ Only passes basic fee structure fields

4. **`src/components/payments/SingleRecordPaymentDashboard.tsx`**
   - ❌ Uses `getPaymentBreakdown()` without proper `feeStructureData`
   - ❌ Relies on `useSingleRecordPayment` hook which may not pass new toggles

5. **`src/pages/dashboards/student/hooks/useSingleRecordPayment.ts`**
   - ❌ `getPaymentBreakdown()` function doesn't use payment engine
   - ❌ Calculates breakdown locally without new toggles

## 🔧 Implementation Plan

### Phase 1: Fix Missing feeStructureData (High Priority)

#### 1.1 Fix `usePaymentDetails.ts`

**File:** `src/pages/StudentPaymentDetails/hooks/usePaymentDetails.ts`
**Issue:** Missing `feeStructureData` parameter entirely

**Changes Needed:**

```typescript
// Current (BROKEN):
const { breakdown } = await getFullPaymentView({
  studentId: String(studentData.id),
  cohortId: String(cohortData.cohort_id || cohortData.id),
  paymentPlan: plan as 'one_shot' | 'sem_wise' | 'instalment_wise',
});

// Fixed:
const { breakdown } = await getFullPaymentView({
  studentId: String(studentData.id),
  cohortId: String(cohortData.cohort_id || cohortData.id),
  paymentPlan: plan as 'one_shot' | 'sem_wise' | 'instalment_wise',
  feeStructureData: {
    total_program_fee: feeStructure.total_program_fee,
    admission_fee: feeStructure.admission_fee,
    number_of_semesters: feeStructure.number_of_semesters,
    instalments_per_semester: feeStructure.instalments_per_semester,
    one_shot_discount_percentage: feeStructure.one_shot_discount_percentage,
    program_fee_includes_gst:
      (feeStructure as any).program_fee_includes_gst ?? true,
    equal_scholarship_distribution:
      (feeStructure as any).equal_scholarship_distribution ?? false,
    one_shot_dates: feeStructure.one_shot_dates,
    sem_wise_dates: feeStructure.sem_wise_dates,
    instalment_wise_dates: feeStructure.instalment_wise_dates,
  },
});
```

#### 1.2 Fix `InstallmentCalculationService.ts`

**File:** `src/services/studentPayments/InstallmentCalculationService.ts`
**Issue:** `feeStructureData` parameter exists but doesn't include new toggles

**Changes Needed:**

```typescript
// Current (INCOMPLETE):
const response = await getFullPaymentView({
  studentId,
  cohortId,
  paymentPlan,
  scholarshipId,
  feeStructureData, // ❌ Missing new toggles
});

// Fixed:
const response = await getFullPaymentView({
  studentId,
  cohortId,
  paymentPlan,
  scholarshipId,
  feeStructureData: {
    ...feeStructureData,
    program_fee_includes_gst:
      feeStructureData?.program_fee_includes_gst ?? true,
    equal_scholarship_distribution:
      feeStructureData?.equal_scholarship_distribution ?? false,
  },
});
```

#### 1.3 Fix `StatusCell.tsx`

**File:** `src/components/fee-collection/components/payments-table/StatusCell.tsx`
**Issue:** Missing new toggles in `feeStructureData`

**Changes Needed:**

```typescript
// Current (INCOMPLETE):
feeStructureData: {
  total_program_fee: feeStructure.total_program_fee,
  admission_fee: feeStructure.admission_fee,
  number_of_semesters: feeStructure.number_of_semesters,
  instalments_per_semester: feeStructure.instalments_per_semester,
  one_shot_discount_percentage: feeStructure.one_shot_discount_percentage,
  one_shot_dates: feeStructure.one_shot_dates,
  sem_wise_dates: feeStructure.sem_wise_dates,
  instalment_wise_dates: feeStructure.instalment_wise_dates,
},

// Fixed:
feeStructureData: {
  total_program_fee: feeStructure.total_program_fee,
  admission_fee: feeStructure.admission_fee,
  number_of_semesters: feeStructure.number_of_semesters,
  instalments_per_semester: feeStructure.instalments_per_semester,
  one_shot_discount_percentage: feeStructure.one_shot_discount_percentage,
  program_fee_includes_gst: feeStructure.program_fee_includes_gst ?? true,
  equal_scholarship_distribution: feeStructure.equal_scholarship_distribution ?? false,
  one_shot_dates: feeStructure.one_shot_dates,
  sem_wise_dates: feeStructure.sem_wise_dates,
  instalment_wise_dates: feeStructure.instalment_wise_dates,
},
```

#### 1.4 Fix `useSingleRecordPayment.ts`

**File:** `src/pages/dashboards/student/hooks/useSingleRecordPayment.ts`
**Issue:** `getPaymentBreakdown()` doesn't use payment engine

**Changes Needed:**

```typescript
// Current (BROKEN - local calculation):
const getPaymentBreakdown = () => {
  if (!paymentRecord) return null;
  // ... local calculation logic
};

// Fixed (use payment engine):
const getPaymentBreakdown = async () => {
  if (!paymentRecord || !feeStructure) return null;

  try {
    const { breakdown } = await getFullPaymentView({
      studentId,
      cohortId,
      paymentPlan: paymentRecord.payment_plan,
      scholarshipId: paymentRecord.scholarship_id,
      feeStructureData: {
        total_program_fee: feeStructure.total_program_fee,
        admission_fee: feeStructure.admission_fee,
        number_of_semesters: feeStructure.number_of_semesters,
        instalments_per_semester: feeStructure.instalments_per_semester,
        one_shot_discount_percentage: feeStructure.one_shot_discount_percentage,
        program_fee_includes_gst: feeStructure.program_fee_includes_gst ?? true,
        equal_scholarship_distribution:
          feeStructure.equal_scholarship_distribution ?? false,
        one_shot_dates: feeStructure.one_shot_dates,
        sem_wise_dates: feeStructure.sem_wise_dates,
        instalment_wise_dates: feeStructure.instalment_wise_dates,
      },
    });
    return breakdown;
  } catch (error) {
    console.error('Failed to get payment breakdown:', error);
    return null;
  }
};
```

### Phase 2: Database Consistency Check (Medium Priority)

#### 2.1 Verify Database Schema

**Check:** Ensure all fee structures in database have the new toggle fields:

- `program_fee_includes_gst` (boolean)
- `equal_scholarship_distribution` (boolean)

#### 2.2 Data Migration (if needed)

**Action:** Update existing fee structures with default values if fields are missing:

```sql
-- Set default values for existing records
UPDATE fee_structures
SET program_fee_includes_gst = true
WHERE program_fee_includes_gst IS NULL;

UPDATE fee_structures
SET equal_scholarship_distribution = false
WHERE equal_scholarship_distribution IS NULL;
```

### Phase 3: Testing & Validation (High Priority)

#### 3.1 Test Cases to Verify

1. **Scholarship Calculation with GST Toggle:**
   - Test with `program_fee_includes_gst = true` (GST included in total)
   - Test with `program_fee_includes_gst = false` (GST separate)

2. **Scholarship Distribution Toggle:**
   - Test with `equal_scholarship_distribution = true` (equal distribution)
   - Test with `equal_scholarship_distribution = false` (backwards distribution)

3. **Cross-Component Consistency:**
   - Verify all payment engine calls return same results
   - Test student dashboard vs admin dashboard consistency

#### 3.2 Validation Checklist

- [ ] All `getFullPaymentView` calls include `feeStructureData`
- [ ] All `feeStructureData` includes both new toggles
- [ ] Scholarship amounts calculated correctly with GST consideration
- [ ] Scholarship distribution follows toggle setting
- [ ] No fallback to database queries without new toggles

### Phase 4: Documentation & Monitoring (Low Priority)

#### 4.1 Update Documentation

- Document the new toggles and their impact
- Update payment engine integration guide
- Add examples of correct usage

#### 4.2 Add Monitoring

- Add logging for missing `feeStructureData`
- Monitor scholarship calculation consistency
- Track payment engine call patterns

## 🚨 Critical Issues to Address

### Issue 1: Inconsistent Scholarship Calculations

**Problem:** Different components calculate different scholarship amounts due to missing toggles
**Impact:** Students see different amounts in different parts of the app
**Solution:** Fix all missing `feeStructureData` implementations

### Issue 2: GST Calculation Errors

**Problem:** Scholarship calculated on wrong base amount when GST toggle is missing
**Impact:** Incorrect final amounts and GST calculations
**Solution:** Ensure `program_fee_includes_gst` is always passed

### Issue 3: Scholarship Distribution Inconsistency

**Problem:** Scholarship distribution doesn't follow the toggle setting
**Impact:** Wrong payment schedules and installment amounts
**Solution:** Ensure `equal_scholarship_distribution` is always passed

## 📋 Implementation Order

1. **✅ COMPLETED (Phase 1):**
   - ✅ Fix `usePaymentDetails.ts` - Added complete `feeStructureData` with new toggles
   - ✅ Fix `InstallmentCalculationService.ts` - Added missing toggles to `feeStructureData`
   - ✅ Fix `StatusCell.tsx` - Added missing toggles to `feeStructureData`
   - ✅ Fix `useSingleRecordPayment.ts` - Updated `SingleRecordPaymentService` to use payment engine
   - ✅ Fix `PaymentPlanSelection.tsx` - Updated to use payment engine breakdown for accurate scholarship calculations in "Congratulations!" section

2. **This Week:**
   - Test all payment engine calls
   - Verify database consistency
   - Update documentation

3. **Next Week:**
   - Add monitoring and logging
   - Performance optimization if needed

## 🎯 Success Criteria

- [ ] All payment engine calls pass complete `feeStructureData`
- [ ] Scholarship amounts consistent across all components
- [ ] GST calculations accurate based on toggle settings
- [ ] Scholarship distribution follows toggle preferences
- [ ] No fallback to incomplete database queries

## 🔍 Files to Monitor

**Payment Engine Calls:**

- `src/pages/dashboards/student/components/FeePaymentSection.tsx` ✅
- `src/pages/StudentPaymentDetails/hooks/usePaymentDetails.ts` ✅
- `src/services/studentPayments/PaymentQueryService.ts` ✅
- `src/services/studentPayments/InstallmentCalculationService.ts` ✅
- `src/utils/progressCalculation.ts` ✅
- `src/components/fee-collection/components/student-details/hooks/usePaymentSchedule.ts` ✅
- `src/components/fee-collection/components/payments-table/hooks/useActionsCell.ts` ✅
- `src/components/fee-collection/components/payments-table/StatusCell.tsx` ✅
- `src/components/fee-collection/components/student-details/hooks/useAdminPaymentRecording.ts` ✅
- `src/components/fee-collection/hooks/useFeeReview.ts` ✅
- `src/components/fee-collection/hooks/useFeeCollectionSetup.ts` ✅
- `src/pages/dashboards/student/components/AdminLikePlanPreview.tsx` ✅
- `src/pages/dashboards/student/hooks/useSingleRecordPayment.ts` ✅

**Payment Engine Implementation:**

- `supabase/functions/payment-engine/index.ts`
- `supabase/functions/payment-engine/business-logic.ts`
- `supabase/functions/payment-engine/calculations.ts`

**Type Definitions:**

- `src/services/payments/paymentEngineClient.ts`
- `src/types/payments/FeeStructureTypes.ts`
- `supabase/functions/payment-engine/types.ts`
