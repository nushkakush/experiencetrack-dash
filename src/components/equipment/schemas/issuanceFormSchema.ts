import * as z from 'zod';

export const issuanceFormSchema = z.object({
  cohort_id: z.string().min(1, 'Please select a cohort'),
  student_id: z.string().min(1, 'Please select a student'),
  equipment_ids: z
    .array(z.string())
    .min(1, 'Please select at least one equipment'),
  reason: z.string().min(1, 'Please provide a reason for borrowing'),
  expected_return_date: z.string().min(1, 'Please select return date'),
  expected_return_time: z.string().min(1, 'Please select return time'),
  notes: z.string().optional(),
});

export type IssuanceFormData = z.infer<typeof issuanceFormSchema>;
