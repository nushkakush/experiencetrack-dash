import { supabase } from '@/integrations/supabase/client';
import {
  ReturnEquipmentData,
  EquipmentBorrowing,
  EquipmentReturn,
} from '@/types/equipment';
import { toast } from 'sonner';

export interface ReturnProcessingResult {
  success: boolean;
  returnRecord?: EquipmentReturn;
  error?: string;
  warnings?: string[];
}

export interface ReturnValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ReturnProcessingService {
  /**
   * Process equipment return with comprehensive validation and processing
   */
  static async processEquipmentReturn(
    returnData: ReturnEquipmentData,
    processedBy: string
  ): Promise<ReturnProcessingResult> {
    try {
      // Step 1: Validate return data
      const validation = await this.validateReturnData(returnData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
          warnings: validation.warnings,
        };
      }

      // Step 2: Get borrowing record
      const borrowing = await this.getBorrowingRecord(returnData.borrowing_id);
      if (!borrowing) {
        return {
          success: false,
          error: 'Borrowing record not found',
        };
      }

      // Step 3: Check if already returned
      if (borrowing.status === 'returned') {
        return {
          success: false,
          error: 'Equipment has already been returned',
        };
      }

      // Step 4: Process the return
      const returnRecord = await this.createReturnRecord(
        returnData,
        borrowing,
        processedBy
      );

      // Step 5: Update borrowing status
      await this.updateBorrowingStatus(
        returnData.borrowing_id,
        'returned',
        returnRecord.id,
        returnData.condition
      );

      // Step 6: Update equipment availability, condition, and location
      await this.updateEquipmentAvailability(
        borrowing.equipment_id,
        true,
        returnData.condition,
        returnData.new_location_id
      );

      // Step 7: Handle overdue processing if applicable
      const overdueWarnings = await this.handleOverdueProcessing(
        borrowing,
        returnData
      );

      // Step 8: Create audit log
      await this.createAuditLog(
        returnData,
        borrowing,
        processedBy,
        'return_processed'
      );

      // Step 9: Send notifications
      await this.sendReturnNotifications(borrowing, returnRecord, processedBy);

      return {
        success: true,
        returnRecord,
        warnings: [...validation.warnings, ...overdueWarnings],
      };
    } catch (error) {
      console.error('Error processing equipment return:', error);

      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to process equipment return';

      if (
        error.message?.includes('permission denied') ||
        error.message?.includes('row-level security')
      ) {
        errorMessage =
          'Permission denied. You need equipment manager role to perform this action.';
      } else if (error.message?.includes('foreign key constraint')) {
        errorMessage = 'Database constraint error. Please contact support.';
      } else if (
        error.message?.includes('column') &&
        error.message?.includes('not found')
      ) {
        errorMessage = 'Database schema error. Please contact support.';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate return data before processing
   */
  static async validateReturnData(
    returnData: ReturnEquipmentData
  ): Promise<ReturnValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!returnData.borrowing_id) {
      errors.push('Borrowing ID is required');
    }

    if (!returnData.condition) {
      errors.push('Equipment condition is required');
    }

    if (!returnData.returned_at) {
      errors.push('Return date is required');
    }

    // Condition validation
    const validConditions = ['excellent', 'good', 'poor', 'damaged'];
    if (
      returnData.condition &&
      !validConditions.includes(returnData.condition)
    ) {
      errors.push('Invalid equipment condition');
    }

    // Notes length validation
    if (returnData.notes && returnData.notes.length > 1000) {
      errors.push('Return notes cannot exceed 1000 characters');
    }

    // Check if borrowing exists and is active
    if (returnData.borrowing_id) {
      const borrowing = await this.getBorrowingRecord(returnData.borrowing_id);
      if (!borrowing) {
        errors.push('Borrowing record not found');
      } else if (borrowing.status === 'returned') {
        errors.push('Equipment has already been returned');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get borrowing record with equipment and student details
   */
  static async getBorrowingRecord(
    borrowingId: string
  ): Promise<EquipmentBorrowing | null> {
    const { data, error } = await supabase
      .from('equipment_borrowings')
      .select(
        `
        *,
        equipment:equipment(
          *,
          category:equipment_categories(*),
          location:equipment_locations(*)
        ),
        student:cohort_students(*)
      `
      )
      .eq('id', borrowingId)
      .single();

    if (error) {
      console.error('Error fetching borrowing record:', error);
      return null;
    }

    return data;
  }

  /**
   * Create return record
   */
  static async createReturnRecord(
    returnData: ReturnEquipmentData,
    borrowing: EquipmentBorrowing,
    processedBy: string
  ): Promise<EquipmentReturn> {
    // Only include processed_by if it's a valid UUID (not 'system')
    const insertData: any = {
      borrowing_id: returnData.borrowing_id,
      equipment_id: borrowing.equipment_id,
      student_id: borrowing.student_id,
      returned_at: returnData.returned_at,
      condition: returnData.condition,
      notes: returnData.notes,
      overdue_days: this.calculateOverdueDays(
        borrowing.expected_return_date,
        returnData.returned_at
      ),
    };

    // Only add processed_by if it's a valid UUID and exists in profiles table
    if (
      processedBy &&
      processedBy !== 'system' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        processedBy
      )
    ) {
      // Verify the user exists in profiles table before adding processed_by
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', processedBy)
        .single();

      if (profile) {
        insertData.processed_by = profile.id;
      }
    }

    const { data, error } = await supabase
      .from('equipment_returns')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create return record: ${error.message}`);
    }

    return data;
  }

  /**
   * Update borrowing status
   */
  static async updateBorrowingStatus(
    borrowingId: string,
    status: string,
    returnId: string,
    returnCondition: string
  ): Promise<void> {
    const { error } = await supabase
      .from('equipment_borrowings')
      .update({
        status: status,
        actual_return_date: new Date().toISOString(),
        return_id: returnId,
        return_condition: returnCondition,
      })
      .eq('id', borrowingId);

    if (error) {
      if (
        error.message?.includes('permission denied') ||
        error.message?.includes('row-level security')
      ) {
        throw new Error(
          'Permission denied. You need equipment manager role to update borrowing status.'
        );
      }
      throw new Error(`Failed to update borrowing status: ${error.message}`);
    }
  }

  /**
   * Update equipment availability, condition, and location
   */
  static async updateEquipmentAvailability(
    equipmentId: string,
    available: boolean,
    condition?: string,
    newLocationId?: string
  ): Promise<void> {
    const updateData: any = {
      availability_status: available ? 'available' : 'borrowed',
    };

    if (condition) {
      updateData.condition_status = condition;
    }

    if (newLocationId) {
      updateData.location_id = newLocationId;
    }

    const { error } = await supabase
      .from('equipment')
      .update(updateData)
      .eq('id', equipmentId);

    if (error) {
      if (
        error.message?.includes('permission denied') ||
        error.message?.includes('row-level security')
      ) {
        throw new Error(
          'Permission denied. You need equipment manager role to update equipment.'
        );
      }
      throw new Error(`Failed to update equipment: ${error.message}`);
    }
  }

  /**
   * Handle overdue processing
   */
  static async handleOverdueProcessing(
    borrowing: EquipmentBorrowing,
    returnData: ReturnEquipmentData
  ): Promise<string[]> {
    const warnings: string[] = [];
    const overdueDays = this.calculateOverdueDays(
      borrowing.expected_return_date,
      returnData.returned_at
    );

    if (overdueDays > 0) {
      warnings.push(`Equipment was returned ${overdueDays} day(s) late`);

      // Log overdue return for reporting
      await this.logOverdueReturn(borrowing, overdueDays);
    }

    return warnings;
  }

  /**
   * Calculate overdue days
   */
  static calculateOverdueDays(
    expectedReturnDate: string,
    actualReturnDate: string
  ): number {
    const expected = new Date(expectedReturnDate);
    const actual = new Date(actualReturnDate);
    const diffTime = actual.getTime() - expected.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Log overdue return for reporting
   */
  static async logOverdueReturn(
    borrowing: EquipmentBorrowing,
    overdueDays: number
  ): Promise<void> {
    const { error } = await supabase.from('equipment_overdue_logs').insert({
      borrowing_id: borrowing.id,
      equipment_id: borrowing.equipment_id,
      student_id: borrowing.student_id,
      overdue_days: overdueDays,
      logged_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error logging overdue return:', error);
    }
  }

  /**
   * Create audit log entry
   */
  static async createAuditLog(
    returnData: ReturnEquipmentData,
    borrowing: EquipmentBorrowing,
    processedBy: string,
    action: string
  ): Promise<void> {
    const auditData: any = {
      action: action,
      equipment_id: borrowing.equipment_id,
      borrowing_id: borrowing.id,
      student_id: borrowing.student_id,
      details: {
        condition: returnData.condition,
        notes: returnData.notes,
        returned_at: returnData.returned_at,
        new_location_id: returnData.new_location_id,
      },
      created_at: new Date().toISOString(),
    };

    // Only add performed_by if it's a valid UUID and exists in profiles table
    if (
      processedBy &&
      processedBy !== 'system' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        processedBy
      )
    ) {
      // Verify the user exists in profiles table before adding performed_by
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', processedBy)
        .single();

      if (profile) {
        auditData.performed_by = profile.id;
      }
    }

    const { error } = await supabase
      .from('equipment_audit_logs')
      .insert(auditData);

    if (error) {
      console.error('Error creating audit log:', error);
    }
  }

  /**
   * Send return notifications
   */
  static async sendReturnNotifications(
    borrowing: EquipmentBorrowing,
    returnRecord: EquipmentReturn,
    processedBy: string
  ): Promise<void> {
    try {
      // Send notification to student (if they have email)
      if (borrowing.student?.email) {
        await this.sendStudentReturnNotification(borrowing, returnRecord);
      }

      // Send notification to equipment manager
      await this.sendManagerReturnNotification(
        borrowing,
        returnRecord,
        processedBy
      );
    } catch (error) {
      console.error('Error sending return notifications:', error);
    }
  }

  /**
   * Send notification to student
   */
  static async sendStudentReturnNotification(
    borrowing: EquipmentBorrowing,
    returnRecord: EquipmentReturn
  ): Promise<void> {
    // This would integrate with your notification system
    // For now, we'll just log it
    console.log(
      `Return notification sent to student: ${borrowing.student?.email}`
    );
  }

  /**
   * Send notification to equipment manager
   */
  static async sendManagerReturnNotification(
    borrowing: EquipmentBorrowing,
    returnRecord: EquipmentReturn,
    processedBy: string
  ): Promise<void> {
    // This would integrate with your notification system
    // For now, we'll just log it
    console.log(
      `Return notification sent to manager for equipment: ${borrowing.equipment?.name}`
    );
  }

  /**
   * Get return history for equipment
   */
  static async getEquipmentReturnHistory(
    equipmentId: string
  ): Promise<EquipmentReturn[]> {
    const { data, error } = await supabase
      .from('equipment_returns')
      .select(
        `
        *,
        borrowing:equipment_borrowings(
          *,
          student:cohort_students(*)
        )
      `
      )
      .eq('equipment_id', equipmentId)
      .order('returned_at', { ascending: false });

    if (error) {
      console.error('Error fetching return history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get return statistics
   */
  static async getReturnStatistics(): Promise<{
    totalReturns: number;
    overdueReturns: number;
    damagedReturns: number;
    averageReturnTime: number;
  }> {
    const { data: returns, error } = await supabase
      .from('equipment_returns')
      .select('*');

    if (error) {
      console.error('Error fetching return statistics:', error);
      return {
        totalReturns: 0,
        overdueReturns: 0,
        damagedReturns: 0,
        averageReturnTime: 0,
      };
    }

    const totalReturns = returns?.length || 0;
    const overdueReturns = returns?.filter(r => r.overdue_days > 0).length || 0;
    const damagedReturns =
      returns?.filter(r => ['poor', 'damaged'].includes(r.condition)).length ||
      0;

    const averageReturnTime =
      returns?.length > 0
        ? returns.reduce((sum, r) => sum + (r.overdue_days || 0), 0) /
          returns.length
        : 0;

    return {
      totalReturns,
      overdueReturns,
      damagedReturns,
      averageReturnTime,
    };
  }
}
