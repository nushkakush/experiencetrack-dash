# API Documentation - ExperienceTrack Dashboard

## Overview

This document provides comprehensive API documentation for the ExperienceTrack Dashboard, an enterprise-grade student management system built with React, TypeScript, and Supabase.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Services](#core-services)
3. [Domain Entities](#domain-entities)
4. [State Management](#state-management)
5. [Feature Flags](#feature-flags)
6. [Performance Monitoring](#performance-monitoring)
7. [Testing](#testing)
8. [Error Handling](#error-handling)
9. [Validation](#validation)

## Architecture Overview

### Domain-Driven Design

The application follows Domain-Driven Design (DDD) principles with clear separation of concerns:

```
src/
├── features/           # Domain features
│   └── payments/      # Payment domain
│       ├── domain/    # Domain entities and business logic
│       └── index.ts   # Public API
├── lib/               # Shared utilities
│   ├── api/          # API client abstraction
│   ├── feature-flags/ # Feature flag system
│   ├── monitoring/   # Performance monitoring
│   ├── performance/  # Performance optimizations
│   └── validation/   # Input validation
├── services/         # Service layer
├── stores/          # State management
└── components/      # UI components
```

### Key Principles

- **Single Responsibility**: Each module has one clear purpose
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Interface Segregation**: Clients depend only on interfaces they use
- **Open/Closed**: Open for extension, closed for modification

## Core Services

### PaymentService

Handles payment-related operations with single responsibility.

```typescript
import { paymentService } from '@/services/payments';

// Get cohort payments
const payments = await paymentService.getCohortPayments(cohortId);

// Get payment summary
const summary = await paymentService.getPaymentSummary(cohortId);

// Update payment status
await paymentService.updatePaymentStatus(paymentId, 'paid', 'Payment received');

// Record payment
await paymentService.recordPayment(paymentId, 50000, 'bank_transfer');
```

**Methods:**
- `getCohortPayments(cohortId: string)`: Get all payments for a cohort
- `getPaymentSummary(cohortId: string)`: Get payment summary with statistics
- `updatePaymentStatus(id: string, status: PaymentStatus, notes?: string)`: Update payment status
- `recordPayment(id: string, amount: number, method: string)`: Record a payment transaction

### PaymentValidationService

Provides comprehensive validation for payment operations.

```typescript
import { paymentValidation } from '@/services/payments';

// Validate payment data
const result = paymentValidation.validatePayment(paymentData);

// Validate payment submission
const submissionResult = paymentValidation.validatePaymentSubmission(submissionData);

// Validate file upload
const fileResult = paymentValidation.validateFileUpload(file, {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
});
```

**Methods:**
- `validatePayment(payment: PaymentData)`: Validate payment data
- `validatePaymentSubmission(submission: SubmissionData)`: Validate payment submission
- `validateFileUpload(file: File, options: FileOptions)`: Validate file uploads
- `validateAmount(amount: number, options: AmountOptions)`: Validate payment amounts

### PaymentCalculationsService

Handles complex payment calculations and business logic.

```typescript
import { paymentCalculations } from '@/services/payments';

// Calculate payment breakdown
const breakdown = paymentCalculations.calculatePaymentBreakdown({
  feeStructure,
  scholarships,
  paymentPlan: 'one_shot',
  startDate: '2024-01-15'
});

// Calculate GST
const gstAmount = paymentCalculations.calculateGST(50000, 18);

// Calculate scholarship amount
const scholarshipAmount = paymentCalculations.calculateScholarshipAmount(
  50000, 
  20, // 20% scholarship
  5   // 5% additional discount
);
```

**Methods:**
- `calculatePaymentBreakdown(options: CalculationOptions)`: Calculate complete payment breakdown
- `calculateGST(amount: number, rate: number)`: Calculate GST amount
- `calculateScholarshipAmount(amount: number, percentage: number, additionalDiscount?: number)`: Calculate scholarship
- `calculatePaymentStatus(dueDate: string, payable: number, paid: number)`: Calculate payment status

## Domain Entities

### PaymentEntity

Encapsulates payment business logic and validation.

```typescript
import { PaymentEntity } from '@/features/payments';

// Create new payment
const payment = PaymentEntity.create({
  student_id: 'student-1',
  cohort_id: 'cohort-1',
  payment_type: 'admission_fee',
  payment_plan: 'one_shot',
  base_amount: 50000,
  amount_payable: 59000,
  due_date: '2024-01-15'
});

// Business logic methods
console.log(payment.isPaid); // false
console.log(payment.isOverdue); // false
console.log(payment.pendingAmount); // 59000

// Record payment
payment.recordPayment(30000);
console.log(payment.isPartiallyPaid); // true
console.log(payment.paymentPercentage); // 50

// Update status
payment.updateStatus('verification_pending');
```

**Properties:**
- `id`: Payment unique identifier
- `studentId`: Associated student ID
- `cohortId`: Associated cohort ID
- `amountPayable`: Total amount payable
- `amountPaid`: Amount already paid
- `pendingAmount`: Remaining amount to pay
- `isPaid`: Whether payment is complete
- `isOverdue`: Whether payment is overdue
- `paymentPercentage`: Percentage of payment completed

**Methods:**
- `recordPayment(amount: number)`: Record a payment
- `updateStatus(status: PaymentStatus)`: Update payment status
- `addNotes(notes: string)`: Add notes to payment
- `canRecordPayment(amount: number)`: Check if payment can be recorded
- `canUpdateStatus(status: PaymentStatus)`: Check if status transition is valid

## State Management

### Zustand Stores

The application uses Zustand for state management with persistence and optimization.

#### PaymentStore

```typescript
import { usePaymentStore, useSelectedPaymentPlan } from '@/stores/paymentStore';

// In component
const { selectedPaymentPlan, setSelectedPaymentPlan } = usePaymentStore();
const paymentPlan = useSelectedPaymentPlan(); // Optimized selector

// Update payment plan
setSelectedPaymentPlan('one_shot');

// Add payment submission
const { addPaymentSubmission } = usePaymentStore();
addPaymentSubmission('payment-1', {
  amount: 50000,
  method: 'bank_transfer'
});
```

**State:**
- `selectedPaymentPlan`: Currently selected payment plan
- `paymentSubmissions`: Map of payment submissions
- `submittingPayments`: Set of payments being submitted
- `paymentBreakdown`: Calculated payment breakdown
- `expandedSemesters`: Set of expanded semester sections
- `paymentMethods`: Available payment methods

#### AttendanceStore

```typescript
import { useAttendanceStore } from '@/stores/attendanceStore';

const { selectedDate, setSelectedDate, attendanceRecords } = useAttendanceStore();

// Update selected date
setSelectedDate(new Date('2024-01-15'));

// Get attendance records
const records = attendanceRecords;
```

**State:**
- `selectedDate`: Currently selected date
- `selectedSession`: Currently selected session
- `attendanceRecords`: Array of attendance records
- `attendanceStats`: Attendance statistics
- `markingAttendance`: Set of students being marked
- `filters`: Attendance filters

## Feature Flags

### Feature Flag System

Comprehensive feature flag system for gradual rollout and A/B testing.

```typescript
import { useFeatureFlag, WithFeatureFlag } from '@/lib/feature-flags';

// Hook usage
const { isEnabled, isLoading } = useFeatureFlag('new-payment-ui');

// Component usage
<WithFeatureFlag flagId="new-payment-ui" fallback={<OldPaymentUI />}>
  <NewPaymentUI />
</WithFeatureFlag>

// Multiple flags
const { flags } = useFeatureFlags(['new-payment-ui', 'payment-calculations-v2']);
```

**Available Flags:**
- `new-payment-ui`: New modular payment interface
- `payment-calculations-v2`: New payment calculation engine
- `attendance-analytics`: Advanced attendance analytics
- `bulk-operations`: Bulk payment and attendance operations
- `real-time-notifications`: Real-time notifications
- `advanced-reporting`: Advanced reporting features

**Configuration:**
- `enabled`: Whether flag is enabled
- `rolloutPercentage`: Percentage of users to enable for (0-100)
- `targetRoles`: Specific roles to target
- `targetCohorts`: Specific cohorts to target
- `startDate`: When to start rollout
- `endDate`: When to end rollout

## Performance Monitoring

### Performance Monitor

Comprehensive performance monitoring and analytics.

```typescript
import { performanceMonitor } from '@/lib/monitoring/PerformanceMonitor';

// Initialize monitor
performanceMonitor.initialize({
  enabled: true,
  sampleRate: 1.0,
  endpoint: 'https://api.example.com/monitoring',
  apiKey: 'your-api-key'
});

// Track custom events
performanceMonitor.trackPerformance('payment_processing', 1500, {
  paymentId: 'payment-1',
  amount: 50000
});

// Track errors
try {
  // Some operation
} catch (error) {
  performanceMonitor.trackError(error, {
    context: 'payment_submission',
    userId: 'user-1'
  });
}

// Get metrics
const metrics = performanceMonitor.getPerformanceMetrics();
console.log(`Total events: ${metrics.totalEvents}`);
console.log(`Error count: ${metrics.errorCount}`);
console.log(`Average API response time: ${metrics.averageApiResponseTime}ms`);
```

**Tracked Events:**
- Performance events (page load, resource load, custom metrics)
- Error events (JavaScript errors, unhandled rejections)
- User interaction events (clicks, navigation, form submissions)
- API call events (request/response times, errors)

### Bundle Analyzer

Bundle size analysis and optimization recommendations.

```typescript
import { bundleAnalyzer } from '@/lib/performance/BundleAnalyzer';

// Analyze bundle
const metrics = await bundleAnalyzer.analyzeBundle();
console.log(`Total bundle size: ${metrics.totalSize} bytes`);
console.log(`Number of chunks: ${metrics.chunkCount}`);

// Get performance metrics
const performance = await bundleAnalyzer.getPerformanceMetrics();
console.log(`LCP: ${performance.largestContentfulPaint}ms`);
console.log(`FID: ${performance.firstInputDelay}ms`);

// Get optimization recommendations
const recommendations = bundleAnalyzer.getOptimizationRecommendations();
recommendations.forEach(rec => {
  console.log(`${rec.type}: ${rec.message} (${rec.impact} impact)`);
});
```

## Testing

### Test Utilities

Comprehensive testing infrastructure with mocks and utilities.

```typescript
import { render, mockPayment, mockStudent, waitForLoadingToFinish } from '@/test/setup/test-utils';

// Test component with providers
const { getByText, findByRole } = render(<PaymentComponent />, {
  initialEntries: ['/payments'],
  queryClient: createMockQueryClient()
});

// Wait for loading to finish
await waitForLoadingToFinish();

// Assertions
expect(getByText('Payment Details')).toBeInTheDocument();
```

**Available Utilities:**
- `render`: Custom render with all providers
- `mockPayment`: Mock payment data
- `mockStudent`: Mock student data
- `mockCohort`: Mock cohort data
- `createMockQueryClient`: Mock React Query client
- `waitForLoadingToFinish`: Wait for loading states

### Domain Testing

Unit tests for domain entities and business logic.

```typescript
import { PaymentEntity } from '@/features/payments/domain/PaymentEntity';

describe('PaymentEntity', () => {
  it('should calculate pending amount correctly', () => {
    const payment = new PaymentEntity(mockPaymentData);
    expect(payment.pendingAmount).toBe(54000);
    
    payment.recordPayment(27000);
    expect(payment.pendingAmount).toBe(27000);
  });

  it('should determine payment status correctly', () => {
    const payment = new PaymentEntity(mockPaymentData);
    expect(payment.isPaid).toBe(false);
    expect(payment.isOverdue).toBe(false);
    
    payment.recordPayment(54000);
    expect(payment.isPaid).toBe(true);
  });
});
```

## Error Handling

### Error Boundaries

Domain-specific error boundaries with recovery mechanisms.

```typescript
import { PaymentErrorBoundary } from '@/components/error-boundaries';

// Wrap payment components
<PaymentErrorBoundary
  onError={(error, errorInfo) => {
    console.error('Payment error:', error, errorInfo);
  }}
>
  <PaymentComponent />
</PaymentErrorBoundary>

// Custom fallback
<PaymentErrorBoundary
  fallback={<CustomErrorComponent />}
>
  <PaymentComponent />
</PaymentErrorBoundary>
```

**Features:**
- Domain-specific error handling
- User-friendly error messages
- Retry mechanisms
- Error logging and reporting
- Development debugging support

## Validation

### Input Validation

Type-safe validation using Zod schemas.

```typescript
import { PaymentValidator } from '@/lib/validation';

// Validate payment submission
const result = PaymentValidator.validatePaymentSubmission({
  paymentMethod: 'bank_transfer',
  amountPaid: 50000,
  receiptFile: file
});

if (!result.success) {
  console.error('Validation errors:', result.errors);
  console.error('Field errors:', result.fieldErrors);
} else {
  // Use validated data
  const validatedData = result.data;
}

// Validate file upload
const fileResult = PaymentValidator.validateFileUpload(file, {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
});

// Validate amount
const amountResult = PaymentValidator.validateAmountWithBusinessRules(50000, {
  minAmount: 1000,
  maxAmount: 1000000,
  currency: 'INR'
});
```

**Available Schemas:**
- `paymentPlanSchema`: Payment plan validation
- `paymentSubmissionSchema`: Payment submission validation
- `paymentAmountSchema`: Amount validation
- `paymentStatusUpdateSchema`: Status update validation
- `scholarshipAssignmentSchema`: Scholarship assignment validation
- `feeStructureSchema`: Fee structure validation

## Performance Optimizations

### Code Splitting

Automatic code splitting and lazy loading.

```typescript
import { LazyStudentDashboard, codeSplittingManager } from '@/lib/performance/CodeSplitting';

// Use lazy components
<LazyStudentDashboard />

// Preload components
codeSplittingManager.preloadComponent('PaymentBreakdown');

// Get loading status
const status = codeSplittingManager.getComponentStatus('StudentDashboard');
console.log(`Loaded: ${status.loaded}, Preloaded: ${status.preloaded}`);

// Get loading statistics
const stats = codeSplittingManager.getLoadingStats();
console.log(`Loading progress: ${stats.loadingProgress}%`);
```

**Features:**
- Automatic code splitting
- Component preloading
- Loading status tracking
- Performance monitoring
- Error boundaries for lazy components

## Migration Guide

### From Old Architecture

1. **Replace direct service calls:**
   ```typescript
   // Old
   const result = await studentPaymentsService.getStudentPayments(cohortId);
   
   // New
   const result = await paymentService.getCohortPayments(cohortId);
   ```

2. **Use domain entities:**
   ```typescript
   // Old
   const isPaid = payment.amount_paid >= payment.amount_payable;
   
   // New
   const paymentEntity = PaymentEntity.fromJSON(payment);
   const isPaid = paymentEntity.isPaid;
   ```

3. **Use state management:**
   ```typescript
   // Old
   const [selectedPlan, setSelectedPlan] = useState('not_selected');
   
   // New
   const { selectedPaymentPlan, setSelectedPlan } = usePaymentStore();
   ```

4. **Add feature flags:**
   ```typescript
   // Old
   <NewFeature />
   
   // New
   <WithFeatureFlag flagId="new-feature" fallback={<OldFeature />}>
     <NewFeature />
   </WithFeatureFlag>
   ```

## Best Practices

### Code Organization

1. **Use domain entities for business logic**
2. **Keep services focused and single-purpose**
3. **Use feature flags for gradual rollout**
4. **Implement comprehensive error handling**
5. **Add performance monitoring**
6. **Write unit tests for domain logic**
7. **Use type-safe validation**
8. **Optimize bundle size with code splitting**

### Performance

1. **Monitor Core Web Vitals**
2. **Use lazy loading for components**
3. **Implement proper caching strategies**
4. **Optimize API calls**
5. **Track performance metrics**
6. **Use bundle analysis**

### Security

1. **Validate all inputs**
2. **Use proper error boundaries**
3. **Implement proper authentication**
4. **Sanitize user data**
5. **Use HTTPS for all communications**

## Troubleshooting

### Common Issues

1. **Bundle size too large:**
   - Use code splitting
   - Analyze bundle with BundleAnalyzer
   - Remove unused dependencies

2. **Performance issues:**
   - Monitor with PerformanceMonitor
   - Check Core Web Vitals
   - Optimize API calls

3. **Validation errors:**
   - Check input data format
   - Use PaymentValidator
   - Review validation schemas

4. **Feature flag issues:**
   - Check flag configuration
   - Verify user context
   - Use FeatureFlagDebugger

### Debug Tools

1. **FeatureFlagDebugger**: Debug feature flags in development
2. **BundleAnalyzer**: Analyze bundle size and composition
3. **PerformanceMonitor**: Monitor performance metrics
4. **Error Boundaries**: Catch and handle errors gracefully

## Support

For technical support or questions about the API:

1. Check the troubleshooting section
2. Review the migration guide
3. Examine the test examples
4. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Maintainer**: ExperienceTrack Development Team
