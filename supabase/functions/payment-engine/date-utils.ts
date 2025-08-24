import type { PaymentPlan, SemesterView, InstallmentView } from './types.ts';

// Convert database plan-specific JSON structure to UI date keys format
export function convertPlanSpecificJsonToDateKeys(
  planJson: Record<string, unknown>,
  paymentPlan: PaymentPlan
): Record<string, string> {
  const editable: Record<string, string> = {};

  console.log('🔍 Converting plan-specific JSON to date keys:', { planJson, paymentPlan });

  // Always extract admission date if present (common across all payment plans)
  if ((planJson as Record<string, unknown>)['admission']) {
    editable['admission'] = (planJson as Record<string, unknown>)['admission'] as string;
    console.log('✅ Extracted admission date:', editable['admission']);
  }

  if (paymentPlan === 'one_shot') {
    // Handle both nested and flat formats for one-shot
    // Nested: {"program_fee_due_date": "2025-08-20"}
    // Flat: {"one-shot": "2025-08-20"}
    const due = (planJson as { program_fee_due_date?: string }).program_fee_due_date;
    const flatDue = (planJson as { 'one-shot'?: string })['one-shot'];
    
    if (due) {
      editable['one-shot'] = due;
      console.log('✅ Converted nested one-shot date:', due);
    } else if (flatDue) {
      editable['one-shot'] = flatDue;
      console.log('✅ Converted flat one-shot date:', flatDue);
    }
  } else if (paymentPlan === 'sem_wise') {
    // Check for nested format first
    const semesters = (planJson as { semesters?: Record<string, { due_date?: string }> }).semesters;
    
    if (semesters) {
      // Nested format: {"semesters": {"semester_1": {"due_date": "..."}}}
      Object.keys(semesters).forEach(semesterKey => {
        const semesterData = semesters[semesterKey];
        if (semesterData?.due_date) {
          const semesterNum = semesterKey.replace('semester_', '');
          editable[`semester-${semesterNum}-instalment-0`] = semesterData.due_date;
          console.log(`✅ Converted nested sem-wise date for semester ${semesterNum}:`, semesterData.due_date);
        }
      });
    } else {
      // Flat format: {"semester-1-instalment-0": "2025-09-02", ...}
      Object.keys(planJson).forEach(key => {
        if (typeof planJson[key] === 'string' && key.includes('semester-') && key.includes('instalment-0')) {
          editable[key] = planJson[key] as string;
          console.log(`✅ Converted flat sem-wise date for ${key}:`, planJson[key]);
        }
      });
    }
  } else if (paymentPlan === 'instalment_wise') {
    // Check for nested format first
    const semesters = (planJson as { semesters?: Record<string, { installments?: Record<string, string> }> }).semesters;
    
    if (semesters) {
      // Nested format: {"semesters": {"semester_1": {"installments": {"installment_1": "..."}}}}
      Object.keys(semesters).forEach(semesterKey => {
        const semesterData = semesters[semesterKey];
        const semesterNum = semesterKey.replace('semester_', '');

        if (semesterData?.installments) {
          Object.keys(semesterData.installments).forEach(installmentKey => {
            const installmentNum = installmentKey.replace('installment_', '');
            const dateKey = `semester-${semesterNum}-instalment-${installmentNum}`;
            editable[dateKey] = semesterData.installments![installmentKey];
            console.log(`✅ Converted nested instalment-wise date for ${dateKey}:`, semesterData.installments![installmentKey]);
          });
        }
      });
    } else {
      // Flat format: {"semester-1-instalment-0": "2025-08-19", ...}
      Object.keys(planJson).forEach(key => {
        if (typeof planJson[key] === 'string' && key.includes('semester-') && key.includes('instalment-')) {
          editable[key] = planJson[key] as string;
          console.log(`✅ Converted flat instalment-wise date for ${key}:`, planJson[key]);
        }
      });
    }
  }

  console.log('🏁 Final converted date keys:', editable);
  return editable;
}

// Utility to safely add months to a YYYY-MM-DD date string
export function addMonths(dateIso: string, monthsToAdd: number): string {
  try {
    const d = new Date(dateIso);
    d.setHours(12, 0, 0, 0); // avoid DST issues
    d.setMonth(d.getMonth() + monthsToAdd);
    return d.toISOString().split('T')[0];
  } catch (_) {
    return dateIso;
  }
}

