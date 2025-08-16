## Cohort Payment Dates: Persisted Overrides Plan

### Objective
- Persist admin-edited due dates for cohort payment schedules (one_shot, sem_wise, instalment_wise).
- Keep dynamic calculation as a safe fallback wherever an override isn’t provided.
- Make both client and Edge Function consume the same override-aware schedule.

### Proposed Schema (public.cohort_fee_structures)
Add non-breaking columns:

```sql
ALTER TABLE public.cohort_fee_structures
  ADD COLUMN IF NOT EXISTS custom_dates_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_schedule_dates jsonb NOT NULL DEFAULT '{}';
```

JSON shape (extensible; partial overrides allowed):
```json
{
  "one_shot": {
    "admission_fee_due_date": "2025-09-01",
    "program_fee_due_date": "2025-09-01"
  },
  "sem_wise": {
    "semester_1": "2025-09-01",
    "semester_2": "2026-01-01",
    "semester_3": "2026-05-01",
    "semester_4": "2026-09-01"
  },
  "instalment_wise": {
    "semester_1": {
      "installment_1": "2025-09-01",
      "installment_2": "2025-10-01",
      "installment_3": "2025-11-01"
    }
  }
}
```
Notes
- Keys and nesting mirror payment plans → minimal mapping.
- If `custom_dates_enabled=false` or a key is missing, we fall back to dynamic dates.

### RLS & Access
- Read: unchanged.
- Write: same roles that can update fee structures today (e.g., `super_admin`, `fee_collector`).

### Client Changes (high-level)
1) Capture & save overrides in setup
- File: `src/components/fee-collection/FeeCollectionSetupModal.tsx`
- On save/mark-complete: upsert
  - `custom_dates_enabled = true`
  - `payment_schedule_dates = { ...editedDates }`
- Provide a "Reset to defaults" that clears JSON and sets `custom_dates_enabled=false`.

2) Merge before display/calculation
- Add helper `mergeScheduleWithOverrides(dynamicSchedule, overridesJson)` in a shared service, e.g.:
  - `src/services/payments/PaymentScheduleOverrides.ts`
- Fetch `custom_dates_enabled` + `payment_schedule_dates` with the fee structure and call the helper before rendering.

3) Touch-points to use the merge helper
- `src/components/fee-collection/components/student-details/PaymentSchedule.tsx`
- `src/components/fee-collection/components/student-details/FinancialSummary.tsx`
- `src/pages/dashboards/student/components/SemesterBreakdown.tsx`
- `src/pages/dashboards/student/components/AdminLikePlanPreview.tsx`
- `src/components/fee-collection/hooks/useFeeReview.ts` (client-side preview)

4) UX
- Keep Shadcn skeletons for loading; use Sonner toasts for save/reset feedback.

### Edge Function Changes
- File: `supabase/functions/payment-engine/index.ts`
- Steps:
  1. Fetch `custom_dates_enabled, payment_schedule_dates` for the cohort.
  2. Build dynamic schedule as done today.
  3. If enabled, apply the same `mergeScheduleWithOverrides` logic (replicate minimal util in Deno or share via copy).
  4. Return merged schedule.

### Validation Rules
- JSON values must be ISO date strings (YYYY-MM-DD).
- Admin overrides are not constrained by "future" rules; student payment submissions already enforce payment date ≤ today.

### Rollout (no backward compatibility needed)
- Environment is test-only; we can roll forward without compatibility constraints.
- Rollout order:
  1) Apply schema (via MCP).
  2) Implement client save + merge helper and ship.
  3) Update Edge Function to honor overrides.

### Testing
- Unit: `mergeScheduleWithOverrides` (empty, partial, full overrides; invalid keys ignored).
- Integration: setup saves JSON; student/preview shows merged dates.
- Edge: engine returns merged schedule for each plan type.
- E2E: ensure payments, approvals, and receipts remain unaffected.

### Future Enhancements (optional)
- Per-student snapshot: add `effective_schedule_dates jsonb` on `student_payments` to freeze dates at plan selection time.
- Audit trail of date changes (who/when/what) via a history table.

