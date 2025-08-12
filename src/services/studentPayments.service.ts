// Re-export the modular service for backward compatibility
import { StudentPaymentsService } from './studentPayments/StudentPaymentsService';
export { StudentPaymentsService };

// Create and export the singleton instance
const studentPaymentsService = new StudentPaymentsService();
export { studentPaymentsService };
