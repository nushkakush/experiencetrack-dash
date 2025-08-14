# Payment Status Documentation

## Overview

This document defines every payment status used in the system, what each status means, who/what sets it, how it transitions, and how the student/admin UI behaves for each status. These status values are the canonical source and are defined in `src/types/payments/PaymentStatus.ts`.

## Canonical Statuses

- **pending**: Payment is not yet due or is due soon; no payment recorded.
- **pending_10_plus_days**: Payment is not yet due and the due date is ≥ 10 days away; no payment recorded.
- **upcoming**: Alias for a future-dated installment that is not yet within the near-due window (treated similar to pending in UI).
- **partially_paid_days_left**: A partial payment has been made and the due date is in the future (days left before due date).
- **partially_paid_overdue**: A partial payment has been made but the due date has passed (overdue and incomplete).
- **overdue**: No payment recorded and due date has passed.
- **verification_pending**: A student submitted a payment (or proof) and it is awaiting admin verification.
- **partially_paid_verification_pending**: A partial payment was submitted and awaits admin verification.
- **paid**: The specific installment/semester/one-time item is fully paid and verified (or settled automatically for online).
- **on_time**: A paid item that was completed within the expected window (subset of paid; used in some views).
- **complete**: A wrapper/aggregate status for items/flows that are fully settled.
- **not_setup**: Schedule not generated yet (e.g., before plan selection or setup failure).
- **awaiting_bank_approval_e_nach**: Mandate/e-NACH flow is initiated; waiting on bank approval.
- **awaiting_bank_approval_physical_mandate**: Physical mandate initiated; waiting on bank approval.
- **setup_request_failed_e_nach**: Bank/API returned failure for an e-NACH setup request.
- **setup_request_failed_physical_mandate**: Bank/API returned failure for a physical mandate setup request.
- **failed_5_days_left**: A failure event was detected and 5 days remain to fix before hard deadline (rare/legacy).
- **dropped**: Installment/flow is cancelled or dropped.

## Who Sets Each Status

- **System (derived by date and payment data)**
  - pending, pending_10_plus_days, upcoming
  - partially_paid_days_left, partially_paid_overdue
  - overdue
  - paid, on_time (post-verification or auto-set for online)
  - complete (aggregate use)

- **Admin/Backoffice actions**
  - verification_pending, partially_paid_verification_pending (created by student submission; cleared/transitioned by admin approve/reject)
  - awaiting_bank_approval_e_nach, awaiting_bank_approval_physical_mandate
  - setup_request_failed_e_nach, setup_request_failed_physical_mandate
  - dropped

- **System/Setup**
  - not_setup (before schedule exists)

## Default Derivation Logic (when status isn’t provided)

Used for preview and any schedule rows that don’t yet carry a stored status.

Inputs per installment:

- `dueDate`, `totalPayable`, `amountPaid` (defaults to 0)

Rules:

1. If `amountPaid >= totalPayable` → paid
2. Else compute `daysUntilDue = dueDate - today` (date-only)
   - If `daysUntilDue < 0`:
     - If `amountPaid > 0` → partially_paid_overdue
     - Else → overdue
   - Else if `amountPaid > 0` → partially_paid_days_left
   - Else if `daysUntilDue >= 10` → pending_10_plus_days
   - Else → pending

This derivation is implemented at render time in `SemesterBreakdown.tsx` so the UI always shows a meaningful status even before the DB persists one.

## Allowed Actions (Student UI)

The “Submit Payment” form appears only when the status indicates that a student can act and hide when it’s paid or blocked by verification/bank flows.

- **Form Visible (allowed)**: pending, pending_10_plus_days, upcoming, overdue, partially_paid_days_left, partially_paid_overdue, setup_request_failed_e_nach, setup_request_failed_physical_mandate (and amountPending > 0)
- **Form Hidden (blocked)**: verification_pending, partially_paid_verification_pending, awaiting_bank_approval_e_nach, awaiting_bank_approval_physical_mandate, paid, on_time, complete, dropped

Location: `InstallmentCard.tsx` → `shouldShowPaymentForm()`

## Typical Transitions

Below are common transitions for a single installment/semester/one-time item.

- Not due yet
  - upcoming → pending_10_plus_days → pending (as due date approaches)
- Payment submitted (needs review)
  - pending → verification_pending → paid (if approved) / pending (if rejected)
  - partially_paid_days_left → partially_paid_verification_pending → partially_paid_days_left (approved updates paid amounts) or stays pending if rejected
- Past due
  - pending → overdue (no payment by due date)
  - partially_paid_days_left → partially_paid_overdue (due date passed)
- Completion
  - paid → on_time (optional label) → complete (aggregate context)

## One-Shot vs Semester vs Installment Plans

- **One-shot**: One schedule row for program fee (plus admission fee row); statuses apply to that single row.
- **Semester-wise**: One row per semester; statuses computed per semester using the same rules.
- **Installment-wise**: Multiple rows per semester; statuses computed per installment.

## Operational Guidance

- If statuses are persisted in DB (recommended), the UI will use them as-is; the derivation only applies when a row lacks a status.
- Admin approve/reject must update:
  - transaction row: verification fields
  - payment row: totals and next due status
  - derived/explicit status of the affected schedule item

## Source of Truth

- Types and labels: `src/types/payments/PaymentStatus.ts`
- UI gating logic: `src/pages/dashboards/student/components/InstallmentCard.tsx`
- Fallback derivation (preview/renderer): `src/pages/dashboards/student/components/SemesterBreakdown.tsx`
- Calculation engine: `src/utils/fee-calculations` (schedule dates/amounts)

## Changelog Notes

- After 2025-08 refactor, the same logic powers admin preview, student preview, and persisted schedule. Updating logic in `src/utils/fee-calculations` and `PaymentStatus.ts` will propagate consistently across admin, preview, and student dashboards.
