## Edge Functions Plan: Single Source of Truth for Payment Calculations

### Goals
- **Unify logic**: Move both payment status calculation and payment structure/schedule calculation to a backend single source of truth.
- **Consistency**: Ensure every surface (dashboards, details views, exports) uses the same calculations by calling an Edge Function.
- **Performance & Security**: Compute close to the database with RLS enforced, minimize over-fetching, and support caching where safe.
- **Low-risk rollout**: Ship behind a feature flag, verify parity with current in-app logic, then cut over.

### Decision Overview
- **Recommended**: A single Edge Function `payment-evaluator` with a `mode` input: `"status" | "structure" | "both"`. Internally, keep two modules: `statusEngine` and `structureEngine`.
  - Pros: one endpoint to maintain, one auth and audit path, shared fetches, and fewer network trips when both are needed.
  - Cons: slightly more complex handler. Mitigated with clear module boundaries.
- Alternative: two functions `calculate-payment-status` and `calculate-payment-structure`. Keep this as a fallback if we see strong separation needs later.

---

## API Design

### Endpoint
- Name: `payment-evaluator`
- Runtime: Supabase Edge (Deno)
- Method: `POST`
- Auth: Pass the user's `Authorization` bearer token from the frontend. Enforce RLS.

### Request
- Content-Type: `application/json`
- Body shape (Zod-like schema shown for clarity):

```ts
{
  mode: 'status' | 'structure' | 'both',
  studentId: string,
  cohortId?: string,
  asOfDate?: string, // ISO date; defaults to now in project timezone
  // If omitted, the function fetches from DB using studentId/cohortId
  overrideContext?: {
    feeStructureId?: string,
    scholarships?: Array<{ id: string; type: 'amount' | 'percent'; value: number }>,
    concessions?: Array<{ id: string; reason: string; amount: number }>,
    taxes?: { gstPercent?: number },
    paymentHistory?: Array<{
      id: string
      method: string
      amount: number
      date: string // ISO
      status: 'success' | 'pending' | 'failed'
    }>
  }
}
```

Notes:
- `overrideContext` is optional for simulations or admin previews. For normal flows, the function loads canonical data from the database.
- `asOfDate` ensures time-bound calculations (e.g., overdue as of a fixed date, consistent across clients).

### Response
- On `mode === 'status'`:

```ts
{
  correlationId: string,
  computedAt: string, // ISO
  status: {
    code: 'PAID' | 'PARTIALLY_PAID' | 'DUE' | 'OVERDUE' | 'ADVANCE',
    totalPayable: number,
    totalPaid: number,
    outstanding: number,
    overdueAmount: number,
    nextDueDate?: string, // ISO
    breakdown: Array<{
      label: string
      amount: number
    }>,
    reasons?: string[] // aligned to docs/Payment Status Documentation.md
  },
  meta?: { cache?: { hit: boolean; key?: string } }
}
```

- On `mode === 'structure'`:

```ts
{
  correlationId: string,
  computedAt: string,
  structure: {
    planId: string,
    currency: string,
    installments: Array<{
      number: number,
      dueDate: string,
      baseAmount: number,
      gstAmount: number,
      totalAmount: number,
      paidAmount: number,
      outstandingAmount: number,
      status: 'PAID' | 'PARTIALLY_PAID' | 'DUE' | 'OVERDUE',
    }>,
    totals: {
      base: number
      gst: number
      grand: number
      paid: number
      outstanding: number
      overdue: number
    }
  },
  meta?: { cache?: { hit: boolean; key?: string } }
}
```

- On `mode === 'both'`, return both `status` and `structure` fields in one response.

### Errors
```ts
{
  correlationId: string,
  error: {
    code: string, // e.g., 'UNAUTHORIZED', 'VALIDATION_ERROR', 'NOT_FOUND', 'INTERNAL'
    message: string,
    details?: unknown
  }
}
```

---

## Data & Domain Sources

We will consolidate data from the canonical tables already modeled in Supabase. From the codebase, the following modules and docs inform the logic and can be used to validate parity:
- `docs/Payment Status Documentation.md`
- `src/services/payments/PaymentCalculations.ts`
- `src/utils/fee-calculations/payment-plans.ts`
- `src/pages/dashboards/student/hooks/usePaymentSubmissions.ts`
- `src/components/fee-collection/utils/feeValidation.ts`

Inside the function, fetch minimal, well-indexed sets:
- Student enrollment and cohort context
- Fee structure (plan, n installments, dates)
- Scholarships/concessions/waivers
- Payment history and statuses (successful only for paid totals; optionally include pending for UI hints)
- Tax/GST config used by the current cohort or global defaults

Avoid N+1 queries by selecting with joins or by batching with `in` filters. Keep payload sizes small; compute aggregates server-side.

---

## Implementation Plan

### 1) Create the Edge Function skeleton
- Path: `supabase/functions/payment-evaluator/`
- Files:
  - `index.ts`: request handler, routing by `mode`, error handling, auth, logging
  - `deno.json`: import map and strict flags
  - `_shared/` (within the function folder): pure TypeScript modules for `statusEngine`, `structureEngine`, `types`, `utils`

Handler outline:
- Parse JSON body; validate with a lightweight schema (Zod or hand-rolled)
- Instantiate Supabase client with forwarded `Authorization` header so RLS applies
- Fetch required data (guard for missing/unauthorized)
- Branch to `statusEngine` / `structureEngine` / both
- Return typed result with `correlationId`, `computedAt`
- Add minimal, safe caching (see below)

