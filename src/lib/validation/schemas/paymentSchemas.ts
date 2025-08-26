import { z } from 'zod';
import { PaymentPlan, PaymentStatus } from '@/types/fee';

// Payment plan selection schema
export const paymentPlanSchema = z.object({
  paymentPlan: z.enum(
    ['one_shot', 'sem_wise', 'instalment_wise', 'not_selected'] as const,
    {
      errorMap: () => ({ message: 'Please select a valid payment plan' }),
    }
  ),
});

// Payment submission schema
export const paymentSubmissionSchema = z.object({
  paymentMethod: z.enum(
    ['cash', 'bank_transfer', 'cheque', 'razorpay', 'scan_to_pay'],
    {
      errorMap: () => ({ message: 'Please select a valid payment method' }),
    }
  ),
  amountPaid: z
    .number()
    .min(1, 'Payment amount must be greater than 0')
    .max(1000000, 'Payment amount cannot exceed ₹10,00,000'),
  paymentReferenceNumber: z
    .string()
    .min(3, 'Reference number must be at least 3 characters')
    .max(50, 'Reference number cannot exceed 50 characters')
    .optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  receiptFile: z
    .instanceof(File, { message: 'Please upload a valid receipt file' })
    .refine(
      file => file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB'
    )
    .refine(
      file =>
        ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(
          file.type
        ),
      'File must be JPEG, PNG, or PDF'
    )
    .optional(),
  proofOfPaymentFile: z
    .instanceof(File, {
      message: 'Please upload a valid proof of payment file',
    })
    .refine(
      file => file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB'
    )
    .refine(
      file =>
        ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(
          file.type
        ),
      'File must be JPEG, PNG, or PDF'
    )
    .optional(),
  transactionScreenshotFile: z
    .instanceof(File, { message: 'Please upload a valid screenshot file' })
    .refine(
      file => file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB'
    )
    .refine(
      file => ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type),
      'Screenshot must be JPEG or PNG'
    )
    .optional(),
});

// Payment amount validation schema
export const paymentAmountSchema = z.object({
  amount: z
    .number()
    .min(1, 'Amount must be greater than 0')
    .max(1000000, 'Amount cannot exceed ₹10,00,000'),
  currency: z.literal('INR').default('INR'),
});

// Payment status update schema
export const paymentStatusUpdateSchema = z.object({
  status: z.enum([
    'pending',
    'pending_10_plus_days',
    'verification_pending',
    'paid',
    'overdue',
    'not_setup',
    'awaiting_bank_approval_e_nach',
    'awaiting_bank_approval_physical_mandate',
    'setup_request_failed_e_nach',
    'setup_request_failed_physical_mandate',
    'on_time',
    'failed_5_days_left',
    'complete',
    'dropped',
    'upcoming',
    'partially_paid_verification_pending',
    'partially_paid_days_left',
    'partially_paid_overdue',
  ] as const),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

// Scholarship assignment schema
export const scholarshipAssignmentSchema = z.object({
  scholarshipId: z.string().uuid('Invalid scholarship ID'),
  studentId: z.string().uuid('Invalid student ID'),
  additionalDiscountPercentage: z
    .number()
    .min(0, 'Additional discount cannot be negative')
    .max(100, 'Additional discount cannot exceed 100%')
    .optional(),
});

// Fee structure validation schema
export const feeStructureSchema = z.object({
  admissionFee: z
    .number()
    .min(0, 'Admission fee cannot be negative')
    .max(1000000, 'Admission fee cannot exceed ₹10,00,000'),
  totalProgramFee: z
    .number()
    .min(1, 'Total program fee must be greater than 0')
    .max(10000000, 'Total program fee cannot exceed ₹1,00,00,000'),
  numberOfSemesters: z
    .number()
    .int('Number of semesters must be a whole number')
    .min(1, 'Must have at least 1 semester')
    .max(20, 'Cannot have more than 20 semesters'),
  instalmentsPerSemester: z
    .number()
    .int('Installments per semester must be a whole number')
    .min(1, 'Must have at least 1 installment per semester')
    .max(12, 'Cannot have more than 12 installments per semester'),
  oneShotDiscountPercentage: z
    .number()
    .min(0, 'One-shot discount cannot be negative')
    .max(100, 'One-shot discount cannot exceed 100%'),
  programFeeIncludesGst: z.boolean(),
  equalScholarshipDistribution: z.boolean(),
});

// Payment plan validation with business rules
export const paymentPlanValidationSchema = z
  .object({
    paymentPlan: paymentPlanSchema.shape.paymentPlan,
    feeStructure: feeStructureSchema,
    studentData: z
      .object({
        id: z.string().uuid(),
        existingPayments: z.array(z.any()).optional(),
      })
      .optional(),
  })
  .refine(
    data => {
      if (data.paymentPlan === 'sem_wise') {
        return data.feeStructure.numberOfSemesters > 0;
      }
      if (data.paymentPlan === 'instalment_wise') {
        return data.feeStructure.instalmentsPerSemester > 0;
      }
      return true;
    },
    {
      message: 'Invalid payment plan configuration',
      path: ['paymentPlan'],
    }
  );

// Type exports
export type PaymentPlanInput = z.infer<typeof paymentPlanSchema>;
export type PaymentSubmissionInput = z.infer<typeof paymentSubmissionSchema>;
export type PaymentAmountInput = z.infer<typeof paymentAmountSchema>;
export type PaymentStatusUpdateInput = z.infer<
  typeof paymentStatusUpdateSchema
>;
export type ScholarshipAssignmentInput = z.infer<
  typeof scholarshipAssignmentSchema
>;
export type FeeStructureInput = z.infer<typeof feeStructureSchema>;
export type PaymentPlanValidationInput = z.infer<
  typeof paymentPlanValidationSchema
>;
