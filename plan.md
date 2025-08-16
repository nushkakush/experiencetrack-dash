## Goal

Consolidate payment breakdown (structure/schedule) calculation and payment status derivation into a single Supabase Edge Function so all clients request canonical data from one source of truth, avoiding duplicated logic across UI, services, and scripts.

## Current State (as of this branch)

- Payment breakdown generation (amounts, dates, GST, discounts, scholarship distribution):
  - Implemented primarily via `generateFeeStructureReview` in `src/utils/fee-calculations/index.ts` (and supporting utilities like `payment-plans.ts`, `dateUtils.ts`).
  - Consumed in multiple places:
    - `src/components/fee-collection/hooks/useFeeReview.ts`
    - `src/pages/dashboards/student/components/FeePaymentSection.tsx`
    - `src/pages/StudentPaymentDetails/hooks/usePaymentDetails.ts`
    - `src/components/fee-collection/components/student-details/FinancialSummary.tsx`
  - There are also legacy schedule calculators duplicated in:
    - `src/services/studentPayments/SingleRecordPaymentService.ts` (private `calculatePaymentSchedule`)
    - `scripts/test-payment-consistency.ts`, `scripts/fix-payment-schedules-direct.ts`

- Payment status derivation (pending/overdue/partially_paid/verification_pending, etc.):
  - Canonical statuses and rules documented in `docs/Payment Status Documentation.md`.
  - UI currently derives status at render time based on transactions and due dates:
    - `src/pages/dashboards/student/components/SemesterBreakdown.tsx` (one-shot and per-installment logic)
  - There is a simplified method in `src/services/payments/PaymentCalculations.ts` (`calculatePaymentStatus`) and another in `src/services/studentPayments/SingleRecordPaymentService.ts` (private `calculatePaymentStatus`) that are not fully aligned with the canonical statuses.
  - DB constraint aligned to canonical statuses via migration `supabase/migrations/20250815123000_fix_payment_status_constraint.sql`.

- Consumption summary:
  - Student dashboard and StudentPaymentDetails use breakdown + derived statuses to render schedules and gate payment submission.
  - Admin-facing fee collection components also use the same breakdown utilities for preview and reviews.
  - No current usage of `supabase.functions.invoke` in the app; existing Edge Functions are unrelated (invitation, email confirmation).

## Target Architecture

- Introduce a single Edge Function: `payment-engine`.
  - Purpose: Provide canonical payment breakdown and status derivation for both one-shot and semester/installment plans, returning a uniform shape the UI can consume directly.
  - Modes (via `action` in request body):
    - `breakdown`: compute and return amounts/dates/GST/discounts/scholarship breakdown.
    - `status`: compute and return statuses using payment transactions and due dates.
    - `full`: return breakdown enriched with computed statuses + aggregates (recommended default for most UIs).
  - Authorization: validate caller JWT; read-only access should respect RLS. For admin-only cohort-wide reads, we can add an opt-in `adminMode` that requires elevated claims.

### Data Contracts

- Request (examples):

```json
{
  "action": "full",
  "studentId": "<uuid>",
  "cohortId": "<uuid>",
  "paymentPlan": "one_shot | sem_wise | instalment_wise",
  "scholarshipId": "<uuid|null>",
  "additionalDiscountPercentage": 0,
  "startDate": "YYYY-MM-DD" // optional: defaults to cohort start_date
}
```

- Response (core shape, aligned with `PaymentBreakdown` already used in UI):

