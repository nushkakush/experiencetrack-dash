// Payment Services - Modular Architecture
export { PaymentService } from './PaymentService';
export { PaymentValidationService } from './PaymentValidation';
// export { PaymentCalculationsService } from './PaymentCalculations'; // deprecated: replaced by Edge Function `payment-engine`

// Types
export type { PaymentValidationResult, PaymentPlanValidation } from './PaymentValidation';
export type { PaymentCalculationOptions, PaymentBreakdown } from './PaymentCalculations';

// Create and export service instances
import { PaymentService } from './PaymentService';
import { PaymentValidationService } from './PaymentValidation';
// import { PaymentCalculationsService } from './PaymentCalculations';

export const paymentService = new PaymentService();
export const paymentValidation = PaymentValidationService;
// export const paymentCalculations = PaymentCalculationsService; // deprecated
