# Comprehensive Payment System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Architecture](#database-architecture)
3. [Payment Plan Types](#payment-plan-types)
4. [Technical Implementation](#technical-implementation)
5. [User Journey Documentation](#user-journey-documentation)
6. [Admin Verification Process](#admin-verification-process)
7. [Payment Methods](#payment-methods)
8. [File Upload System](#file-upload-system)
9. [Error Handling & Validation](#error-handling--validation)
10. [API Endpoints](#api-endpoints)
11. [Security & Compliance](#security--compliance)
12. [Troubleshooting](#troubleshooting)

---

## System Overview

The ExperienceTrack payment system is a comprehensive fee management solution that supports three distinct payment plans for students across different cohorts. The system handles the complete payment lifecycle from plan selection to payment verification and completion.

### Key Features
- **Three Payment Plans**: One-shot, Semester-wise, and Installment-wise
- **Multiple Payment Methods**: Cash, Bank Transfer, Cheque, Online (Razorpay)
- **File Upload Support**: Receipts, payment proofs, and transaction screenshots
- **Admin Verification Workflow**: Multi-step verification process
- **Real-time Status Updates**: Live payment status tracking
- **Scholarship Integration**: Automatic scholarship calculation and application
- **GST Calculation**: Automated GST computation and breakdown

---

## Database Architecture

### Core Tables

#### 1. `student_payments` (Primary Payment Record)
```sql
-- Single record per student with dynamic payment schedule
CREATE TABLE student_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES cohort_students(id),
  cohort_id UUID REFERENCES cohorts(id),
  payment_plan TEXT CHECK (payment_plan IN ('one_shot', 'sem_wise', 'instalment_wise', 'not_selected')),
  payment_schedule JSONB DEFAULT '{}',
  total_amount_payable NUMERIC DEFAULT 0,
  total_amount_paid NUMERIC DEFAULT 0,
  total_amount_pending NUMERIC GENERATED ALWAYS AS (total_amount_payable - total_amount_paid),
  scholarship_id UUID REFERENCES cohort_scholarships(id),
  payment_status TEXT DEFAULT 'pending',
  next_due_date DATE,
  last_payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. `payment_transactions` (Transaction Log)
```sql
-- Enhanced transaction table with verification and file storage
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES student_payments(id),
  transaction_type TEXT CHECK (transaction_type IN ('payment', 'refund', 'adjustment')),
  amount NUMERIC NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('online', 'bank_transfer', 'cash', 'cheque')),
  reference_number TEXT,
  status TEXT CHECK (status IN ('success', 'failed', 'pending')),
  notes TEXT,
  
  -- Verification fields
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_by UUID REFERENCES profiles(user_id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  rejection_reason TEXT,
  
  -- File storage
  receipt_url TEXT,
  proof_of_payment_url TEXT,
  transaction_screenshot_url TEXT,
  
  -- Payment method specific fields
  bank_name TEXT,
  bank_branch TEXT,
  utr_number TEXT,
  account_number TEXT,
  cheque_number TEXT,
  payer_upi_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  qr_code_url TEXT,
  receiver_bank_name TEXT,
  receiver_bank_logo_url TEXT,
  
  -- Dates
  payment_date DATE,
  transfer_date DATE,
  
  -- Metadata
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. Supporting Tables
- `fee_structures`: Cohort-specific fee configuration
- `cohort_scholarships`: Available scholarships for cohorts
- `student_scholarships`: Student-specific scholarship assignments
- `payment_method_configurations`: Cohort-specific payment method settings
- `indian_banks`: Bank database for UPI and transfer options

---

## Payment Plan Types

### 1. One-Shot Payment (`one_shot`)
**Description**: Pay the entire program fee upfront with a discount.

**Technical Implementation**:
```typescript
interface OneShotPayment {
  paymentDate: string;
  baseAmount: number;
  gstAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  amountPayable: number;
}
```

**Calculation Logic**:
1. Extract base amount from total program fee (GST exclusive)
2. Apply one-shot discount percentage
3. Apply scholarship amount
4. Calculate GST on final amount
5. Set single payment date (cohort start date)

**User Experience**:
- Single payment card with total amount
- Discount prominently displayed
- All payment methods available (including Razorpay)
- Immediate completion upon payment

### 2. Semester-Wise Payment (`sem_wise`)
**Description**: Pay by semester with one payment per semester.

**Technical Implementation**:
```typescript
interface SemesterPayment {
  semesterNumber: number;
  paymentDate: string;
  baseAmount: number;
  gstAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  amountPayable: number;
}
```

**Calculation Logic**:
1. Divide remaining program fee by number of semesters
2. Apply scholarship only to the last semester
3. Calculate GST for each semester
4. Generate payment dates based on semester schedule

**User Experience**:
- Semester cards with individual amounts
- Progressive payment schedule
- Scholarship applied to final semester
- Payment methods: Cash, Bank Transfer, Cheque

### 3. Installment-Wise Payment (`instalment_wise`)
**Description**: Pay in multiple installments per semester with 40-40-20 distribution.

**Technical Implementation**:
```typescript
interface InstallmentPayment {
  semesterNumber: number;
  installmentNumber: number;
  paymentDate: string;
  baseAmount: number;
  gstAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  amountPayable: number;
}
```

**Calculation Logic**:
1. Divide semester fee by installments per semester
2. Apply 40-40-20 distribution for 3 installments
3. Apply scholarship backwards from last installment
4. Calculate GST for each installment
5. Generate payment dates with proper spacing

**User Experience**:
- Semester breakdown with installment cards
- 40-40-20 distribution clearly shown
- Scholarship applied to final installments
- Payment methods: Cash, Bank Transfer, Cheque

---

## Technical Implementation

### 1. Payment Plan Selection Flow

#### Frontend Components
```typescript
// PaymentPlanSelection.tsx
interface PaymentPlanSelectionProps {
  onPlanSelected: (plan: PaymentPlan) => void;
  isSubmitting?: boolean;
  feeStructure?: any;
  studentData?: any;
  cohortData?: any;
}
```

#### Backend Service
```typescript
// PaymentCalculationService.ts
class PaymentCalculationService {
  async calculatePaymentPlan(
    studentId: string,
    cohortId: string,
    paymentPlan: PaymentPlan,
    scholarshipId?: string,
    forceUpdate: boolean = false
  ): Promise<ApiResponse<{ success: boolean; message: string }>>
}
```

### 2. Payment Submission Flow

#### Hook Implementation
```typescript
// usePaymentSubmissions.ts
export const usePaymentSubmissions = (studentData?: any, onPaymentSuccess?: () => void) => {
  const handlePaymentSubmission = useCallback(async (paymentData: PaymentSubmissionData) => {
    // 1. Validate payment data
    // 2. Upload files to Supabase Storage
    // 3. Create student_payments record
    // 4. Create payment_transactions record
    // 5. Update payment amounts
    // 6. Trigger UI refresh
  }, []);
}
```

#### Database Operations
```sql
-- Step 1: Get or create student_payments record
SELECT id FROM student_payments 
WHERE student_id = ? AND cohort_id = ?;

-- Step 2: Insert payment transaction
INSERT INTO payment_transactions (
  payment_id, amount, payment_method, reference_number,
  receipt_url, proof_of_payment_url, transaction_screenshot_url,
  bank_name, bank_branch, utr_number, cheque_number,
  payer_upi_id, razorpay_payment_id, razorpay_order_id,
  verification_status, status, created_by
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?);

-- Step 3: Update student_payments
UPDATE student_payments 
SET total_amount_paid = total_amount_paid + ?,
    last_payment_date = CURRENT_DATE,
    payment_status = CASE 
      WHEN total_amount_paid + ? >= total_amount_payable THEN 'paid'
      ELSE 'partially_paid'
    END
WHERE id = ?;
```

### 3. File Upload System

#### Storage Configuration
```typescript
// File upload to Supabase Storage
const uploadReceiptToStorage = async (file: File, paymentId: string) => {
  const fileName = `payments/${paymentId}/${file.name}`;
  const { data, error } = await supabase.storage
    .from('payment-documents')
    .upload(fileName, file);
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('payment-documents')
    .getPublicUrl(fileName);
    
  return { success: true, url: publicUrl };
};
```

#### Supported File Types
- **Receipts**: PDF, JPG, PNG (max 5MB)
- **Payment Proofs**: PDF, JPG, PNG (max 5MB)
- **Transaction Screenshots**: JPG, PNG (max 5MB)

---

## User Journey Documentation

### Phase 1: Initial Access
**User**: Student logs into the dashboard
**System**: Checks if payment plan is selected
**UI**: Shows payment plan selection if not selected

### Phase 2: Payment Plan Selection

#### Step 1: Plan Overview
**User**: Views three payment plan options
**UI**: Displays cards with:
- Plan icon and title
- Description and benefits
- Available payment methods
- Discount information (if applicable)

#### Step 2: Plan Details
**User**: Clicks on a plan to see details
**UI**: Shows modal with:
- Complete fee breakdown
- Payment schedule
- Scholarship application
- GST calculation
- Total payable amount

#### Step 3: Plan Confirmation
**User**: Confirms plan selection
**System**: 
1. Calls `PaymentCalculationService.calculatePaymentPlan()`
2. Creates/updates `student_payments` record
3. Generates payment schedule
4. Updates UI to show payment dashboard

### Phase 3: Payment Dashboard

#### Step 1: Payment Overview
**User**: Views payment dashboard
**UI**: Shows:
- Selected payment plan
- Total amount payable
- Amount paid so far
- Amount pending
- Next due date
- Payment status

#### Step 2: Payment Schedule
**User**: Views detailed payment schedule
**UI**: Displays:
- Semester breakdown (if applicable)
- Installment cards (if applicable)
- Due dates and amounts
- Payment status for each installment
- Green checkmarks for completed payments

### Phase 4: Payment Submission

#### Step 1: Select Payment
**User**: Clicks on an unpaid installment
**UI**: Opens payment form with:
- Amount to pay
- Payment method selection
- File upload fields
- Additional details form

#### Step 2: Payment Method Selection
**User**: Chooses payment method
**UI**: Shows method-specific fields:
- **Cash**: Receipt upload
- **Bank Transfer**: UTR number, screenshot
- **Cheque**: Cheque details, image
- **Online**: Razorpay integration

#### Step 3: File Upload
**User**: Uploads required documents
**System**: 
1. Validates file types and sizes
2. Shows upload progress
3. Stores files in Supabase Storage
4. Generates public URLs

#### Step 4: Payment Details
**User**: Fills payment-specific details
**System**: Validates required fields based on payment method

#### Step 5: Submit Payment
**User**: Clicks submit
**System**:
1. Validates all data
2. Uploads files to storage
3. Creates payment transaction record
4. Updates student payment amounts
5. Shows success message
6. Refreshes payment dashboard

### Phase 5: Payment Verification

#### Step 1: Pending Status
**User**: Sees payment as "Pending Verification"
**UI**: Shows verification status with loading indicator

#### Step 2: Admin Review
**Admin**: Reviews payment in admin dashboard
**System**: Shows payment details, uploaded files, and verification options

#### Step 3: Verification Decision
**Admin**: Approves or rejects payment
**System**:
1. Updates verification status
2. Sends notification to student
3. Updates payment amounts (if approved)
4. Triggers communication (if rejected)

### Phase 6: Payment Completion

#### Step 1: Approved Payment
**User**: Receives approval notification
**UI**: Updates payment status to "Paid"
**System**: Updates installment status and overall progress

#### Step 2: Payment History
**User**: Views payment history
**UI**: Shows all transactions with:
- Payment dates
- Amounts
- Methods used
- Verification status
- Receipt downloads

---

## Admin Verification Process

### 1. Payment Queue
**Admin**: Accesses fee payment dashboard
**System**: Shows pending payments with:
- Student information
- Payment details
- Uploaded files
- Payment method
- Amount and date

### 2. Payment Review
**Admin**: Opens payment for review
**System**: Displays:
- Complete payment information
- All uploaded files
- Payment method details
- Student payment history
- Verification options

### 3. Verification Actions
**Admin**: Can approve or reject payment
**System**: 
1. Updates `verification_status`
2. Records `verified_by` and `verified_at`
3. Adds verification notes
4. Sends notification to student
5. Updates payment amounts (if approved)

### 4. Communication
**System**: Automatically sends:
- Approval confirmation
- Rejection notification with reason
- Updated payment schedule
- Next steps instructions

---

## Payment Methods

### 1. Cash Payment
**Required Fields**:
- Amount
- Receipt file
- Notes (optional)

**Validation**:
- Receipt must be uploaded
- Amount must match installment amount
- Receipt must be valid file type

### 2. Bank Transfer
**Required Fields**:
- Amount
- UTR number
- Bank name
- Bank branch
- Transfer date
- Payment screenshot

**Validation**:
- UTR number must be unique
- Screenshot must be uploaded
- Transfer date must be valid

### 3. Cheque Payment
**Required Fields**:
- Amount
- Cheque number
- Bank name
- Cheque date
- Cheque image

**Validation**:
- Cheque number must be unique
- Cheque image must be uploaded
- Cheque date must be valid

### 4. Online Payment (Razorpay)
**Required Fields**:
- Amount
- Payment ID (auto-generated)
- Order ID (auto-generated)
- Signature (auto-verified)

**Process**:
1. Create Razorpay order
2. Redirect to payment gateway
3. Process payment callback
4. Verify signature
5. Update payment status

---

## File Upload System

### Storage Structure
```
payment-documents/
├── {payment_id}/
│   ├── receipt.pdf
│   ├── payment_proof.jpg
│   └── transaction_screenshot.png
```

### File Validation
```typescript
const validateFile = (file: File, type: 'receipt' | 'proof' | 'screenshot') => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = {
    receipt: ['application/pdf', 'image/jpeg', 'image/png'],
    proof: ['application/pdf', 'image/jpeg', 'image/png'],
    screenshot: ['image/jpeg', 'image/png']
  };
  
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB');
  }
  
  if (!allowedTypes[type].includes(file.type)) {
    throw new Error(`Invalid file type for ${type}`);
  }
};
```

### Security Features
- Files stored in private bucket
- Public URLs generated for access
- File type validation
- Size limits enforced
- Unique file naming

---

## Error Handling & Validation

### 1. Form Validation
```typescript
const validatePaymentForm = (
  paymentMethod: string,
  amount: number,
  maxAmount: number,
  details: any,
  files: any
) => {
  const errors: string[] = [];
  
  if (!paymentMethod) {
    errors.push('Please select a payment method');
  }
  
  if (amount <= 0 || amount > maxAmount) {
    errors.push('Please enter a valid amount');
  }
  
  // Method-specific validation
  switch (paymentMethod) {
    case 'cash':
      if (!files.receipt) {
        errors.push('Please upload a receipt');
      }
      break;
    case 'bank_transfer':
      if (!details.utrNumber) {
        errors.push('Please enter UTR number');
      }
      if (!files.screenshot) {
        errors.push('Please upload payment screenshot');
      }
      break;
    // ... other methods
  }
  
  return { isValid: errors.length === 0, errors };
};
```

### 2. Database Error Handling
```typescript
const handleDatabaseError = (error: any) => {
  if (error.code === '23505') { // Unique constraint violation
    return 'This payment reference already exists';
  }
  if (error.code === '23503') { // Foreign key violation
    return 'Invalid student or cohort reference';
  }
  return 'An unexpected error occurred. Please try again.';
};
```

### 3. File Upload Error Handling
```typescript
const handleFileUploadError = (error: any) => {
  if (error.message.includes('File size')) {
    return 'File is too large. Please use a smaller file.';
  }
  if (error.message.includes('File type')) {
    return 'Invalid file type. Please use PDF, JPG, or PNG.';
  }
  return 'Failed to upload file. Please try again.';
};
```

---

## API Endpoints

### 1. Payment Plan Management
```typescript
// POST /api/payments/plan
interface UpdatePaymentPlanRequest {
  studentId: string;
  cohortId: string;
  paymentPlan: PaymentPlan;
  scholarshipId?: string;
}

// GET /api/payments/schedule/{studentId}
interface GetPaymentScheduleResponse {
  paymentPlan: PaymentPlan;
  schedule: PaymentSchedule;
  totalPayable: number;
  totalPaid: number;
  totalPending: number;
}
```

### 2. Payment Submission
```typescript
// POST /api/payments/submit
interface SubmitPaymentRequest {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  files: {
    receipt?: File;
    proofOfPayment?: File;
    transactionScreenshot?: File;
  };
  details: PaymentMethodDetails;
}

// GET /api/payments/transactions/{studentId}
interface GetPaymentTransactionsResponse {
  transactions: PaymentTransaction[];
  totalCount: number;
}
```

### 3. Admin Verification
```typescript
// POST /api/payments/verify
interface VerifyPaymentRequest {
  transactionId: string;
  status: 'approved' | 'rejected';
  notes?: string;
  rejectionReason?: string;
}

// GET /api/payments/pending
interface GetPendingPaymentsResponse {
  payments: PendingPayment[];
  totalCount: number;
}
```

---

## Security & Compliance

### 1. Data Protection
- All sensitive data encrypted at rest
- File uploads validated and sanitized
- Payment information never logged
- HTTPS enforced for all communications

### 2. Access Control
- Role-based access control (RBAC)
- Student can only access their own payments
- Admin verification required for all payments
- Audit trail for all payment operations

### 3. Payment Security
- Razorpay integration with signature verification
- UTR number validation for bank transfers
- Cheque number uniqueness validation
- Receipt verification workflow

### 4. Compliance
- GST calculation and reporting
- Payment audit trail
- Receipt storage for tax purposes
- Data retention policies

---

## Troubleshooting

### Common Issues

#### 1. Payment Plan Not Updating
**Symptoms**: Plan selection doesn't reflect in dashboard
**Solutions**:
- Check database connection
- Verify student_payments record exists
- Clear browser cache
- Check for JavaScript errors

#### 2. File Upload Failures
**Symptoms**: Files not uploading or showing errors
**Solutions**:
- Check file size (max 5MB)
- Verify file type (PDF, JPG, PNG)
- Check Supabase Storage configuration
- Verify storage bucket permissions

#### 3. Payment Verification Issues
**Symptoms**: Payments stuck in pending status
**Solutions**:
- Check admin permissions
- Verify payment_transactions record
- Check verification workflow
- Review error logs

#### 4. Amount Calculation Errors
**Symptoms**: Incorrect amounts displayed
**Solutions**:
- Verify fee structure configuration
- Check scholarship calculations
- Review GST calculations
- Validate payment schedule generation

### Debug Tools

#### 1. Payment Debug Panel
```typescript
// Available in development mode
const PaymentDebugPanel = () => {
  return (
    <div className="debug-panel">
      <h3>Payment Debug Information</h3>
      <pre>{JSON.stringify(paymentData, null, 2)}</pre>
      <pre>{JSON.stringify(calculationData, null, 2)}</pre>
    </div>
  );
};
```

#### 2. Database Queries
```sql
-- Check payment status
SELECT sp.*, pt.* 
FROM student_payments sp
LEFT JOIN payment_transactions pt ON sp.id = pt.payment_id
WHERE sp.student_id = 'student-uuid';

-- Check file uploads
SELECT * FROM payment_transactions 
WHERE receipt_url IS NOT NULL 
ORDER BY created_at DESC;
```

#### 3. Log Analysis
```typescript
// Payment submission logs
Logger.getInstance().info('Payment submission started', {
  studentId,
  amount,
  method,
  timestamp: new Date().toISOString()
});
```

---

## Performance Optimization

### 1. Database Optimization
- Indexed foreign keys for fast joins
- Computed columns for real-time calculations
- Efficient JSONB queries for payment schedules
- Connection pooling for high concurrency

### 2. File Upload Optimization
- Client-side file compression
- Progressive upload with progress indicators
- Background processing for large files
- CDN integration for fast file delivery

### 3. UI Performance
- Lazy loading for payment history
- Virtual scrolling for large datasets
- Optimistic updates for better UX
- Caching for frequently accessed data

---

## Future Enhancements

### 1. Planned Features
- Automated payment reminders
- Bulk payment processing
- Advanced reporting and analytics
- Mobile app integration
- Multi-currency support

### 2. Technical Improvements
- Real-time payment status updates
- Advanced fraud detection
- Machine learning for payment patterns
- Enhanced security measures
- Performance monitoring

---

## Conclusion

The ExperienceTrack payment system provides a comprehensive, secure, and user-friendly solution for managing student fee payments across multiple payment plans. The system handles the complete payment lifecycle from plan selection to verification, with robust error handling, file management, and admin oversight.

The technical implementation ensures scalability, security, and maintainability, while the user experience is designed to be intuitive and efficient for both students and administrators.

For technical support or questions about the payment system, please refer to the troubleshooting section or contact the development team.