// Generate default date keys in the same UI format used by the app
export function generateDefaultUiDateKeys(
  plan: PaymentPlan,
  startDate: string,
  numberOfSemesters: number,
  instalmentsPerSemester: number
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!startDate) return out;

  if (plan === 'one_shot') {
    out['one-shot'] = startDate;
    return out;
  }

  if (plan === 'sem_wise') {
    for (let sem = 1; sem <= numberOfSemesters; sem++) {
      const offset = (sem - 1) * 6; // 6 months per semester
      out[`semester-${sem}-instalment-0`] = addMonths(startDate, offset);
    }
    return out;
  }

  // instalment_wise → monthly installments within each semester
  for (let sem = 1; sem <= numberOfSemesters; sem++) {
    for (let i = 0; i < instalmentsPerSemester; i++) {
      const offset = (sem - 1) * 6 + i;
      out[`semester-${sem}-instalment-${i}`] = addMonths(startDate, offset);
    }
  }
  return out;
}

// Apply JSON overrides to dates (shallow merge by known keys)
export function applyDateOverrides(
  plan: PaymentPlan,
  startDate: string,
  semesters: SemesterView[],
  oneShotPayment: InstallmentView | undefined,
  overrides: Record<string, unknown> | null | undefined
) {
  try {
    if (!overrides || typeof overrides !== 'object') return;

    // Handle admission date override (common across all plans)
    if (overrides.admission_date && typeof overrides.admission_date === 'string') {
      // Store admission date for later use in breakdown
      (overrides as any).__admission_date = overrides.admission_date;
      console.log('✅ Applied admission date override:', overrides.admission_date);
    }

    // One-shot: only set program fee due date
    if (plan === 'one_shot' && oneShotPayment) {
      // Handle nested structure (from UI custom dates): {one_shot: {program_fee_due_date: "..."}}
      const os =
        (
          overrides as {
            one_shot?: { program_fee_due_date?: string };
            oneShot?: { program_fee_due_date?: string };
          }
        ).one_shot ||
        (overrides as { oneShot?: { program_fee_due_date?: string } }).oneShot;
      if (os?.program_fee_due_date) {
        oneShotPayment.paymentDate = os.program_fee_due_date;
        console.log(
          '✅ Applied nested one-shot date:',
          os.program_fee_due_date
        );
      }
      // Handle flat structure (from database): {program_fee_due_date: "..."}
      else if (
        (overrides as { program_fee_due_date?: string }).program_fee_due_date
      ) {
        console.log(
          '🔥 CRITICAL: About to apply flat one-shot date from database:',
          {
            originalDate: oneShotPayment.paymentDate,
            newCustomDate: (overrides as { program_fee_due_date?: string })
              .program_fee_due_date,
          }
        );
        oneShotPayment.paymentDate = (
          overrides as { program_fee_due_date?: string }
        ).program_fee_due_date as string;
        console.log(
          '✅ Applied flat one-shot date:',
          oneShotPayment.paymentDate
        );
      }
      // Handle UI flat key: { 'one-shot': 'YYYY-MM-DD' }
      else if ((overrides as Record<string, unknown>)['one-shot']) {
        const v = String((overrides as Record<string, unknown>)['one-shot']);
        oneShotPayment.paymentDate = v;
        console.log('✅ Applied UI key one-shot date:', v);
      }
    }

    // For sem-wise: single date per semester
    if (plan === 'sem_wise') {
      const semNested = (overrides as {
        semesters?: Record<string, { due_date?: string }>;
      }).semesters;
      if (semNested) {
        semesters.forEach(s => {
          const k = `semester_${s.semesterNumber}`;
          const v = semNested[k]?.due_date;
          if (typeof v === 'string' && s.instalments?.[0]) {
            s.instalments[0].paymentDate = v;
          }
        });
      }
      // UI flat keys like semester-1-instalment-0
      const keys = Object.keys(overrides as Record<string, unknown>);
      if (keys.some(k => k.startsWith('semester-'))) {
        semesters.forEach(s => {
          const key = `semester-${s.semesterNumber}-instalment-0`;
          const v = (overrides as Record<string, unknown>)[key];
          if (typeof v === 'string' && s.instalments?.[0]) {
            s.instalments[0].paymentDate = v as string;
          }
        });
      }
    }

    // For instalment-wise: set per-installment dates within each semester
    // Accept either nested { semesters: { semester_1: { installments: { installment_1: "..." } } } }
    // or flat { "1-1": "..." }
    if (plan === 'instalment_wise') {
      // Prefer nested structure
      const semJson =
        ((
          overrides as {
            semesters?: Record<
              string,
              { installments?: Record<string, string> }
            >;
          }
        ).semesters as
          | Record<string, { installments?: Record<string, string> }>
          | undefined) || (overrides as Record<string, unknown>);

      if (semJson && typeof semJson === 'object') {
        semesters.forEach(s => {
          const semOverride = (semJson as Record<string, unknown>)[
            `semester_${s.semesterNumber}`
          ];
          if (semOverride && typeof semOverride === 'object') {
            const installments = (semOverride as Record<string, unknown>)
              .installments;
            if (installments && typeof installments === 'object') {
              s.instalments?.forEach((inst, idx) => {
                const instKey = `installment_${idx + 1}`;
                let value: unknown = undefined;
                if (typeof semOverride === 'string') {
                  // Simple per-semester date (applies to all installments in that semester)
                  value = semOverride;
                } else if (semOverride && typeof semOverride === 'object') {
                  value =
                    (semOverride as Record<string, unknown>)[instKey] ||
                    (semOverride as Record<string, unknown>)[idx + 1] ||
                    (semOverride as Record<string, unknown>)[
                      `installment-${idx + 1}`
                    ];
                }
                if (typeof value === 'string') inst.paymentDate = value;
              });
            }
          } else {
            // Handle UI flat keys like 'semester-2-instalment-1'
            Object.entries(overrides as Record<string, unknown>).forEach(([k, v]) => {
              if (typeof v !== 'string') return;
              const m = k.match(/^semester-(\d+)-instalment-(\d+)$/);
              if (!m) return;
              const semNum = Number(m[1]);
              const instIdx = Number(m[2]);
              const sem = semesters.find(s => s.semesterNumber === semNum);
              if (sem && sem.instalments?.[instIdx]) {
                sem.instalments[instIdx].paymentDate = v;
              }
            });
          }
        });
      }
    }
  } catch (_) {
    // ignore parse errors in overrides; fall back to DB dates
  }
}

