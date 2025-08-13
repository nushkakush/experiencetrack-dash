#!/usr/bin/env tsx

/**
 * Script to fix payment schedules for existing students
 * This will recalculate payment schedules with proper semester grouping
 */

import { studentPaymentsService } from '../src/services/studentPayments.service';
import { Logger } from '../src/lib/logging/Logger';

const COHORT_ID = 'f56dfcd5-197d-4186-97e9-712311c73bc9'; // Your specific cohort ID

async function fixPaymentSchedules() {
  const logger = Logger.getInstance();
  
  try {
    logger.info('Starting payment schedule fix for cohort:', COHORT_ID);
    
    const result = await studentPaymentsService.recalculatePaymentSchedules(COHORT_ID);
    
    if (result.success) {
      logger.info('Payment schedule fix completed successfully:', result.data);
      console.log('✅ Payment schedules have been fixed successfully!');
      console.log(`📊 ${result.data?.message}`);
    } else {
      logger.error('Payment schedule fix failed:', result.error);
      console.error('❌ Payment schedule fix failed:', result.error);
    }
  } catch (error) {
    logger.error('Error running payment schedule fix:', error);
    console.error('❌ Error running payment schedule fix:', error);
  }
}

// Run the script
fixPaymentSchedules().then(() => {
  console.log('🎉 Script execution completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script execution failed:', error);
  process.exit(1);
});
