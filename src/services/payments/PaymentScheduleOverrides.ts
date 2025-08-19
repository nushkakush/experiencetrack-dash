/**
 * Utility for mapping between UI date keys and plan-specific JSON structures
 * Now supports separate storage for each payment plan type
 */

export class PaymentScheduleOverrides {
  /**
   * Convert UI date keys to plan-specific JSON structure for saving
   */
  static toPlanSpecificJson(
    editableDates: Record<string, string>,
    paymentPlan: 'one_shot' | 'sem_wise' | 'instalment_wise'
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (paymentPlan === 'one_shot') {
      // One-shot plan: store program fee due date
      if (editableDates['one-shot']) {
        result.program_fee_due_date = editableDates['one-shot'];
      }
    } else if (paymentPlan === 'sem_wise') {
      // Semester-wise plan: store semester dates
      // UI generates keys like "semester-1-instalment-0" even for sem_wise (only instalment-0 exists)
      const semesters: Record<string, Record<string, unknown>> = {};

      Object.keys(editableDates).forEach(key => {
        if (key.startsWith('semester-') && key.includes('instalment-0')) {
          const parts = key.split('-');
          const semesterNum = parts[1];
          const semesterKey = `semester_${semesterNum}`;

          if (!semesters[semesterKey]) {
            semesters[semesterKey] = {};
          }

          // For semester-wise, store as due_date (there's only one payment per semester)
          semesters[semesterKey].due_date = editableDates[key];
        }
      });

      if (Object.keys(semesters).length > 0) {
        result.semesters = semesters;
      }
    } else if (paymentPlan === 'instalment_wise') {
      // Installment-wise plan: store individual installment dates
      const semesters: Record<
        string,
        { installments?: Record<string, string> }
      > = {};

      Object.keys(editableDates).forEach(key => {
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
            editableDates[key];
        }
      });

      if (Object.keys(semesters).length > 0) {
        result.semesters = semesters;
      }
    }

    return result;
  }

  /**
   * Convert plan-specific JSON structure back to UI date keys for loading
   */
  static fromPlanSpecificJson(
    planJson: Record<string, unknown>,
    paymentPlan: 'one_shot' | 'sem_wise' | 'instalment_wise'
  ): Record<string, string> {
    const editable: Record<string, string> = {};

    if (paymentPlan === 'one_shot') {
      // One-shot plan: extract program fee due date
      // Handle both nested format: {"program_fee_due_date": "..."}
      // and flat UI format: {"one-shot": "..."}
      if (planJson.program_fee_due_date) {
        editable['one-shot'] = planJson.program_fee_due_date;
      } else if (planJson['one-shot']) {
        editable['one-shot'] = planJson['one-shot'];
      }
    } else if (paymentPlan === 'sem_wise') {
      // Semester-wise plan: extract semester dates
      // Handle both nested format: {"semesters": {"semester_1": {"due_date": "..."}}}
      // and flat UI format: {"semester-1-instalment-0": "..."}
      const semesters =
        (planJson as { semesters?: Record<string, { due_date?: string }> })
          .semesters || {};

      if (Object.keys(semesters).length > 0) {
        // Nested format
        Object.keys(semesters).forEach(semesterKey => {
          const semesterData = semesters[semesterKey];
          if (semesterData.due_date) {
            const semesterNum = semesterKey.replace('semester_', '');
            editable[`semester-${semesterNum}-instalment-0`] =
              semesterData.due_date;
          }
        });
      } else {
        // Flat UI format - check for semester-*-instalment-0 keys
        Object.keys(planJson).forEach(key => {
          if (key.startsWith('semester-') && key.includes('-instalment-0')) {
            editable[key] = planJson[key];
          }
        });
      }
    } else if (paymentPlan === 'instalment_wise') {
      // Installment-wise plan: extract individual installment dates
      // Handle both nested format: {"semesters": {"semester_1": {"installments": {"installment_1": "..."}}}}
      // and flat UI format: {"semester-1-instalment-0": "..."}
      const semesters =
        (
          planJson as {
            semesters?: Record<
              string,
              { installments?: Record<string, string> }
            >;
          }
        ).semesters || {};

      if (Object.keys(semesters).length > 0) {
        // Nested format
        Object.keys(semesters).forEach(semesterKey => {
          const semesterData = semesters[semesterKey];
          const semesterNum = semesterKey.replace('semester_', '');

          if (semesterData.installments) {
            Object.keys(semesterData.installments).forEach(installmentKey => {
              const installmentNum = installmentKey.replace('installment_', '');
              const dateKey = `semester-${semesterNum}-instalment-${installmentNum}`;
              editable[dateKey] = semesterData.installments[installmentKey];
            });
          }
        });
      } else {
        // Flat UI format - check for semester-*-instalment-* keys
        Object.keys(planJson).forEach(key => {
          if (key.startsWith('semester-') && key.includes('-instalment-')) {
            editable[key] = planJson[key];
          }
        });
      }
    }

    return editable;
  }
}