// Convert UI-format custom dates to plan-specific JSON structure
export function convertCustomDatesToPlanSpecific(
  customDates: Record<string, string>,
  paymentPlan: PaymentPlan
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (paymentPlan === 'one_shot') {
    // One-shot plan: store program fee due date
    if (customDates['one-shot']) {
      result.program_fee_due_date = customDates['one-shot'];
    }
  } else if (paymentPlan === 'sem_wise') {
    // Semester-wise plan: store semester dates
    // UI generates keys like "semester-1-instalment-0" even for sem_wise (only instalment-0 exists)
    const semesters: Record<string, { due_date?: string }> = {};

    Object.keys(customDates).forEach(key => {
      if (key.startsWith('semester-') && key.includes('instalment-0')) {
        const parts = key.split('-');
        const semesterNum = parts[1];
        const semesterKey = `semester_${semesterNum}`;

        if (!semesters[semesterKey]) {
          semesters[semesterKey] = {};
        }

        // For semester-wise, store as due_date (there's only one payment per semester)
        semesters[semesterKey].due_date = customDates[key];
      }
    });

    if (Object.keys(semesters).length > 0) {
      result.semesters = semesters;
    }
  } else if (paymentPlan === 'instalment_wise') {
    // Installment-wise plan: store individual installment dates
    const semesters: Record<string, { installments?: Record<string, string> }> =
      {};

    Object.keys(customDates).forEach(key => {
      if (key.startsWith('semester-') && key.includes('instalment-')) {
        const parts = key.split('-');
        const semesterNum = parts[1];
        const installmentNum = parts[3];
        const semesterKey = `semester_${semesterNum}`;

        if (!semesters[semesterKey]) {
          semesters[semesterKey] = {};
        }

        if (!semesters[semesterKey].installments) {
          semesters[semesterKey].installments = {};
        }

        semesters[semesterKey].installments[`installment_${installmentNum}`] =
          customDates[key];
      }
    });

    if (Object.keys(semesters).length > 0) {
      result.semesters = semesters;
    }
  }

  return result;
}