```json
{
  "success": true,
  "breakdown": {
    "admissionFee": { "baseAmount": 0, "scholarshipAmount": 0, "discountAmount": 0, "gstAmount": 0, "totalPayable": 0 },
    "semesters": [
      {
        "semesterNumber": 1,
        "instalments": [
          {
            "paymentDate": "YYYY-MM-DD",
            "baseAmount": 0,
            "scholarshipAmount": 0,
            "discountAmount": 0,
            "gstAmount": 0,
            "amountPayable": 0,
            "status": "pending|...",
            "amountPaid": 0,
            "amountPending": 0,
            "installmentNumber": 1
          }
        ],
        "total": { "baseAmount": 0, "scholarshipAmount": 0, "discountAmount": 0, "gstAmount": 0, "totalPayable": 0 }
      }
    ],
    "oneShotPayment": { "paymentDate": "YYYY-MM-DD", "baseAmount": 0, "scholarshipAmount": 0, "discountAmount": 0, "gstAmount": 0, "amountPayable": 0 },
    "overallSummary": { "totalProgramFee": 0, "admissionFee": 0, "totalGST": 0, "totalDiscount": 0, "totalScholarship": 0, "totalAmountPayable": 0 }
  },
  "aggregate": {
    "totalPayable": 0,
    "totalPaid": 0,
    "totalPending": 0,
    "nextDueDate": "YYYY-MM-DD|null",
    "paymentStatus": "pending|paid|overdue|verification_pending|..."
  }
}
```

- Status computation rules will exactly implement `docs/Payment Status Documentation.md` and the more detailed logic in `SemesterBreakdown.tsx` for verification-pending and partial cases.

## Implementation Plan

1) Create Edge Function `supabase/functions/payment-engine/index.ts`.
   - Handle CORS and JWT validation.
   - Dispatch on `action` (`breakdown` | `status` | `full`).
   - Use a Supabase client configured for RLS by default; optionally use service role for admin-only operations with explicit checks.

2) Port calculation utilities to the function:
   - Re-implement or copy the minimal required logic from `src/utils/fee-calculations` to compute:
     - Admission fee block
     - Semester/installment breakdowns
     - GST, discount, scholarship distribution
     - Date generation (month/semester cadence)
   - Match the `PaymentBreakdown` shape used by the UI to minimize client changes.

3) Implement status derivation inside the function:
   - Load `payment_transactions` for the target `student_payment` record (approved and verification-pending semantics).
   - Allocate paid amounts across installments in order (sequential fill), mirroring `SemesterBreakdown.tsx` allocation so statuses match UI expectations.
   - Derive statuses per installment using the canonical rules and transaction verification conditions for:
     - `verification_pending`
     - `partially_paid_verification_pending`
     - `paid`, `overdue`, `pending`, `pending_10_plus_days`, `partially_paid_days_left`, `partially_paid_overdue`
   - Compute aggregates (`totalPaid`, `totalPending`, `nextDueDate`, overall `paymentStatus`).

4) Optional DB writes (phase 2, behind a flag):
   - Update `student_payments` with `payment_status`, `total_amount_paid`, `next_due_date` after computation for consistency.
   - Persist a canonical schedule JSON in `student_payments.payment_schedule` (optional) to enable offline/quick reads.

5) Client integration (incremental rollout):
   - Add a thin client util: `src/services/payments/paymentEngineClient.ts` with:
     - `getPaymentBreakdown(params)`: calls `supabase.functions.invoke('payment-engine', { body: { action: 'breakdown', ... }})`
     - `getPaymentStatus(params)`: calls `action: 'status'`
     - `getFullPaymentView(params)`: calls `action: 'full'`
   - Replace direct uses of `generateFeeStructureReview` with `getPaymentBreakdown` or `getFullPaymentView` in:
     - `src/components/fee-collection/hooks/useFeeReview.ts`
     - `src/pages/dashboards/student/components/FeePaymentSection.tsx`
     - `src/pages/StudentPaymentDetails/hooks/usePaymentDetails.ts`
     - `src/components/fee-collection/components/student-details/FinancialSummary.tsx`
   - Replace inline status derivation in `src/pages/dashboards/student/components/SemesterBreakdown.tsx` with response from `getFullPaymentView`. Keep a guarded fallback to current derivation for resiliency if function fails.
   - Update `src/services/studentPayments/SingleRecordPaymentService.ts` to call the function for initial schedule calculation instead of its internal `calculatePaymentSchedule`.

