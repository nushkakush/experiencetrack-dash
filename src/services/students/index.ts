/**
 * Student Services Index
 * Centralized exports for all student-related services
 */

// Core student services
export { studentPaymentService } from './StudentPaymentService';
export { studentCommunicationService } from './StudentCommunicationService';

// Re-export types for convenience
export type { StudentPaymentFilters } from './StudentPaymentService';
export type { CommunicationFilters } from './StudentCommunicationService';

// Re-export for backward compatibility
export { default as studentPaymentsService } from '../studentPayments.service';