### 2) Port and harden the calculation engines
- Extract existing logic from:
  - `PaymentCalculations.ts` (status & totals)
  - `payment-plans.ts` (plan shaping)
- Normalize rounding and currency handling.
- Make all date math timezone-safe and deterministic using ISO strings.
- Ensure partial payment application order is clearly defined and consistent (FIFO by due date unless business rules state otherwise).

### 3) Validation and types
- Define request/response types in a shared pattern and keep a mirrored copy in the frontend:
  - Backend: `supabase/functions/payment-evaluator/_shared/types.ts`
  - Frontend: `src/types/api/PaymentsEvaluator.ts`
- Keep these in lockstep in PRs; add tests that assert shape compatibility.

### 4) Auth & Security
- Forward `Authorization` from the browser to the Edge Function and inject it into the Supabase client `global.headers`.
- RLS remains enforced; no Service Role except for controlled admin-only flows.
- Validate `studentId` access (e.g., user must belong to the same org/cohort and have permission via feature flags).
- Log `userId`, `studentId`, and `correlationId` for traceability. Avoid logging PII.

### 5) Caching & performance
- Response is user-specific; use `Cache-Control: private, max-age=30` for short-term client caching.
- Compute a cache key based on a hash of relevant `updated_at` timestamps (student, payments, plan). If unchanged, support a `conditional` fetch path to skip recomputation.
- Keep response JSON small; include aggregate totals and only necessary installment fields.

### 6) Observability
- Structured logs with a `correlationId` in every response and error.
- Surface severe mismatches (see rollout) to logs for quick triage.

### 7) Local development & testing
- Local serve: `supabase functions serve payment-evaluator --no-verify-jwt`
- Unit tests (Deno): test engines in isolation with fixtures.
- Integration tests: spin up `supabase start` and call the function with seeded data.
- Contract tests: Validate request/response JSON schemas.

### 8) Frontend integration
- Call via the existing Supabase singleton client import (`@/lib/supabase/client`) and `supabase.functions.invoke('payment-evaluator', { body })`.
- Wrap with TanStack Query; add ShadCN skeleton loaders where dynamic data is shown and Sonner toasts on error.
- Replace in-app calculations progressively:
  - `PaymentCalculations.ts` → delegate to Edge Function
  - `payment-plans.ts` usages (previews can request `mode: 'structure'`)
  - `usePaymentSubmissions.ts` downstream consumers
- Keep a compatibility layer so existing components can consume the new shapes without large refactors.

### 9) Rollout strategy (feature-flagged)
- Use a feature flag (e.g., `payments.edge.enabled`) from the existing feature flag system.
- Phase 1: Dual-run
  - Compute locally and via Edge Function in parallel on key screens.
  - Compare results in-memory; if mismatch above tolerance, log a `MISMATCH` event with inputs and deltas (no PII).
- Phase 2: Shadow-write
  - Use only Edge Function for user-facing values; keep local computation for diagnostics off-screen.
- Phase 3: Remove local computation paths; keep small helpers for rendering only.

---

## Example usage (frontend)

```ts
const { data, error } = await supabase.functions.invoke('payment-evaluator', {
  body: {
    mode: 'both',
    studentId,
    cohortId,
    asOfDate: new Date().toISOString()
  }
});

if (error) {
  // Show Sonner toast
}

// Render with ShadCN; show skeletons while loading
```

---

## Timeline & Milestones
- Week 1:
  - Define request/response contracts; add types (frontend + function)
  - Create Edge Function skeleton; wire auth; stub engines
  - Implement structure engine (port from `payment-plans.ts`)
- Week 2:
  - Implement status engine (port from `PaymentCalculations.ts`)
  - Unit tests with real fixtures; integration test locally
  - Add caching and correlation IDs; structured logging
- Week 3:
  - Frontend integration behind feature flag with TanStack Query + ShadCN skeletons + Sonner errors
  - Dual-run parity checks; fix divergences
  - Prepare dashboards and exports to consume new API
- Week 4:
  - Enable for a cohort subset; monitor logs and performance
  - Full cutover; remove old calculation paths

---

## Risks & Mitigations
- **Precision/rounding differences**: Lock rounding rules; add snapshot tests for edge cases.
- **Timezone drift**: Require ISO inputs; centralize timezone conversion; test E2E over boundaries.
- **Performance regressions**: Add tracing; set SLO for p95 < 200ms for status-only requests.
- **Auth gaps**: Enforce RLS, guard cohort and org scopes explicitly in queries.
- **Drift between front/back contracts**: Keep mirrored types and CI contract tests.

---

## Deliverables
- `supabase/functions/payment-evaluator/` with:
  - `index.ts`, `deno.json`, `_shared/{statusEngine,structureEngine,types,utils}.ts`
- Frontend API types at `src/types/api/PaymentsEvaluator.ts`
- Feature flag gate `payments.edge.enabled`
- Tests: unit (engines), integration (function), parity checks during rollout

---

## Notes
- Use Yarn in the app; Edge Functions use Deno (no npm scripts required there).
- Frontend must continue to use the singleton Supabase client import and display ShadCN skeletons during fetch. Use Sonner for errors.
- Align statuses and semantics strictly with `docs/Payment Status Documentation.md`.


