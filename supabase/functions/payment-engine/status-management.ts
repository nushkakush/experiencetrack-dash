import type { Breakdown, PaymentPlan, Transaction, InstallmentAllocation, DueItem, SemesterView } from './types.ts';

// Status derivation helpers
export const normalizeDateOnly = (isoDate: string): number => {
  const d = new Date(isoDate);
  const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return n.getTime();
};

export const deriveInstallmentStatus = (
  dueDate: string,
  totalPayable: number,
  allocatedPaid: number,
  hasVerificationPendingTx: boolean,
  hasApprovedTx: boolean,
  approvedAmount: number = 0, // Add approved amount parameter
  scholarshipAmount: number = 0 // Add scholarship amount parameter
): string => {
  const today = new Date();
  const d0 = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const d1 = normalizeDateOnly(dueDate);
  const daysUntilDue = Math.ceil((d1 - d0) / (1000 * 60 * 60 * 24));

  // Consider scholarship waivers as a form of payment for status purposes
  const effectivePaid = allocatedPaid + scholarshipAmount;
  const effectiveApproved = approvedAmount + scholarshipAmount;

  // If total payable is 0 (fully covered by scholarship), it's waived
  if (totalPayable <= 0) {
    return 'waived';
  }

  // Check if fully covered by scholarship (no actual payments needed)
  if (scholarshipAmount >= totalPayable) {
    return 'waived';
  }

  // Check if partially covered by scholarship
  if (scholarshipAmount > 0 && scholarshipAmount < totalPayable) {
    const remainingAfterScholarship = totalPayable - scholarshipAmount;
    if (effectiveApproved >= totalPayable) {
      return 'waived'; // Fully covered by scholarship + payments
    } else if (effectivePaid > 0) {
      return 'partially_waived'; // Partially covered by scholarship + payments
    }
  }

  // Regular payment logic (no scholarship involved)
  if (hasApprovedTx && effectiveApproved >= totalPayable) {
    return 'paid';
  }
  if (hasVerificationPendingTx && effectivePaid > 0) {
    if (effectivePaid >= totalPayable) return 'verification_pending';
    return 'partially_paid_verification_pending';
  }
  if (effectiveApproved >= totalPayable) return 'paid';
  if (daysUntilDue < 0)
    return effectivePaid > 0 ? 'partially_paid_overdue' : 'overdue';
  if (effectivePaid > 0) return 'partially_paid_days_left';
  if (daysUntilDue >= 10) return 'pending_10_plus_days';
  return 'pending';
};

