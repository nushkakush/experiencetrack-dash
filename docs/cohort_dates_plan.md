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

### Backward Compatibility & Rollout
- Default behavior unchanged (`custom_dates_enabled=false`).
- Rollout order:
  1) Schema (via MCP) → safe noop.
  2) Client save + merge helper.
  3) Edge Function reads overrides.
- No backfill required.

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
