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
  ): Record<string, any> {
    const result: Record<string, any> = {};

    if (paymentPlan === 'one_shot') {
      // One-shot plan: store program fee due date
      if (editableDates['one-shot']) {
        result.program_fee_due_date = editableDates['one-shot'];
      }
    } else if (paymentPlan === 'sem_wise') {
      // Semester-wise plan: store semester dates
      // UI generates keys like "semester-1-instalment-0" even for sem_wise (only instalment-0 exists)
      const semesters: Record<string, any> = {};
      
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
      const semesters: Record<string, any> = {};
      
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
          
          semesters[semesterKey].installments[`installment_${installmentNum}`] = editableDates[key];
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
    planJson: Record<string, any>, 
    paymentPlan: 'one_shot' | 'sem_wise' | 'instalment_wise'
  ): Record<string, string> {
    const editable: Record<string, string> = {};

    if (paymentPlan === 'one_shot') {
      // One-shot plan: extract program fee due date
      if (planJson.program_fee_due_date) {
        editable['one-shot'] = planJson.program_fee_due_date;
      }
    } else if (paymentPlan === 'sem_wise') {
      // Semester-wise plan: extract semester dates
      // Convert back to UI format "semester-1-instalment-0" 
      const semesters = planJson.semesters || {};
      
      Object.keys(semesters).forEach(semesterKey => {
        const semesterData = semesters[semesterKey];
        if (semesterData.due_date) {
          const semesterNum = semesterKey.replace('semester_', '');
          editable[`semester-${semesterNum}-instalment-0`] = semesterData.due_date;
        }
      });
    } else if (paymentPlan === 'instalment_wise') {
      // Installment-wise plan: extract individual installment dates
      const semesters = planJson.semesters || {};
      
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
    }

    return editable;
  }
}


