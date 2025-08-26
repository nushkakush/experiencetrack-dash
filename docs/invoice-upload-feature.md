# Invoice Upload and Download Feature

## Overview

This feature allows fee collectors and administrators to upload invoices for paid payments, and students to download these invoices. The invoices are separate from the receipts that students upload when making payments.

## Database Changes

### New Migration: `add_lit_invoice_field_to_payment_transactions`

- Added `lit_invoice_id` field to `payment_transactions` table
- References the `payment_invoices` table
- Allows tracking which admin-uploaded invoice is associated with a payment transaction

### Storage Bucket: `payment-invoices`

- Created new Supabase storage bucket for invoice files
- 10MB file size limit
- Supports PDF, JPEG, and PNG files
- RLS policies ensure only fee collectors and admins can upload/delete

## Components

### 1. PaymentInvoiceService (`src/services/paymentInvoice.service.ts`)

Service class for managing invoice operations:

- `uploadInvoice()` - Upload invoice file and create database record
- `getByTransactionId()` - Get invoice for a specific payment transaction
- `getByStudentId()` - Get all invoices for a student
- `deleteInvoice()` - Delete invoice and remove from storage
- `downloadInvoice()` - Download invoice file

### 2. InvoiceUploadDialog (`src/components/fee-collection/components/student-details/InvoiceUploadDialog.tsx`)

Modal dialog for uploading invoices:

- Drag and drop file upload
- File type validation (PDF, JPEG, PNG)
- File size validation (max 10MB)
- Progress indication during upload

### 3. useInvoiceManagement Hook (`src/components/fee-collection/components/student-details/hooks/useInvoiceManagement.ts`)

React hook for managing invoice state and operations:

- Fetches invoice data for payment transactions
- Handles download functionality
- Manages loading states

### 4. Updated PaymentScheduleItem Component

Enhanced to show invoice management for paid payments:

- Shows "Upload Invoice" button for fee collectors/admins when no invoice exists
- Shows "Download Invoice" button when invoice is available
- Displays invoice file name and upload date

### 5. Updated PaymentItem Component

Enhanced to show invoice download for students:

- Shows "Download Invoice" button alongside "Download Receipt" for paid payments
- Only visible when invoice is available

## Usage

### For Fee Collectors/Administrators

1. Navigate to the fee collection dashboard
2. Select a student with paid payments
3. In the payment schedule, find a payment with "paid" status
4. Click "Upload Invoice" button
5. Select and upload an invoice file (PDF, JPEG, or PNG)
6. The invoice will be stored and linked to the payment transaction

### For Students

1. Navigate to student payment dashboard
2. For paid payments, a "Download Invoice" button will appear if an invoice is available
3. Click to download the invoice file

## File Structure

```
src/
├── services/
│   └── paymentInvoice.service.ts          # Invoice service
├── components/
│   └── fee-collection/
│       ├── components/
│       │   └── student-details/
│       │       ├── InvoiceUploadDialog.tsx    # Upload dialog
│       │       ├── hooks/
│       │       │   └── useInvoiceManagement.ts # Invoice management hook
│       │       ├── PaymentScheduleItem.tsx    # Updated with invoice features
│       │       └── PaymentItem.tsx            # Updated with invoice download
│       └── InvoiceTestComponent.tsx           # Test component
└── types/
    └── payments/
        └── DatabaseAlignedTypes.ts            # Updated with invoice types
```

## Security

- Only fee collectors and super admins can upload invoices
- Students can only download invoices for their own payments
- File uploads are validated for type and size
- RLS policies protect storage bucket access

## Storage

- Invoices are stored in the `payment-invoices` Supabase storage bucket
- Files are organized by student ID and transaction ID
- Public URLs are generated for download access

## Testing

Use the `InvoiceTestComponent` to test the functionality:

```tsx
<InvoiceTestComponent
  paymentTransactionId='transaction-id'
  studentId='student-id'
  cohortId='cohort-id'
  paymentStatus='paid'
/>
```

## Future Enhancements

- Invoice preview functionality
- Bulk invoice upload
- Invoice templates
- Email notifications when invoices are uploaded
- Invoice versioning
