# Bulk Fee Management

This document describes the bulk upload functionality for managing scholarships and payment plans for large cohorts of students.

## Overview

The bulk fee management system allows administrators to efficiently assign scholarships and payment plans to hundreds of students using CSV files. This feature reuses the existing bulk upload infrastructure and provides comprehensive validation, error handling, and customization options.

## Features

### Core Functionality
- **Bulk Scholarship Assignment**: Assign scholarships to multiple students using CSV files
- **Bulk Payment Plan Assignment**: Assign payment plans with optional custom dates
- **Combined Interface**: Unified dialog for managing both scholarships and payment plans
- **Template Downloads**: Pre-filled CSV templates with correct headers and example data

### Advanced Features
- **Custom Payment Dates**: Support for custom payment schedules via JSON in CSV
- **Duplicate Detection**: Identify and handle existing assignments
- **Comprehensive Validation**: Email format, scholarship names, payment plan values
- **Error Reporting**: Detailed error messages with row numbers
- **Batch Processing**: Efficient processing of hundreds of records

## Components

### 1. BulkScholarshipUploadDialog
- **Purpose**: Upload and process scholarship assignments
- **Required Columns**: `student_email`, `scholarship_name`
- **Optional Columns**: `additional_discount_percentage`, `description`

### 2. BulkPaymentPlanUploadDialog
- **Purpose**: Upload and process payment plan assignments
- **Required Columns**: `student_email`, `payment_plan`
- **Optional Columns**: `scholarship_name`, `additional_discount_percentage`, `custom_dates`

### 3. BulkFeeManagementDialog
- **Purpose**: Combined interface with tabs for both operations
- **Features**: Customization options, unified workflow

## CSV Formats

### Scholarship Upload Format
```csv
student_email,scholarship_name,additional_discount_percentage,description
john.doe@example.com,Merit Scholarship,5,High academic performance
jane.smith@example.com,Need-based Scholarship,10,Financial need
bob.wilson@example.com,Merit Scholarship,0,Standard merit award
```

### Payment Plan Upload Format
```csv
student_email,payment_plan,scholarship_name,additional_discount_percentage,custom_dates
john.doe@example.com,one_shot,Merit Scholarship,5,
jane.smith@example.com,sem_wise,Need-based Scholarship,10,
bob.wilson@example.com,instalment_wise,,0,{"semester_1_start":"2024-01-15","semester_1_end":"2024-05-15"}
```

## Payment Plan Values

Valid payment plan values:
- `one_shot`: Full payment upfront
- `sem_wise`: Semester-wise payments
- `instalment_wise`: Monthly installments
- `not_selected`: No plan selected

## Custom Dates Format

When using custom dates, provide a JSON object with date fields:

```json
{
  "semester_1_start": "2024-01-15",
  "semester_1_end": "2024-05-15",
  "semester_2_start": "2024-06-01",
  "semester_2_end": "2024-10-15"
}
```

## Services

### BulkScholarshipUploadService
- `validateScholarshipRow()`: Validate individual rows
- `checkDuplicateScholarships()`: Detect existing assignments
- `processScholarshipUpload()`: Process valid data
- `generateTemplateData()`: Generate CSV template

### BulkPaymentPlanUploadService
- `validatePaymentPlanRow()`: Validate individual rows
- `checkDuplicatePaymentPlans()`: Detect existing assignments
- `processPaymentPlanUpload()`: Process valid data
- `generateTemplateData()`: Generate CSV template

## Integration

### Adding to Cohort Details Page
```tsx
import { BulkFeeManagementDialog } from '@/components/common/bulk-upload';

<BulkFeeManagementDialog
  cohortId={cohort.id}
  onSuccess={loadData}
>
  <Button variant="outline">
    Bulk Fee Management
  </Button>
</BulkFeeManagementDialog>
```

### Individual Components
```tsx
// Scholarship upload only
<BulkScholarshipUploadDialog
  cohortId={cohortId}
  onSuccess={handleSuccess}
/>

// Payment plan upload with custom dates
<BulkPaymentPlanUploadDialog
  cohortId={cohortId}
  onSuccess={handleSuccess}
  enableCustomDates={true}
/>
```

## Validation Rules

### Scholarship Validation
- Student email must be valid format and exist in cohort
- Scholarship name must match existing cohort scholarships
- Additional discount percentage must be 0-100

### Payment Plan Validation
- Student email must be valid format and exist in cohort
- Payment plan must be one of valid values
- Scholarship name (if provided) must match existing scholarships
- Custom dates must be valid JSON format

## Error Handling

### Duplicate Handling
- **Ignore**: Skip existing assignments
- **Overwrite**: Replace existing assignments

### Error Types
- **Validation Errors**: Invalid data format or values
- **Missing Data**: Required fields not found
- **Database Errors**: Connection or constraint issues
- **Business Logic Errors**: Invalid scholarship names, etc.

## Security & Permissions

### Required Permissions
- `fees.manage`: Access to bulk fee management
- `cohorts.bulk_upload`: Access to bulk upload features

### Data Validation
- All inputs are validated server-side
- SQL injection protection via parameterized queries
- Rate limiting for large uploads

## Performance Considerations

### Large File Handling
- Files are processed in chunks
- Progress tracking for large uploads
- Memory-efficient CSV parsing
- Background processing for very large files

### Database Optimization
- Batch inserts for better performance
- Transaction rollback on errors
- Indexed lookups for student/scholarship matching

## Usage Examples

### Basic Scholarship Upload
1. Download template from dialog
2. Fill in student emails and scholarship names
3. Upload CSV file
4. Review validation results
5. Confirm import

### Advanced Payment Plan Upload
1. Enable custom dates option
2. Download template
3. Add custom date JSON to custom_dates column
4. Upload and validate
5. Review and confirm

### Combined Workflow
1. Open combined dialog
2. Configure customization options
3. Switch between scholarship and payment plan tabs
4. Upload files for each operation
5. Monitor progress and results

## Troubleshooting

### Common Issues
- **Invalid Email Format**: Ensure emails match cohort student emails exactly
- **Scholarship Not Found**: Check spelling and case sensitivity
- **JSON Parse Error**: Validate custom dates JSON format
- **Duplicate Errors**: Use ignore/overwrite options appropriately

### Debug Information
- Check browser console for detailed error messages
- Review validation results for specific row errors
- Verify CSV format matches template exactly

## Future Enhancements

### Planned Features
- **Excel Support**: Direct Excel file upload
- **API Integration**: REST API for programmatic uploads
- **Advanced Scheduling**: More flexible custom date formats
- **Bulk Notifications**: Email notifications for assigned students
- **Audit Trail**: Detailed logging of bulk operations
- **Rollback Support**: Ability to undo bulk operations

### Performance Improvements
- **Streaming Uploads**: Handle very large files
- **Parallel Processing**: Concurrent processing of multiple files
- **Caching**: Cache validation results for repeated uploads
