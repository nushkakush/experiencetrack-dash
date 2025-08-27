import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';
import {
  Equipment,
  EquipmentCategory,
  EquipmentLocation,
  EquipmentBorrowing,
  EquipmentBlacklist,
  EquipmentDamageReport,
  EquipmentReturn,
  CreateEquipmentFormData,
  CreateCategoryFormData,
  CreateLocationFormData,
  EquipmentListResponse,
  CategoryListResponse,
  LocationListResponse,
  BorrowingListResponse,
  CreateBorrowingFormData,
  ReturnEquipmentData,
  CreateBlacklistData,
  CreateDamageReportData,
} from '@/types/equipment';
import { CohortStudent } from '@/types/cohort';
import { ReturnProcessingService } from './returnProcessing.service';

export class EquipmentService {
  // Equipment CRUD operations
  static async getEquipment(
    page: number = 1,
    limit: number = 10,
    search?: string,
    category_id?: string,
    availability_status?: string
  ): Promise<EquipmentListResponse> {
    // Debug logging
    console.log('EquipmentService.getEquipment - search:', search);
    console.log('EquipmentService.getEquipment - category_id:', category_id);
    console.log(
      'EquipmentService.getEquipment - availability_status:',
      availability_status
    );

    let query = supabase
      .from('equipment')
      .select(
        `
        *,
        category:equipment_categories(*),
        location:equipment_locations(*),
        borrowings:equipment_borrowings(
          id,
          status,
          borrowed_at,
          expected_return_date,
          student:cohort_students(
            id,
            first_name,
            last_name,
            email
          )
        )
      `
      )
      .order('created_at', { ascending: false });

    if (search) {
      console.log(
        'EquipmentService.getEquipment - applying search filter:',
        search
      );
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,serial_number.ilike.%${search}%`
      );
    }

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (availability_status) {
      query = query.eq('availability_status', availability_status);
    }

    // Get the data with joins
    const { data, error } = await query.range(
      (page - 1) * limit,
      page * limit - 1
    );

    if (error) {
      throw new Error(`Failed to fetch equipment: ${error.message}`);
    }

    // Get the count separately
    let countQuery = supabase
      .from('equipment')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,serial_number.ilike.%${search}%`
      );
    }

    if (category_id) {
      countQuery = countQuery.eq('category_id', category_id);
    }

    if (availability_status) {
      countQuery = countQuery.eq('availability_status', availability_status);
    }

    const { count } = await countQuery;