### SQL Reference
```sql
ALTER TABLE public.cohort_fee_structures
  ADD COLUMN IF NOT EXISTS custom_dates_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_schedule_dates jsonb NOT NULL DEFAULT '{}';
```

### Per-student Custom Payment Plan (from Cohort Dashboard)

Goal
- Allow admins to create a tailored payment plan for a specific student directly from the cohort dashboard (same place where scholarships are awarded).
- Custom plans are stored in the SAME table as cohort plans and selected automatically for that student everywhere (admin and student views, submissions).

Data model updates (same table: public.cohort_fee_structures)
- Add a scope/type column and a student link:

```sql
-- Scope for fee structure rows
DO $$ BEGIN
  CREATE TYPE fee_structure_scope AS ENUM ('cohort','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.cohort_fee_structures
  ADD COLUMN IF NOT EXISTS structure_type fee_structure_scope NOT NULL DEFAULT 'cohort',
  ADD COLUMN IF NOT EXISTS student_id uuid NULL REFERENCES public.cohort_students(id) ON DELETE CASCADE;

-- Enforce correct nullability based on scope
ALTER TABLE public.cohort_fee_structures
  ADD CONSTRAINT IF NOT EXISTS cohort_fee_structures_student_scope_chk
  CHECK ((structure_type = 'cohort' AND student_id IS NULL) OR (structure_type = 'custom' AND student_id IS NOT NULL));

-- Uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS cohort_plan_unique
  ON public.cohort_fee_structures(cohort_id)
  WHERE structure_type = 'cohort';

CREATE UNIQUE INDEX IF NOT EXISTS custom_plan_unique
  ON public.cohort_fee_structures(cohort_id, student_id)
  WHERE structure_type = 'custom';
```

Notes
- All existing columns (admission_fee, total_program_fee, instalments_per_semester, payment_schedule_dates, custom_dates_enabled, etc.) apply to both scopes.
- Partial overrides continue to work on both cohort and custom rows.

Selection/Resolution logic (single source of truth)
- Helper: `resolveFeeStructure(cohortId: uuid, studentId?: uuid)`
  - If `studentId` provided: try `structure_type='custom'` for `(cohortId, studentId)`; if not found, fall back to cohort row for `cohortId`.
  - If `studentId` not provided: return cohort row for `cohortId`.
- After resolving the row, compute dynamic schedule and apply `mergeScheduleWithOverrides` if enabled.

Client UI/flows
- Cohort Dashboard → Students table row actions:
  - Existing: Award Scholarship
  - New: "Set Custom Plan"
    - Opens `CustomFeePlanModal` prefilled from cohort plan; admin edits amounts/plan/dates.
    - Save: upsert into `cohort_fee_structures` with `structure_type='custom'` and `student_id=<selected student>`.
    - Provide action to "Revert to Cohort Plan" (delete custom row or set a soft flag if you prefer).
- Everywhere we currently show schedules/amounts (student dashboard, admin previews), call `resolveFeeStructure(cohortId, studentId)` so the custom plan is automatically used when present.

Edge Function
- Request includes `cohortId` and optionally `studentId`.
- Perform the same resolution logic:
  - Prefer custom `(cohortId, studentId)` row; else fallback to cohort row.
  - Compute dynamic schedule and apply overrides.
- Returns merged schedule used for payments, breakdowns, etc.

Validation & Rules
- Only one custom plan per `(cohortId, studentId)` due to unique index.
- RLS: allow `super_admin` & `fee_collector` create/update/delete custom rows; students can read only their custom/cohort plan via existing read policies.

Testing additions
- Resolution helper selects custom when present; cohort otherwise.
- Custom plan save/edit/delete roundtrip from the cohort dashboard.
- Edge Function returns custom/cohort appropriately for the same inputs.
- Submission flow uses the right plan for the right student.

SQL summary
```sql
-- New type + columns + constraints + indexes (see block above)
```
