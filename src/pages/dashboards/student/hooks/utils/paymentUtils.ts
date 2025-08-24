// Helper function to generate UUID
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper function to parse semester number from installment ID
export const parseSemesterFromId = (id?: string | null): number | null => {
  if (!id) return null;
  const first = String(id).split('-')[0];
  const num = Number(first);
  return Number.isFinite(num) ? num : null;
};

// Helper function to normalize payment targeting data
export const normalizePaymentTargeting = (
  installmentId?: string | null,
  semesterNumber?: number | null
) => {
  const normalizedInstallmentId: string | null = installmentId ?? null;
  let normalizedSemesterNumber: number | null =
    typeof semesterNumber === 'number' ? semesterNumber : null;
  
  if (!normalizedSemesterNumber) {
    normalizedSemesterNumber = parseSemesterFromId(normalizedInstallmentId);
  }

  return {
    normalizedInstallmentId,
    normalizedSemesterNumber,
  };
};

// Helper function to validate payment targeting
export const validatePaymentTargeting = (
  normalizedInstallmentId: string | null,
  normalizedSemesterNumber: number | null
) => {
  if (!normalizedInstallmentId) {
    return {
      isValid: false,
      error: 'Installment targeting is required. Please select a specific installment and try again.',
    };
  }

  if (!normalizedSemesterNumber) {
    return {
      isValid: false,
      error: 'Semester targeting is required. Please select a specific installment and try again.',
    };
  }

  return {
    isValid: true,
    error: null,
  };
};
