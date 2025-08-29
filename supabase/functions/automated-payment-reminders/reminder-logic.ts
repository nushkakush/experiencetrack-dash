import { DueDate } from './types.ts';

export function determineReminderType(
  daysRemaining: number,
  daysOverdue: number
): string | null {
  if (daysOverdue > 0) {
    // Overdue reminders: 2, 3, 5, 7, 10 days after due date
    if ([2, 3, 5, 7, 10].includes(daysOverdue)) {
      return 'overdue_reminder';
    }
  } else {
    // Upcoming reminders: 7 days before, 2 days before, on due date
    if (daysRemaining === 7) return '7_days_before';
    if (daysRemaining === 2) return '2_days_before';
    if (daysRemaining === 0) return 'on_due_date';
  }
  return null;
}

export function extractDueDatesFromFeeStructure(
  feeStructure: any,
  studentPayment: any,
  studentId: string,
  paymentId: string
): DueDate[] {
  const dueDates: DueDate[] = [];

  if (studentPayment.payment_plan === 'one_shot') {
    // For one-shot payments, use one_shot_dates
    if (
      feeStructure.one_shot_dates &&
      typeof feeStructure.one_shot_dates === 'object'
    ) {
      Object.entries(feeStructure.one_shot_dates).forEach(([key, date]) => {
        dueDates.push({
          id: `${paymentId}_one_shot`,
          student_id: studentId,
          payment_id: paymentId,
          due_date: date as string,
          installment_number: 1,
          semester_number: 1,
          payment_type: 'one_shot',
        });
      });
    }
  } else if (studentPayment.payment_plan === 'sem_wise') {
    // For semester-wise payments, use sem_wise_dates
    if (
      feeStructure.sem_wise_dates &&
      typeof feeStructure.sem_wise_dates === 'object'
    ) {
      Object.entries(feeStructure.sem_wise_dates).forEach(([key, date]) => {
        const match = key.match(/semester-(\d+)-instalment-(\d+)/);
        if (match) {
          const semesterNumber = parseInt(match[1]);
          const installmentNumber = parseInt(match[2]) + 1; // Convert 0-based to 1-based
          dueDates.push({
            id: `${paymentId}_sem_${semesterNumber}_inst_${installmentNumber}`,
            student_id: studentId,
            payment_id: paymentId,
            due_date: date as string,
            installment_number: installmentNumber,
            semester_number: semesterNumber,
            payment_type: 'semester_wise',
          });
        }
      });
    }
  } else if (studentPayment.payment_plan === 'instalment_wise') {
    // For installment-wise payments, use instalment_wise_dates
    if (
      feeStructure.instalment_wise_dates &&
      typeof feeStructure.instalment_wise_dates === 'object'
    ) {
      Object.entries(feeStructure.instalment_wise_dates).forEach(
        ([key, date]) => {
          const match = key.match(/semester-(\d+)-instalment-(\d+)/);
          if (match) {
            const semesterNumber = parseInt(match[1]);
            const installmentNumber = parseInt(match[2]) + 1; // Convert 0-based to 1-based
            dueDates.push({
              id: `${paymentId}_inst_${installmentNumber}`,
              student_id: studentId,
              payment_id: paymentId,
              due_date: date as string,
              installment_number: installmentNumber,
              semester_number: semesterNumber,
              payment_type: 'installment_wise',
            });
          }
        }
      );
    }
  }

  return dueDates;
}

export function filterDueDatesNeedingReminders(
  dueDates: DueDate[],
  today: Date
): DueDate[] {
  return dueDates.filter(dueDate => {
    const dueDateObj = new Date(dueDate.due_date);
    const daysRemaining = Math.ceil(
      (dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysOverdue = Math.max(0, -daysRemaining);

    // Check if this due date needs a reminder
    const reminderType = determineReminderType(daysRemaining, daysOverdue);
    return reminderType !== null;
  });
}