6) UX adjustments per project rules:
   - Wrap all dynamic loads with Shad CN skeletons (existing patterns already present; ensure new calls also show skeletons).
   - Use `sonner` toasts for error states when the Edge Function returns errors/timeouts.

7) Security and RLS:
   - For student-initiated calls: use JWT from `Authorization` header with an anon-key client in the function to respect RLS.
   - For admin/cohort-wide operations: either restrict function to user roles with admin claim or use service role key with explicit authorization checks (e.g., verify the user is staff of the cohort).

8) Tests and verification:
   - Unit tests for the Edge Function pure calculators (port critical test cases from `scripts/test-payment-consistency.ts`).
   - Snapshot tests on response shape to guarantee stability of the contract.
   - E2E/UI tests: verify gating of payment submission and correct statuses across due date boundaries and verification flows.

## Affected Files (initial pass)

- New:
  - `supabase/functions/payment-engine/index.ts`
  - `src/services/payments/paymentEngineClient.ts`

- Updated (replace local calc/derivation with function calls):
  - `src/components/fee-collection/hooks/useFeeReview.ts`
  - `src/pages/dashboards/student/components/FeePaymentSection.tsx`
  - `src/pages/StudentPaymentDetails/hooks/usePaymentDetails.ts`
  - `src/components/fee-collection/components/student-details/FinancialSummary.tsx`
  - `src/pages/dashboards/student/components/SemesterBreakdown.tsx` (consume statuses from API; keep fallback)
  - `src/services/studentPayments/SingleRecordPaymentService.ts` (use function for schedule)

- Later cleanup:
  - Deprecate `PaymentCalculationsService.calculatePaymentStatus` and the private variant in `SingleRecordPaymentService.ts` once all consumers migrate.
  - Remove duplicated schedule calculators from `scripts/*` if no longer needed.

## Rollout Strategy

1. Implement `payment-engine` with `breakdown` and `full` first; ship behind a feature flag (env or feature flag provider).
2. Update student dashboard to consume `full` response with a fallback to current client-side derivation if the function errors.
3. Update admin fee collection flows to use `breakdown` for previews.
4. Migrate `SingleRecordPaymentService.ts` to use the function for setup; optionally persist the returned schedule.
5. Once stable, remove fallback derivations; keep a minimal client-side sanity check only.
6. Enforce the DB `payment_status` to be updated by server flows (admin approve/reject, reconciliation) with consistent codes.

## Risks & Mitigations

- Divergence between UI fallback and server calculation:
  - Mitigate by mirroring the exact allocation logic used today (sequential paid allocation, verification-pending semantics) and by adding snapshot tests.
- Latency from Edge Function on hot paths:
  - Cache recent responses per `(studentId, cohortId, plan, scholarshipId, discount)` combo. Consider short TTL or conditional persistence in `student_payments`.
- RLS errors or permissions mismatch:
  - Start with read-only RLS-respecting client; add admin-mode branch with explicit checks later.

## Example Client Usage (to be implemented)

```ts
import { supabase } from '@/integrations/supabase/client';

export async function getFullPaymentView(params: {
  studentId: string;
  cohortId: string;
  paymentPlan: 'one_shot' | 'sem_wise' | 'instalment_wise';
  scholarshipId?: string;
  additionalDiscountPercentage?: number;
  startDate?: string;
}) {
  const { data, error } = await supabase.functions.invoke('payment-engine', {
    body: { action: 'full', ...params },
  });
  if (error) throw error;
  return data;
}
```

## Acceptance Criteria

- One Supabase Edge Function returns the canonical payment breakdown and statuses with a stable contract.
- All current UI surfaces that show payment breakdown or statuses consume this function (with Skeletons while loading and Sonner for errors).
- Local duplicated calculators are removed or reduced to fallback-only code paths.
- DB-level `payment_status` values match the canonical list and are updated consistently by server flows.