    return {
      equipment: data || [],
      total: count || 0,
      page,
      limit,
    };
  }

  static async getEquipmentById(id: string): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .select(
        `
        *,
        category:equipment_categories(*),
        location:equipment_locations(*),
        borrowings:equipment_borrowings(
          id,
          status,
          borrowed_at,
          expected_return_date,
          actual_return_date,
          reason,
          notes,
          issue_condition,
          return_condition,
          student:cohort_students(
            id,
            first_name,
            last_name,
            email
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch equipment: ${error.message}`);
    }

    return data;
  }

  static async createEquipment(
    equipmentData: CreateEquipmentFormData
  ): Promise<Equipment> {
    // Check if serial number already exists (if provided)
    if (equipmentData.serial_number) {
      const { data: existingEquipment, error: checkError } = await supabase
        .from('equipment')
        .select('id, serial_number')
        .eq('serial_number', equipmentData.serial_number)
        .single();

      if (existingEquipment) {
        throw new Error(
          `Equipment with serial number "${equipmentData.serial_number}" already exists`
        );
      }
    }

    const { data, error } = await supabase
      .from('equipment')
      .insert([equipmentData])
      .select(
        `
        *,
        category:equipment_categories(*),
        location:equipment_locations(*)
      `
      )
      .single();

    if (error) {
      // Handle unique constraint violation
      if (
        error.code === '23505' &&
        error.message.includes('equipment_serial_number_unique')
      ) {
        throw new Error(
          `Equipment with serial number "${equipmentData.serial_number}" already exists`
        );
      }
      throw new Error(`Failed to create equipment: ${error.message}`);
    }

    return data;
  }

  static async updateEquipment(
    id: string,
    equipmentData: Partial<CreateEquipmentFormData>
  ): Promise<Equipment> {
    // Check if serial number already exists (if provided and different from current)
    if (equipmentData.serial_number) {
      const { data: existingEquipment, error: checkError } = await supabase
        .from('equipment')
        .select('id, serial_number')
        .eq('serial_number', equipmentData.serial_number)
        .neq('id', id) // Exclude current equipment
        .single();

      if (existingEquipment) {
        throw new Error(
          `Equipment with serial number "${equipmentData.serial_number}" already exists`
        );
      }
    }

    const { data, error } = await supabase
      .from('equipment')
      .upsert([{ id, ...equipmentData }], { onConflict: 'id' })
      .select(
        `
        *,
        category:equipment_categories(*),
        location:equipment_locations(*)
      `
      )
      .single();

    if (error) {
      // Handle unique constraint violation
      if (
        error.code === '23505' &&
        error.message.includes('equipment_serial_number_unique')
      ) {
        throw new Error(
          `Equipment with serial number "${equipmentData.serial_number}" already exists`
        );
      }
      throw new Error(`Failed to update equipment: ${error.message}`);
    }

    return data;
  }

  static async deleteEquipment(id: string): Promise<void> {
    // First check if equipment has any active borrowings
    const { data: activeBorrowings, error: borrowingsError } = await supabase
      .from('equipment_borrowings')
      .select('id, status')
      .eq('equipment_id', id)
      .eq('status', 'active');

    if (borrowingsError) {
      throw new Error(
        `Failed to check equipment borrowings: ${borrowingsError.message}`
      );
    }

    if (activeBorrowings && activeBorrowings.length > 0) {
      throw new Error(
        'Cannot delete equipment: It has active borrowings. Please return the equipment first.'
      );
    }

    // Check for damage reports
    const { data: damageReports, error: damageError } = await supabase
      .from('equipment_damage_reports')
      .select('id')
      .eq('equipment_id', id);

    if (damageError) {
      throw new Error(
        `Failed to check equipment damage reports: ${damageError.message}`
      );
    }

    if (damageReports && damageReports.length > 0) {
      Logger.getInstance().warn(
        'EquipmentService.deleteEquipment - equipment has damage reports',
        {
          equipmentId: id,
          damageReportsCount: damageReports.length,
        }
      );
    }

    // Delete related records in the correct order to avoid foreign key constraint violations
    // 1. Delete equipment audit logs
    const { error: auditError } = await supabase
      .from('equipment_audit_logs')
      .delete()
      .eq('equipment_id', id);

    if (auditError) {
      throw new Error(
        `Failed to delete equipment audit logs: ${auditError.message}`
      );
    }

    // 2. Delete equipment overdue logs
    const { error: overdueError } = await supabase
      .from('equipment_overdue_logs')
      .delete()
      .eq('equipment_id', id);

    if (overdueError) {
      throw new Error(
        `Failed to delete equipment overdue logs: ${overdueError.message}`
      );
    }

    // 3. Delete equipment returns
    const { error: returnsError } = await supabase
      .from('equipment_returns')
      .delete()
      .eq('equipment_id', id);

    if (returnsError) {
      throw new Error(
        `Failed to delete equipment returns: ${returnsError.message}`
      );
    }

    // 4. Delete equipment damage reports
    const { error: damageDeleteError } = await supabase
      .from('equipment_damage_reports')
      .delete()
      .eq('equipment_id', id);

    if (damageDeleteError) {
      throw new Error(
        `Failed to delete equipment damage reports: ${damageDeleteError.message}`
      );
    }

    // 5. Delete equipment borrowings (including returned ones)
    const { error: borrowingsDeleteError } = await supabase
      .from('equipment_borrowings')
      .delete()
      .eq('equipment_id', id);

    if (borrowingsDeleteError) {
      throw new Error(
        `Failed to delete equipment borrowings: ${borrowingsDeleteError.message}`
      );
    }

    // 6. Finally delete the equipment
    const { error: equipmentError } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id);

    if (equipmentError) {
      throw new Error(`Failed to delete equipment: ${equipmentError.message}`);
    }
  }

  // Equipment status update methods
  static async markEquipmentAsLost(id: string): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .update({
        availability_status: 'lost',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        category:equipment_categories(*),
        location:equipment_locations(*)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to mark equipment as lost: ${error.message}`);
    }

    return data;
  }

  static async markEquipmentAsDamaged(id: string): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .update({
        condition_status: 'damaged',
        availability_status: 'maintenance',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        category:equipment_categories(*),
        location:equipment_locations(*)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to mark equipment as damaged: ${error.message}`);
    }

    return data;
  }

  static async markEquipmentAsActive(id: string): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .update({
        condition_status: 'excellent',
        availability_status: 'available',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        category:equipment_categories(*),
        location:equipment_locations(*)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to mark equipment as active: ${error.message}`);
    }

    return data;
  }

  static async markEquipmentAsRetired(id: string): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .update({
        condition_status: 'decommissioned',
        availability_status: 'decommissioned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        category:equipment_categories(*),
        location:equipment_locations(*)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to mark equipment as retired: ${error.message}`);
    }

    return data;
  }

  // Category operations
  static async getCategories(): Promise<CategoryListResponse> {
    const { data, error, count } = await supabase
      .from('equipment_categories')
      .select('*', { count: 'exact' })
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return {
      categories: data || [],
      total: count || 0,
    };
  }

  static async createCategory(
    categoryData: CreateCategoryFormData
  ): Promise<EquipmentCategory> {
    const { data, error } = await supabase
      .from('equipment_categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return data;
  }

  static async updateCategory(
    id: string,
    categoryData: Partial<CreateCategoryFormData>
  ): Promise<EquipmentCategory> {
    const { data, error } = await supabase
      .from('equipment_categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return data;
  }

  static async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('equipment_categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  // Location operations
  static async getLocations(): Promise<LocationListResponse> {
    const { data, error, count } = await supabase
      .from('equipment_locations')
      .select('*', { count: 'exact' })
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch locations: ${error.message}`);
    }

    return {
      locations: data || [],
      total: count || 0,
    };
  }

  static async createLocation(
    locationData: CreateLocationFormData
  ): Promise<EquipmentLocation> {
    const { data, error } = await supabase
      .from('equipment_locations')
      .insert([locationData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create location: ${error.message}`);
    }

    return data;
  }

  static async updateLocation(
    id: string,
    locationData: Partial<CreateLocationFormData>
  ): Promise<EquipmentLocation> {
    const { data, error } = await supabase
      .from('equipment_locations')
      .update(locationData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update location: ${error.message}`);
    }

    return data;
  }

  static async deleteLocation(id: string): Promise<void> {
    const { error } = await supabase
      .from('equipment_locations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete location: ${error.message}`);
    }
  }

  // Equipment statistics
  static async getEquipmentStats() {
    const { data, error } = await supabase
      .from('equipment')
      .select('availability_status, condition_status');

    if (error) {
      throw new Error(`Failed to fetch equipment stats: ${error.message}`);
    }

    const stats = {
      total: data?.length || 0,
      available:
        data?.filter(e => e.availability_status === 'available').length || 0,
      borrowed:
        data?.filter(e => e.availability_status === 'borrowed').length || 0,
      maintenance:
        data?.filter(e => e.availability_status === 'maintenance').length || 0,
      retired:
        data?.filter(e => e.availability_status === 'retired').length || 0,
      lost: data?.filter(e => e.availability_status === 'lost').length || 0,
    };

    return stats;
  }

  // Recent borrowings
  static async getRecentBorrowings(
    limit: number = 5
  ): Promise<EquipmentBorrowing[]> {
    const { data, error } = await supabase
      .from('equipment_borrowings')
      .select(
        `
        *,
        equipment:equipment(*),
        student:cohort_students(*)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent borrowings: ${error.message}`);
    }

    return data || [];
  }

  // Equipment Borrowing Methods
  static async getBorrowings(
    page: number = 1,
    limit: number = 10,
    filters?: {
      student_id?: string;
      equipment_id?: string;
      status?: string;
      cohort_id?: string;
      date_from?: string;
      date_to?: string;
      isOverdue?: boolean; // Add overdue filter
    }
  ): Promise<BorrowingListResponse> {
    let query = supabase.from('equipment_borrowings').select(
      `
        *,
        equipment:equipment(
          *,
          category:equipment_categories(*),
          location:equipment_locations(*)
        ),
        student:cohort_students(*),
        returned_to_user:profiles!equipment_borrowings_returned_to_fkey(*)
      `,
      { count: 'exact' }
    );

    // Apply filters
    if (filters?.student_id) {
      query = query.eq('student_id', filters.student_id);
    }
    if (filters?.equipment_id) {
      query = query.eq('equipment_id', filters.equipment_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date_from) {
      query = query.gte('borrowed_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('borrowed_at', filters.date_to);
    }

    // Apply cohort filter through student join
    if (filters?.cohort_id && filters.cohort_id !== 'all') {
      query = query.eq('student.cohort_id', filters.cohort_id);
    }

    // Note: We'll filter out retired equipment after fetching since Supabase
    // doesn't reliably support filtering on joined tables with neq

    // Handle overdue filter - get active borrowings that are past their due date
    if (filters?.isOverdue) {
      // Get today's date only (without time) for consistent comparison
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('status', 'active').lt('expected_return_date', today);
    }

    const { data, error, count } = await query
      .order('borrowed_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new Error(`Failed to fetch borrowings: ${error.message}`);
    }

    // Filter out retired/decommissioned equipment after fetching
    const filteredData =
      data?.filter(
        borrowing =>
          borrowing.equipment &&
          borrowing.equipment.availability_status !== 'retired' &&
          borrowing.equipment.availability_status !== 'decommissioned'
      ) || [];

    return {
      borrowings: filteredData,
      total: filteredData.length, // Note: This affects pagination but ensures correct filtering
      page,
      limit,
    };
  }

  static async createBorrowing(
    borrowingData: CreateBorrowingFormData
  ): Promise<EquipmentBorrowing[]> {
    const {
      student_id,
      equipment_ids,
      reason,
      expected_return_date,
      expected_return_time,
      notes,
    } = borrowingData;

    // Combine date and time
    const expectedReturnDateTime = `${expected_return_date}T${expected_return_time}`;

    // Get equipment details to capture current condition
    const { data: equipmentData, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, condition_status')
      .in('id', equipment_ids);

    if (equipmentError) {
      throw new Error(
        `Failed to fetch equipment details: ${equipmentError.message}`
      );
    }

    // Create borrowing records for each equipment with issue condition
    const borrowingRecords = equipment_ids.map(equipment_id => {
      const equipment = equipmentData?.find(e => e.id === equipment_id);
      return {
        equipment_id,
        student_id,
        reason,
        expected_return_date: expectedReturnDateTime,
        notes,
        issue_condition: equipment?.condition_status || 'good',
      };
    });

    const { data, error } = await supabase
      .from('equipment_borrowings')
      .insert(borrowingRecords).select(`
        *,
        equipment:equipment(
          *,
          category:equipment_categories(*),
          location:equipment_locations(*)
        ),
        student:cohort_students(*)
      `);

    if (error) {
      throw new Error(`Failed to create borrowing: ${error.message}`);
    }

    // Update equipment availability status to 'borrowed'
    await supabase
      .from('equipment')
      .update({ availability_status: 'borrowed' })
      .in('id', equipment_ids);

    return data || [];
  }

  static async returnEquipment(
    returnData: ReturnEquipmentData
  ): Promise<EquipmentReturn> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const processedBy = user?.id || 'system';

    const result = await ReturnProcessingService.processEquipmentReturn(
      returnData,
      processedBy
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to return equipment');
    }

    if (result.warnings && result.warnings.length > 0) {
      console.warn('Return processing warnings:', result.warnings);
    }

    return result.returnRecord!;
  }

  static async extendBorrowing(
    borrowingId: string,
    newReturnDate: string
  ): Promise<EquipmentBorrowing> {
    const { data, error } = await supabase
      .from('equipment_borrowings')
      .update({ expected_return_date: newReturnDate })
      .eq('id', borrowingId)
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
      .single();

    if (error) {
      throw new Error(`Failed to extend borrowing: ${error.message}`);
    }

    return data;
  }

  static async getOverdueBorrowings(): Promise<EquipmentBorrowing[]> {
    // Get today's date only (without time) for consistent comparison
    const today = new Date().toISOString().split('T')[0];

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
      .eq('status', 'active')
      .lt('expected_return_date', today)
      .order('expected_return_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch overdue borrowings: ${error.message}`);
    }

    // Filter out retired/decommissioned equipment after fetching
    const filteredData =
      data?.filter(
        borrowing =>
          borrowing.equipment &&
          borrowing.equipment.availability_status !== 'retired' &&
          borrowing.equipment.availability_status !== 'decommissioned'
      ) || [];

    return filteredData;
  }

  static async getStudentBorrowingHistory(
    studentId: string
  ): Promise<EquipmentBorrowing[]> {
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
        student:cohort_students(*),
        returned_to_user:profiles!equipment_borrowings_returned_to_fkey(*)
      `
      )
      .eq('student_id', studentId)
      .order('borrowed_at', { ascending: false });

    if (error) {
      throw new Error(
        `Failed to fetch student borrowing history: ${error.message}`
      );
    }

    // Filter out retired/decommissioned equipment after fetching
    const filteredData =
      data?.filter(
        borrowing =>
          borrowing.equipment &&
          borrowing.equipment.availability_status !== 'retired' &&
          borrowing.equipment.availability_status !== 'decommissioned'
      ) || [];

    return filteredData;
  }

  static async deleteBorrowing(borrowingId: string): Promise<void> {
    // First, get the borrowing record to check if it's active and get equipment info
    const { data: borrowing, error: fetchError } = await supabase
      .from('equipment_borrowings')
      .select('id, equipment_id, status')
      .eq('id', borrowingId)
      .single();

    if (fetchError) {
      throw new Error(
        `Failed to fetch borrowing record: ${fetchError.message}`
      );
    }

    if (!borrowing) {
      throw new Error('Borrowing record not found');
    }

    // Only allow deletion of active borrowings
    if (borrowing.status !== 'active') {
      throw new Error('Only active borrowings can be deleted');
    }

    // Start a transaction to delete the borrowing and update equipment status
    const { error: deleteError } = await supabase
      .from('equipment_borrowings')
      .delete()
      .eq('id', borrowingId);

    if (deleteError) {
      throw new Error(`Failed to delete borrowing: ${deleteError.message}`);
    }

    // Update equipment status back to 'available'
    const { error: updateError } = await supabase
      .from('equipment')
      .update({ availability_status: 'available' })
      .eq('id', borrowing.equipment_id);

    if (updateError) {
      throw new Error(
        `Failed to update equipment status: ${updateError.message}`
      );
    }
  }

  static async getAvailableEquipment(): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from('equipment')
      .select(
        `
        *,
        category:equipment_categories(*),
        location:equipment_locations(*)
      `
      )
      .eq('availability_status', 'available')
      .in('condition_status', ['excellent', 'good', 'poor'])
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch available equipment: ${error.message}`);
    }

    return data || [];
  }

  // Equipment Blacklist Methods
  static async getCohortStudents(cohortId: string): Promise<CohortStudent[]> {
    const { data, error } = await supabase
      .from('cohort_students')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('dropped_out_status', 'active')
      .order('first_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch cohort students: ${error.message}`);
    }

    return data || [];
  }

  static async getBlacklistedStudents(): Promise<EquipmentBlacklist[]> {
    const { data, error } = await supabase
      .from('equipment_blacklist')
      .select(
        `
        *,
        student:cohort_students(
          *,
          cohort:cohorts(*)
        ),
        blacklisted_by_user:profiles!equipment_blacklist_blacklisted_by_fkey(*)
      `
      )
      .eq('is_active', true)
      .order('blacklisted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch blacklisted students: ${error.message}`);
    }

    return data || [];
  }

  static async blacklistStudent(
    blacklistData: CreateBlacklistData
  ): Promise<EquipmentBlacklist> {
    const { data, error } = await supabase
      .from('equipment_blacklist')
      .insert({
        ...blacklistData,
        blacklisted_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select(
        `
        *,
        student:cohort_students(*),
        blacklisted_by_user:profiles!equipment_blacklist_blacklisted_by_fkey(*)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to blacklist student: ${error.message}`);
    }

    return data;
  }

  static async removeFromBlacklist(blacklistId: string): Promise<void> {
    const { error } = await supabase
      .from('equipment_blacklist')
      .update({ is_active: false })
      .eq('id', blacklistId);

    if (error) {
      throw new Error(`Failed to remove from blacklist: ${error.message}`);
    }
  }

  // Equipment Damage Report Methods
  static async createDamageReport(
    damageData: CreateDamageReportData
  ): Promise<EquipmentDamageReport> {
    const { data, error } = await supabase
      .from('equipment_damage_reports')
      .insert({
        ...damageData,
        reported_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select(
        `
        *,
        equipment:equipment(
          *,
          category:equipment_categories(*),
          location:equipment_locations(*)
        ),
        borrowing:equipment_borrowings(*),
        reported_by_user:profiles!equipment_damage_reports_reported_by_fkey(*)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create damage report: ${error.message}`);
    }

    // Update equipment status to 'maintenance' when damage is reported
    // But only if the equipment is currently available or borrowed
    // Preserve 'lost' and 'damaged' statuses
    await supabase
      .from('equipment')
      .update({ availability_status: 'maintenance' })
      .eq('id', damageData.equipment_id)
      .in('availability_status', ['available', 'borrowed']);

    return data;
  }

  static async getDamageReports(): Promise<EquipmentDamageReport[]> {
    const { data, error } = await supabase
      .from('equipment_damage_reports')
      .select(
        `
        *,
        equipment:equipment(
          *,
          category:equipment_categories(*),
          location:equipment_locations(*)
        ),
        borrowing:equipment_borrowings(*),
        reported_by_user:profiles!equipment_damage_reports_reported_by_fkey(*),
        resolved_by_user:profiles!equipment_damage_reports_resolved_by_fkey(*)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch damage reports: ${error.message}`);
    }

    return data || [];
  }

  static async updateDamageReportStatus(
    reportId: string,
    status: string,
    resolvedBy?: string
  ): Promise<EquipmentDamageReport> {
    const updateData: any = { status };

    if (status === 'resolved' && resolvedBy) {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = resolvedBy;
    }

    const { data, error } = await supabase
      .from('equipment_damage_reports')
      .update(updateData)
      .eq('id', reportId)
      .select(
        `
        *,
        equipment:equipment(
          *,
          category:equipment_categories(*),
          location:equipment_locations(*)
        ),
        borrowing:equipment_borrowings(*),
        reported_by_user:profiles!equipment_damage_reports_reported_by_fkey(*),
        resolved_by_user:profiles!equipment_damage_reports_resolved_by_fkey(*)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to update damage report: ${error.message}`);
    }

    return data;
  }
}
