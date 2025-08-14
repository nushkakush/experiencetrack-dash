# Complete Payment Flow Documentation

## Overview

This document provides a detailed walkthrough of the complete payment flow from the moment a student selects a payment plan until they have paid off all their fees. It covers every step of the user journey, database updates, and system interactions.

## Table of Contents

1. [Payment Plan Selection Phase](#payment-plan-selection-phase)
2. [Payment Schedule Generation](#payment-schedule-generation)
3. [Payment Submission Process](#payment-submission-process)
4. [Payment Verification Workflow](#payment-verification-workflow)
5. [Payment Status Updates](#payment-status-updates)
6. [Communication Flow](#communication-flow)
7. [Database Schema Reference](#database-schema-reference)
8. [Payment Methods](#payment-methods)
9. [Error Handling](#error-handling)

---

## Payment Plan Selection Phase

### Step 1: Student Accesses Payment Dashboard

**User Action**: Student logs into their dashboard and navigates to the fee payment section.

**System Check**:

- Verifies if student has an existing payment plan
- Checks if student has already made payments
- Determines available payment options

**Database Queries**:

```sql
-- Check existing payment plan
SELECT * FROM student_payments
WHERE student_id = ? AND cohort_id = ?;

-- Get fee structure
SELECT * FROM fee_structures
WHERE cohort_id = ?;

-- Get available scholarships
SELECT * FROM cohort_scholarships
WHERE cohort_id = ? AND is_active = true;
```

### Step 2: Payment Plan Options Display

**Available Plans**:

1. **One Shot Payment** - Pay entire program fee upfront
2. **Semester Wise** - Pay by semester (typically 3 semesters)
3. **Installment Wise** - Monthly installments within each semester

**UI Components**:

- `PaymentPlanSelection.tsx` - Main selection interface
- `PaymentPlanPreviewModal.tsx` - Preview selected plan details
- Payment method availability based on plan type

### Step 3: Plan Selection and Confirmation

**User Action**: Student selects a payment plan and confirms their choice.

**System Processing**:

```typescript
// Payment plan selection handler
const handlePaymentPlanSelection = async (plan: PaymentPlan) => {
  // 1. Validate student eligibility
  // 2. Calculate payment schedule
  // 3. Create/update student payment record
  // 4. Generate payment breakdown
};
```

**Database Updates**:

```sql
-- Update student payment plan
UPDATE student_payments
SET payment_plan = ?,
    payment_schedule = ?,
    total_amount_payable = ?,
    next_due_date = ?,
    updated_at = NOW()
WHERE student_id = ? AND cohort_id = ?;
```

---

## Payment Schedule Generation

### Step 4: Payment Schedule Calculation

**System Process**: Based on selected plan, the system calculates the complete payment schedule.

**Calculation Logic**:

#### One Shot Payment

```typescript
// Single payment for entire program fee
const totalAmount = programFee + admissionFee - scholarshipAmount;
const dueDate = cohortStartDate;
```

#### Semester Wise Payment

```typescript
// Calculate per-semester amount
const semesterAmount = (programFee - admissionFee) / numberOfSemesters;
const semesterGST = calculateGST(semesterAmount);

// Generate due dates (6 months apart)
for (let i = 0; i < numberOfSemesters; i++) {
  const dueDate = new Date(cohortStartDate);
  dueDate.setMonth(dueDate.getMonth() + i * 6);
}
```

#### Installment Wise Payment

```typescript
// Calculate per-installment amount
const totalInstallments = numberOfSemesters * instalmentsPerSemester;
const installmentAmount = (programFee - admissionFee) / totalInstallments;

// Generate monthly due dates
for (let i = 0; i < totalInstallments; i++) {
  const dueDate = new Date(cohortStartDate);
  dueDate.setMonth(dueDate.getMonth() + i);
}
```

**Database Storage**:

```sql
-- Store payment schedule as JSON
UPDATE student_payments
SET payment_schedule = '{
  "plan": "sem_wise",
  "total_amount": 150000,
  "admission_fee": 25000,
  "program_fee": 125000,
  "installments": [
    {
      "installment_number": 1,
      "semester_number": 1,
      "due_date": "2025-08-14",
      "amount": 41666.67,
      "status": "pending",
      "amount_paid": 0,
      "amount_pending": 41666.67
    }
  ]
}'
WHERE id = ?;
```

---

## Payment Submission Process

### Step 5: Student Initiates Payment

**User Action**: Student clicks on a payment installment and fills out payment details.

**Available Payment Methods**:

- **Cash** - Direct cash payment
- **Bank Transfer** - NEFT/RTGS/IMPS
- **Cheque** - Physical cheque submission
- **Razorpay** - Online payment (only for one-shot payments)

### Step 6: Payment Form Submission

**Form Fields**:

- Payment amount
- Payment method
- Reference number (UTR/Cheque number)
- Bank details (for bank transfers)
- Receipt file upload
- Transaction screenshot
- Notes/comments

**System Processing**:

```typescript
const handlePaymentSubmission = async (paymentData: PaymentSubmissionData) => {
  // 1. Validate payment data
  // 2. Upload files to Supabase Storage
  // 3. Create payment transaction record
  // 4. Update student payment record
  // 5. Send confirmation email
};
```

### Step 7: File Upload Process

**Storage Buckets**:

- `receipts` - Payment receipts
- `proof-of-payment` - Bank transfer proofs
- `screenshots` - Transaction screenshots

**Upload Process**:

```typescript
const uploadReceiptToStorage = async (file: File, paymentId: string) => {
  const fileName = `${paymentId}_receipt_${Date.now()}.${file.name.split('.').pop()}`;
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, file);

  return {
    success: !error,
    url: data?.path || '',
    error: error?.message,
  };
};
```

### Step 8: Database Record Creation

**Payment Transaction Record**:

```sql
INSERT INTO payment_transactions (
  payment_id,
  transaction_type,
  amount,
  payment_method,
  reference_number,
  status,
  notes,
  created_by,
  verification_status,
  receipt_url,
  proof_of_payment_url,
  transaction_screenshot_url,
  bank_name,
  bank_branch,
  utr_number,
  payer_upi_id,
  payment_date,
  transfer_date
) VALUES (?, 'payment', ?, ?, ?, 'pending', ?, ?, 'verification_pending', ?, ?, ?, ?, ?, ?, ?, ?, ?);
```

**Student Payment Record Update**:

```sql
-- Update total amount paid
UPDATE student_payments
SET total_amount_paid = total_amount_paid + ?,
    last_payment_date = NOW(),
    payment_status = CASE
      WHEN (total_amount_paid + ?) >= total_amount_payable THEN 'paid'
      ELSE 'partially_paid_verification_pending'
    END,
    updated_at = NOW()
WHERE id = ?;
```

---

## Payment Verification Workflow

### Step 9: Payment Verification Queue

**System Status**: Payment enters verification queue with status `verification_pending`.

**Admin Dashboard**: Fee collectors can see pending verifications in their dashboard.

### Step 10: Admin Verification Process

**Admin Actions**:

1. Review payment details
2. Check uploaded documents
3. Verify reference numbers
4. Approve or reject payment

**Verification Interface**:

```typescript
const verifyPayment = async (
  transactionId: string,
  verifiedBy: string,
  status: 'approved' | 'rejected',
  notes?: string,
  rejectionReason?: string
) => {
  // Update verification status
  // Send notification to student
  // Update payment records
};
```

### Step 11: Payment Approval

**Database Updates on Approval**:

```sql
-- Update transaction verification status
UPDATE payment_transactions
SET verification_status = 'approved',
    verified_by = ?,
    verified_at = NOW(),
    verification_notes = ?,
    updated_at = NOW()
WHERE id = ?;

-- Update student payment status
UPDATE student_payments
SET payment_status = CASE
  WHEN total_amount_paid >= total_amount_payable THEN 'paid'
  ELSE 'partially_paid_days_left'
END,
updated_at = NOW()
WHERE id = ?;
```

### Step 12: Payment Rejection

**Database Updates on Rejection**:

```sql
-- Update transaction verification status
UPDATE payment_transactions
SET verification_status = 'rejected',
    verified_by = ?,
    verified_at = NOW(),
    verification_notes = ?,
    rejection_reason = ?,
    updated_at = NOW()
WHERE id = ?;

-- Revert student payment amounts
UPDATE student_payments
SET total_amount_paid = total_amount_paid - ?,
    payment_status = 'pending',
    updated_at = NOW()
WHERE id = ?;
```

---

## Payment Status Updates

### Step 13: Payment Status Tracking

**Status Flow**:

```
pending → verification_pending → approved/rejected
  ↓
partially_paid_verification_pending → partially_paid_days_left
  ↓
paid (when total amount is received)
```

**Status Calculation Logic**:

```typescript
const calculatePaymentStatus = (
  totalAmountPaid: number,
  totalAmountPayable: number,
  dueDate: string
): PaymentStatus => {
  if (totalAmountPaid >= totalAmountPayable) {
    return 'paid';
  } else if (totalAmountPaid > 0) {
    const isOverdue = new Date(dueDate) < new Date();
    return isOverdue ? 'partially_paid_overdue' : 'partially_paid_days_left';
  } else {
    const isOverdue = new Date(dueDate) < new Date();
    return isOverdue ? 'overdue' : 'pending';
  }
};
```

### Step 14: Next Due Date Calculation

**System Process**: After each payment, recalculate the next due date.

```typescript
const calculateNextDueDate = (
  paymentSchedule: PaymentSchedule,
  totalAmountPaid: number
): string => {
  // Find the next unpaid installment
  const nextInstallment = paymentSchedule.installments.find(
    inst => inst.amount_paid < inst.amount
  );

  return nextInstallment?.due_date || null;
};
```

---

## Communication Flow

### Step 15: Automated Notifications

**Email Notifications**:

- Payment submission confirmation
- Payment verification status updates
- Payment reminders for upcoming dues
- Payment completion confirmation

**Database Storage**:

```sql
INSERT INTO communication_history (
  student_id,
  type,
  channel,
  subject,
  message,
  sent_at,
  status
) VALUES (?, 'email', 'email', ?, ?, NOW(), 'sent');
```

### Step 16: Payment Reminders

**Reminder Schedule**:

- 7 days before due date
- 3 days before due date
- On due date
- 3 days after due date (overdue)

**Reminder Logic**:

```typescript
const sendPaymentReminder = async (studentId: string, installment: any) => {
  const daysUntilDue = calculateDaysUntilDue(installment.due_date);

  if (daysUntilDue <= 7 && daysUntilDue > 0) {
    await sendEmail({
      to: student.email,
      subject: 'Payment Reminder',
      template: 'payment_reminder',
      data: { installment, daysUntilDue },
    });
  }
};
```

---

## Database Schema Reference

### Core Tables

#### 1. `student_payments`

**Purpose**: Main payment record for each student-cohort combination.

**Key Columns**:

```sql
CREATE TABLE student_payments (
  id uuid PRIMARY KEY,
  student_id uuid REFERENCES cohort_students(id),
  cohort_id uuid REFERENCES cohorts(id),
  payment_plan text CHECK (payment_plan IN ('one_shot', 'sem_wise', 'instalment_wise')),
  payment_schedule jsonb, -- Complete payment breakdown
  total_amount_payable decimal(10,2),
  total_amount_paid decimal(10,2) DEFAULT 0,
  total_amount_pending decimal(10,2),
  scholarship_id uuid REFERENCES cohort_scholarships(id),
  payment_status text,
  next_due_date date,
  last_payment_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);
```

#### 2. `payment_transactions`

**Purpose**: Individual payment transaction records.

**Key Columns**:

```sql
CREATE TABLE payment_transactions (
  id uuid PRIMARY KEY,
  payment_id uuid REFERENCES student_payments(id),
  transaction_type text CHECK (transaction_type IN ('payment', 'refund', 'adjustment')),
  amount decimal(10,2),
  payment_method text,
  reference_number text,
  status text DEFAULT 'pending',
  verification_status text DEFAULT 'verification_pending',
  verified_by uuid REFERENCES profiles(user_id),
  verified_at timestamptz,
  receipt_url text,
  proof_of_payment_url text,
  transaction_screenshot_url text,
  bank_name text,
  bank_branch text,
  utr_number text,
  payer_upi_id text,
  razorpay_payment_id text,
  razorpay_order_id text,
  razorpay_signature text,
  verification_notes text,
  rejection_reason text,
  payment_date date,
  transfer_date date,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);
```

#### 3. `fee_structures`

**Purpose**: Fee structure configuration for each cohort.

**Key Columns**:

```sql
CREATE TABLE fee_structures (
  id uuid PRIMARY KEY,
  cohort_id uuid REFERENCES cohorts(id),
  total_program_fee decimal(10,2),
  admission_fee decimal(10,2) DEFAULT 0,
  number_of_semesters integer DEFAULT 3,
  instalments_per_semester integer DEFAULT 1,
  one_shot_discount_percentage decimal(5,2) DEFAULT 0,
  is_setup_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);
```

#### 4. `cohort_scholarships`

**Purpose**: Scholarship configurations for cohorts.

**Key Columns**:

```sql
CREATE TABLE cohort_scholarships (
  id uuid PRIMARY KEY,
  cohort_id uuid REFERENCES cohorts(id),
  name text,
  description text,
  amount_percentage decimal(5,2),
  start_percentage decimal(5,2) DEFAULT 0,
  end_percentage decimal(5,2) DEFAULT 100,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);
```

#### 5. `communication_history`

**Purpose**: Track all communication with students.

**Key Columns**:

```sql
CREATE TABLE communication_history (
  id uuid PRIMARY KEY,
  student_id uuid REFERENCES cohort_students(id),
  type text CHECK (type IN ('email', 'sms', 'notification')),
  channel text CHECK (channel IN ('email', 'sms', 'in_app')),
  subject text,
  message text,
  sent_at timestamptz DEFAULT NOW(),
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'read')),
  created_at timestamptz DEFAULT NOW()
);
```

---

## Payment Methods

### Available Payment Methods

#### 1. Cash Payment

**Process**:

- Student submits cash payment details
- Receipt upload required
- Immediate verification by admin
- Status: `verification_pending` → `approved`

#### 2. Bank Transfer

**Process**:

- Student provides UTR number
- Receipt/proof of payment upload required
- Bank verification by admin
- Status: `verification_pending` → `approved`

**Required Fields**:

- UTR number
- Bank name
- Bank branch
- Transfer date
- Receipt file

#### 3. Cheque Payment

**Process**:

- Student provides cheque details
- Cheque image upload required
- Bank clearance verification
- Status: `verification_pending` → `approved`

**Required Fields**:

- Cheque number
- Bank name
- Account number
- Cheque date
- Cheque image

#### 4. Razorpay (Online Payment)

**Process**:

- Available only for one-shot payments
- Direct payment gateway integration
- Automatic verification
- Status: `pending` → `success`

**Integration Flow**:

```typescript
// 1. Create Razorpay order
const order = await razorpayService.createOrder(amount, 'INR', receipt);

// 2. Process payment
const payment = await razorpayService.processPayment(paymentData);

// 3. Verify signature
const isValid = await razorpayService.verifyPaymentSignature(
  orderId,
  paymentId,
  signature
);

// 4. Update database
if (isValid) {
  await updatePaymentStatus('success');
}
```

---

## Error Handling

### Common Error Scenarios

#### 1. Payment Plan Already Selected

**Error**: Student tries to change payment plan after first payment
**Resolution**: Lock payment plan, show message to contact admin

#### 2. File Upload Failures

**Error**: Receipt/proof files fail to upload
**Resolution**: Continue with payment submission, log warning

#### 3. Payment Verification Rejection

**Error**: Admin rejects payment due to invalid documents
**Resolution**: Revert payment amounts, notify student, allow resubmission

#### 4. Database Transaction Failures

**Error**: Payment record creation fails
**Resolution**: Rollback all changes, show error message, retry

#### 5. Payment Method Unavailable

**Error**: Selected payment method not available for plan
**Resolution**: Show available methods, prevent submission

### Error Recovery

#### Payment Submission Recovery

```typescript
const handlePaymentSubmission = async paymentData => {
  try {
    // 1. Upload files
    const uploadResults = await uploadFiles(paymentData.files);

    // 2. Create transaction record
    const transaction = await createTransactionRecord(
      paymentData,
      uploadResults
    );

    // 3. Update student payment
    await updateStudentPayment(paymentData.studentId, paymentData.amount);

    // 4. Send confirmation
    await sendPaymentConfirmation(paymentData.studentId);
  } catch (error) {
    // Rollback changes
    await rollbackPaymentChanges(paymentData);

    // Log error
    Logger.getInstance().error('Payment submission failed', {
      error,
      paymentData,
    });

    // Show user-friendly error
    toast.error('Payment submission failed. Please try again.');
  }
};
```

---

## Summary

This documentation covers the complete payment flow from initial plan selection to final payment completion. The system ensures:

1. **Data Integrity**: All payment records are properly tracked and validated
2. **User Experience**: Clear payment plans and easy submission process
3. **Security**: File uploads, verification workflows, and audit trails
4. **Flexibility**: Multiple payment methods and plan options
5. **Communication**: Automated notifications and reminders
6. **Error Handling**: Comprehensive error recovery and user feedback

The payment system is designed to handle various scenarios while maintaining data consistency and providing a smooth user experience for both students and administrators.