export const enrichWithStatuses = (
  breakdown: Breakdown,
  transactions: Transaction[],
  plan: PaymentPlan
): {
  breakdown: Breakdown;
  aggregate: {
    totalPayable: number;
    totalPaid: number;
    totalPending: number;
    nextDueDate: string | null;
    paymentStatus: string;
  };
} => {
  const relevantPaid = Array.isArray(transactions)
    ? transactions.reduce((sum, t) => {
        if (
          t &&
          (t.verification_status === 'approved' ||
            t.verification_status === 'verification_pending')
        ) {
          return sum + (Number(t.amount) || 0);
        }
        return sum;
      }, 0)
    : 0;
  const hasVerificationPendingTx = Array.isArray(transactions)
    ? transactions.some(
        t => t && t.verification_status === 'verification_pending'
      )
    : false;
  const hasApprovedTx = Array.isArray(transactions)
    ? transactions.some(t => t && t.verification_status === 'approved')
    : false;

  // Total payable excludes admission fee from schedule calculations displayed to the student, but we will include it in aggregate total.
  const admissionFeePayable = breakdown.admissionFee?.totalPayable || 0;

  let totalPayableSchedule = 0;
  const dueItems: DueItem[] = [];

  // Separate installment-specific and general payments
  const installmentSpecificPayments = Array.isArray(transactions)
    ? transactions.filter(
        t =>
          t &&
          (t.verification_status === 'approved' ||
            t.verification_status === 'verification_pending') &&
          (t.installment_id || t.semester_number)
      )
    : [];

  const generalPayments = Array.isArray(transactions)
    ? transactions.filter(
        t =>
          t &&
          (t.verification_status === 'approved' ||
            t.verification_status === 'verification_pending') &&
          !t.installment_id &&
          !t.semester_number
      )
    : [];

  const generalPaidAmount = generalPayments.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0
  );

  // Initialize installment-specific payment tracking per installment
  const installmentPayments = new Map<string, InstallmentAllocation>(); // key: semesterNumber-installmentNumber

  const parseInstallmentNumberFromId = (raw: string | null): number | null => {
    if (!raw) return null;
    // Accept formats like "3" or "1-3" or any non-digit separator; pick the last numeric token as installment number
    const tokens = String(raw)
      .split(/[^0-9]+/)
      .filter(Boolean);
    if (tokens.length === 0) return null;
    const last = Number(tokens[tokens.length - 1]);
    return Number.isFinite(last) ? last : null;
  };

  installmentSpecificPayments.forEach(payment => {
    if (payment.semester_number && payment.installment_id) {
      const installmentNumber = parseInstallmentNumberFromId(
        payment.installment_id
      );
      if (installmentNumber) {
        const key = `${payment.semester_number}-${installmentNumber}`;
        const prev = installmentPayments.get(key) || {
          amount: 0,
          approvedAmount: 0,
          hasVerificationPending: false,
          hasApproved: false,
        };
        const next: InstallmentAllocation = {
          amount: prev.amount + (Number(payment.amount) || 0),
          approvedAmount: prev.approvedAmount + (payment.verification_status === 'approved' ? (Number(payment.amount) || 0) : 0),
          hasVerificationPending:
            prev.hasVerificationPending ||
            payment.verification_status === 'verification_pending',
          hasApproved:
            prev.hasApproved || payment.verification_status === 'approved',
        };
        installmentPayments.set(key, next);
      } else {
        console.log(
          '⚠️ [WARN] Could not parse installment number from installment_id',
          {
            installment_id: payment.installment_id,
          }
        );
      }
    }
  });

  console.log('🔍 [DEBUG] Payment allocation:', {
    totalRelevantPaid: relevantPaid,
    installmentSpecificPayments: installmentSpecificPayments.length,
    generalPayments: generalPayments.length,
    generalPaidAmount,
    installmentPayments: Object.fromEntries(
      Array.from(installmentPayments.entries()).map(([k, v]) => [
        k,
        { amount: v.amount, vp: v.hasVerificationPending, ap: v.hasApproved },
      ])
    ),
  });

  // For one-shot payments, the oneShotPayment will be processed as semester 1, installment 1
  // by the regular installment processing logic below
  if (plan === 'one_shot' && breakdown.oneShotPayment) {
    // Convert one-shot payment to semester structure for consistent processing
    const oneShotAsSemester: SemesterView = {
      semesterNumber: 1,
      instalments: [{
        ...breakdown.oneShotPayment,
        installmentNumber: 1,
      }],
      total: {
        baseAmount: breakdown.oneShotPayment.baseAmount,
        scholarshipAmount: breakdown.oneShotPayment.scholarshipAmount,
        discountAmount: breakdown.oneShotPayment.discountAmount,
        gstAmount: breakdown.oneShotPayment.gstAmount,
        totalPayable: breakdown.oneShotPayment.amountPayable,
      }
    };
    
    // Add to semesters array for processing
    breakdown.semesters = [oneShotAsSemester];
    
    console.log('🔄 [DEBUG] Converted one-shot payment to semester 1, installment 1 format');
  }

  // Apply installment-specific payments first
  breakdown.semesters?.forEach(sem => {
    sem.instalments?.forEach(inst => {
      const total = Number(inst.amountPayable || 0);

      // Check for installment-specific payments
      const installmentKey = `${sem.semesterNumber}-${inst.installmentNumber}`;
      const alloc = installmentPayments.get(installmentKey);
      const installmentSpecificAmount = alloc?.amount || 0;

      // ONLY apply installment-specific payments - NO fallback to general payments
      const allocated = installmentSpecificAmount;

      console.log('🔍 [PaymentEngine] Installment status calculation:', {
        semester: sem.semesterNumber,
        installment: inst.installmentNumber,
        total,
        allocated,
        approvedAmount: alloc?.approvedAmount || 0,
        hasVerificationPending: alloc?.hasVerificationPending || false,
        hasApproved: alloc?.hasApproved || false
      });

      const status = deriveInstallmentStatus(
        String(inst.paymentDate || new Date().toISOString().split('T')[0]),
        total,
        allocated,
        alloc?.hasVerificationPending || false,
        alloc?.hasApproved || false,
        alloc?.approvedAmount || 0,
        inst.scholarshipAmount || 0
      );

      console.log('🔍 [PaymentEngine] Installment status result:', {
        semester: sem.semesterNumber,
        installment: inst.installmentNumber,
        status,
        total,
        allocated,
        approvedAmount: alloc?.approvedAmount || 0
      });

      inst.status = status;
      inst.amountPaid = allocated;
      inst.amountPending = Math.max(0, total - allocated);
      totalPayableSchedule += total;
      dueItems.push({
        dueDate: inst.paymentDate,
        pending: inst.amountPending,
        status,
      });

      console.log(
        '🔍 [DEBUG] Installment allocation (installment-specific only):',
        {
          semester: sem.semesterNumber,
          installment: inst.installmentNumber,
          total,
          installmentSpecificAmount,
          allocated,
          status,
          hasGeneralPayments: generalPayments.length > 0,
        }
      );
    });
  });

  // Emit a compact summary for quick visual verification
  try {
    const summary = breakdown.semesters?.map(sem => ({
      sem: sem.semesterNumber,
      items: (sem.instalments || []).map(inst => ({
        i: inst.installmentNumber,
        paid: inst.amountPaid,
        pending: inst.amountPending,
        status: inst.status,
      })),
    }));
    console.log(
      '🧾 [SUMMARY] Per-installment allocation and status:',
      JSON.stringify(summary)
    );
  } catch (_) {
    // ignore log errors
  }

  // If there are general payments (without installment targeting), throw an error
  if (generalPayments.length > 0) {
    console.log(
      '🚨 [ERROR] General payments detected - all payments must target specific installments'
    );
    console.log('🚨 [ERROR] General payments found:', generalPayments);
    throw new Error(
      `Payment system requires installment targeting. Found ${generalPayments.length} general payments without installment/semester identification. All payments must specify which installment they are for.`
    );
  }

  const totalPayable = admissionFeePayable + totalPayableSchedule;
  const totalPaid = Math.min(relevantPaid, totalPayableSchedule); // do not count admission fee here
  const totalPending = Math.max(0, totalPayableSchedule - totalPaid);

  // Next due date: earliest due with pending > 0
  const nextDue =
    dueItems
      .filter(d => (Number(d.pending) || 0) > 0)
      .sort(
        (a, b) => normalizeDateOnly(a.dueDate) - normalizeDateOnly(b.dueDate)
      )[0]?.dueDate || null;

  // Aggregate status
  let aggStatus = 'pending';
  const anyOverdue = dueItems.some(
    d => d.status === 'overdue' || d.status === 'partially_paid_overdue'
  );
  
  // Check if all installments are fully paid (no pending amounts)
  const allInstallmentsPaid = totalPending <= 0;
  
  console.log('🔍 [PaymentEngine] Aggregate status calculation:', {
    totalPayable,
    totalPaid,
    totalPending,
    allInstallmentsPaid,
    hasApprovedTx,
    hasVerificationPendingTx,
    anyOverdue,
    dueItemsCount: dueItems.length
  });
  
  if (allInstallmentsPaid && (hasApprovedTx || !hasVerificationPendingTx))
    aggStatus = 'paid';
  else if (hasVerificationPendingTx) aggStatus = 'verification_pending';
  else if (anyOverdue) aggStatus = 'overdue';
  else if (totalPaid > 0 && totalPending > 0) aggStatus = 'partially_paid_days_left';
  else {
    // derive based on nearest due
    if (nextDue) {
      const today = new Date();
      const d0 = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      ).getTime();
      const d1 = normalizeDateOnly(nextDue);
      const daysUntilDue = Math.ceil((d1 - d0) / (1000 * 60 * 60 * 24));
      aggStatus = daysUntilDue >= 10 ? 'pending_10_plus_days' : 'pending';
    } else {
      aggStatus = 'pending';
    }
  }
  
  console.log('🔍 [PaymentEngine] Final aggregate status:', aggStatus);

  // Find the current installment status (the most recently completed or currently being processed)
  let currentInstallmentStatus = 'pending';
  
  // First, check if there are any fully paid installments
  const paidInstallments = dueItems.filter(d => d.status === 'paid');
  if (paidInstallments.length > 0) {
    // If there are paid installments, show 'paid' status
    currentInstallmentStatus = 'paid';
  } else if (nextDue) {
    // If no paid installments, find the installment that corresponds to the next due date
    const currentInstallment = dueItems.find(d => d.dueDate === nextDue);
    if (currentInstallment) {
      currentInstallmentStatus = currentInstallment.status;
    }
  } else if (dueItems.length > 0) {
    // If no next due date, find the most recent installment with pending amount
    const pendingItems = dueItems.filter(d => (Number(d.pending) || 0) > 0);
    if (pendingItems.length > 0) {
      currentInstallmentStatus = pendingItems[0].status;
    } else {
      // All installments are paid
      currentInstallmentStatus = 'paid';
    }
  }

  console.log('🔍 [PaymentEngine] Current installment status:', {
    nextDue,
    currentInstallmentStatus,
    dueItems: dueItems.map(d => ({ dueDate: d.dueDate, pending: d.pending, status: d.status }))
  });

  return {
    breakdown,
    aggregate: {
      totalPayable,
      totalPaid,
      totalPending,
      nextDueDate: nextDue,
      paymentStatus: currentInstallmentStatus, // Use current installment status instead of aggregate
    },
  };
};
