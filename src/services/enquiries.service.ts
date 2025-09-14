import { supabase } from '@/integrations/supabase/client';
import type {
  Enquiry,
  CreateEnquiryData,
  UpdateEnquiryData,
  EnquiryFilters,
  EnquiryStats,
  PaginatedEnquiryResponse,
} from '@/types/enquiries';
import { WebflowService } from './webflow.service';
import { APP_CONFIG } from '@/config/constants';

export class EnquiriesService {
  /**
   * Get enquiries with pagination and optional filtering
   */
  static async getEnquiries(
    filters: EnquiryFilters = {}
  ): Promise<PaginatedEnquiryResponse> {
    const requestId = crypto.randomUUID();
    console.log(
      `[EnquiriesService:${requestId}] Getting enquiries with filters:`,
      filters
    );

    // Set default pagination parameters
    const page = filters.page || 1;
    const pageSize =
      filters.pageSize || APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;
    const sortBy = filters.sortBy || 'wf_created_at';
    const sortOrder = filters.sortOrder || 'desc';

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('enquiries')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Handle soft-deleted enquiries filter
    if (filters.show_deleted) {
      // Show only soft-deleted enquiries
      query = query.not('deleted_at', 'is', null);
    } else {
      // Default: show only active enquiries (filter out soft-deleted)
      query = query.is('deleted_at', null);
    }

    // Apply filters

    if (filters.professional_status) {
      console.log(
        `[EnquiriesService:${requestId}] Filtering by professional_status: ${filters.professional_status}`
      );
      query = query.eq('professional_status', filters.professional_status);
    }

    if (filters.relocation_possible) {
      console.log(
        `[EnquiriesService:${requestId}] Filtering by relocation_possible: ${filters.relocation_possible}`
      );
      query = query.eq('relocation_possible', filters.relocation_possible);
    }

    if (filters.investment_willing) {
      console.log(
        `[EnquiriesService:${requestId}] Filtering by investment_willing: ${filters.investment_willing}`
      );
      query = query.eq('investment_willing', filters.investment_willing);
    }

    if (filters.search) {
      console.log(
        `[EnquiriesService:${requestId}] Filtering by search term: ${filters.search}`
      );
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      );
    }

    if (filters.date_from) {
      console.log(
        `[EnquiriesService:${requestId}] Filtering by date_from: ${filters.date_from}`
      );
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      console.log(
        `[EnquiriesService:${requestId}] Filtering by date_to: ${filters.date_to}`
      );
      query = query.lte('created_at', filters.date_to);
    }

    if (filters.form_name) {
      console.log(
        `[EnquiriesService:${requestId}] Filtering by form_name: ${filters.form_name}`
      );
      query = query.eq('form_name', filters.form_name);
    }

    if (filters.lead_source && filters.lead_source !== 'all') {
      console.log(
        `[EnquiriesService:${requestId}] Filtering by lead_source: ${filters.lead_source}`
      );
      if (filters.lead_source === 'paid') {
        // Filter for enquiries with UTM data (indicating paid traffic)
        query = query.or(
          'utm_source.not.is.null,utm_medium.not.is.null,utm_campaign.not.is.null'
        );
      } else if (filters.lead_source === 'non_paid') {
        // Filter for enquiries without UTM data (indicating organic/non-paid traffic)
        query = query
          .is('utm_source', null)
          .is('utm_medium', null)
          .is('utm_campaign', null);
      }
    }

    console.log(`[EnquiriesService:${requestId}] Executing query...`);
    const { data, error, count } = await query;

    if (error) {
      console.error(
        `[EnquiriesService:${requestId}] Error fetching enquiries:`,
        {
          error: error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
      );
      throw new Error('Failed to fetch enquiries');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    console.log(
      `[EnquiriesService:${requestId}] Successfully fetched ${data?.length || 0} enquiries (page ${page}/${totalPages})`
    );

    return {
      data: data || [],
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Get all enquiries without pagination (for backward compatibility)
   * @deprecated Use getEnquiries with pagination instead
   */
  static async getAllEnquiries(
    filters: Omit<
      EnquiryFilters,
      'page' | 'pageSize' | 'sortBy' | 'sortOrder'
    > = {}
  ): Promise<Enquiry[]> {
    const result = await this.getEnquiries({ ...filters, pageSize: 1000 }); // Large page size to get all
    return result.data;
  }

  /**
   * Get a single enquiry by ID
   */
  static async getEnquiryById(id: string): Promise<Enquiry | null> {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching enquiry:', error);
      throw new Error('Failed to fetch enquiry');
    }

    return data;
  }

  /**
   * Create a new enquiry
   */
  static async createEnquiry(enquiryData: CreateEnquiryData): Promise<Enquiry> {
    const { data, error } = await supabase
      .from('enquiries')
      .insert([enquiryData])
      .select()
      .single();

    if (error) {
      console.error('Error creating enquiry:', error);
      throw new Error('Failed to create enquiry');
    }

    return data;
  }

  /**
   * Update an enquiry
   */
  static async updateEnquiry(
    id: string,
    updateData: UpdateEnquiryData
  ): Promise<Enquiry> {
    const { data, error } = await supabase
      .from('enquiries')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating enquiry:', error);
      throw new Error('Failed to update enquiry');
    }

    return data;
  }

  /**
   * Soft delete an enquiry (mark as deleted)
   */
  static async deleteEnquiry(id: string): Promise<void> {
    const { error } = await supabase
      .from('enquiries')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting enquiry:', error);
      throw new Error('Failed to delete enquiry');
    }
  }

  /**
   * Soft delete multiple enquiries (mark as deleted)
   */
  static async deleteEnquiries(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('enquiries')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', ids);

    if (error) {
      console.error('Error deleting enquiries:', error);
      throw new Error('Failed to delete enquiries');
    }
  }

  /**
   * Restore a soft-deleted enquiry
   */
  static async restoreEnquiry(id: string): Promise<void> {
    const { error } = await supabase
      .from('enquiries')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error restoring enquiry:', error);
      throw new Error('Failed to restore enquiry');
    }
  }

  /**
   * Permanently delete an enquiry (hard delete)
   */
  static async permanentDeleteEnquiry(id: string): Promise<void> {
    const { error } = await supabase.from('enquiries').delete().eq('id', id);

    if (error) {
      console.error('Error permanently deleting enquiry:', error);
      throw new Error('Failed to permanently delete enquiry');
    }
  }

  /**
   * Get enquiry statistics using database aggregation for better performance
   */
  static async getEnquiryStats(): Promise<EnquiryStats> {
    const requestId = crypto.randomUUID();
    console.log(
      `[EnquiriesService:${requestId}] Getting enquiry statistics...`
    );

    try {
      // Get total count
      console.log(`[EnquiriesService:${requestId}] Fetching total count...`);
      const { count: totalCount, error: totalError } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null); // Filter out soft-deleted enquiries

      if (totalError) {
        console.error(
          `[EnquiriesService:${requestId}] Total count error:`,
          totalError
        );
        throw totalError;
      }

      // Get leads from last 24 hours (using wf_created_at)
      console.log(
        `[EnquiriesService:${requestId}] Fetching last 24 hours count...`
      );
      const { count: last24HoursCount, error: last24Error } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null) // Filter out soft-deleted enquiries
        .gte(
          'wf_created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        );

      if (last24Error) {
        console.error(
          `[EnquiriesService:${requestId}] Last 24 hours error:`,
          last24Error
        );
        throw last24Error;
      }

      // Get paid leads (with UTM data)
      console.log(
        `[EnquiriesService:${requestId}] Fetching paid leads count...`
      );
      const { count: paidLeadsCount, error: paidError } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null) // Filter out soft-deleted enquiries
        .or(
          'utm_source.not.is.null,utm_medium.not.is.null,utm_campaign.not.is.null'
        );

      if (paidError) {
        console.error(
          `[EnquiriesService:${requestId}] Paid leads error:`,
          paidError
        );
        throw paidError;
      }

      // Get non-paid leads (without UTM data)
      console.log(
        `[EnquiriesService:${requestId}] Fetching non-paid leads count...`
      );
      const { count: nonPaidLeadsCount, error: nonPaidError } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null) // Filter out soft-deleted enquiries
        .is('utm_source', null)
        .is('utm_medium', null)
        .is('utm_campaign', null);

      if (nonPaidError) {
        console.error(
          `[EnquiriesService:${requestId}] Non-paid leads error:`,
          nonPaidError
        );
        throw nonPaidError;
      }

      // Get paid leads from last 24 hours (with UTM data)
      console.log(
        `[EnquiriesService:${requestId}] Fetching paid leads last 24 hours count...`
      );
      const { count: paidLeads24hCount, error: paid24hError } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null) // Filter out soft-deleted enquiries
        .gte(
          'wf_created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        )
        .or(
          'utm_source.not.is.null,utm_medium.not.is.null,utm_campaign.not.is.null'
        );

      if (paid24hError) {
        console.error(
          `[EnquiriesService:${requestId}] Paid leads 24h error:`,
          paid24hError
        );
        throw paid24hError;
      }

      // Get non-paid leads from last 24 hours (without UTM data)
      console.log(
        `[EnquiriesService:${requestId}] Fetching non-paid leads last 24 hours count...`
      );
      const { count: nonPaidLeads24hCount, error: nonPaid24hError } =
        await supabase
          .from('enquiries')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null) // Filter out soft-deleted enquiries
          .gte(
            'wf_created_at',
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          )
          .is('utm_source', null)
          .is('utm_medium', null)
          .is('utm_campaign', null);

      if (nonPaid24hError) {
        console.error(
          `[EnquiriesService:${requestId}] Non-paid leads 24h error:`,
          nonPaid24hError
        );
        throw nonPaid24hError;
      }

      const stats: EnquiryStats = {
        total: totalCount || 0,
        last_24_hours: last24HoursCount || 0,
        paid_leads: paidLeadsCount || 0,
        paid_leads_24h: paidLeads24hCount || 0,
        non_paid_leads: nonPaidLeadsCount || 0,
        non_paid_leads_24h: nonPaidLeads24hCount || 0,
      };

      console.log(`[EnquiriesService:${requestId}] Calculated stats:`, stats);
      return stats;
    } catch (error) {
      console.error(
        `[EnquiriesService:${requestId}] Error fetching enquiry stats:`,
        {
          error: error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          stack: error.stack,
        }
      );
      throw new Error(`Failed to fetch enquiry statistics: ${error.message}`);
    }
  }

  /**
   * Update enquiry status
   */
  static async updateEnquiryStatus(
    id: string,
    status: Enquiry['status']
  ): Promise<Enquiry> {
    return this.updateEnquiry(id, { status });
  }

  /**
   * Get enquiries by status
   */
  static async getEnquiriesByStatus(
    status: Enquiry['status']
  ): Promise<Enquiry[]> {
    return this.getEnquiries({ status });
  }

  /**
   * Search enquiries
   */
  static async searchEnquiries(searchTerm: string): Promise<Enquiry[]> {
    return this.getEnquiries({ search: searchTerm });
  }

  /**
   * Sync enquiries from Webflow form submissions
   */
  static async syncFromWebflow(): Promise<{ synced: number; errors: number }> {
    try {
      const webflowService = this.getWebflowService();
      return await webflowService.syncFormSubmissionsToEnquiries();
    } catch (error) {
      console.error('Error syncing from Webflow:', error);
      throw new Error('Failed to sync from Webflow');
    }
  }

  // Store a single instance of WebflowService to maintain logs
  private static webflowServiceInstance: WebflowService | null = null;

  private static getWebflowService(): WebflowService {
    if (!this.webflowServiceInstance) {
      this.webflowServiceInstance = new WebflowService();
    }
    return this.webflowServiceInstance;
  }

  /**
   * Clear Webflow sync logs
   */
  static clearWebflowSyncLogs() {
    this.getWebflowService().clearSyncLogs();
  }

  /**
   * Get Webflow forms
   */
  static async getWebflowForms() {
    try {
      const webflowService = new WebflowService();
      return await webflowService.getForms();
    } catch (error) {
      console.error('Error fetching Webflow forms:', error);
      throw new Error('Failed to fetch Webflow forms');
    }
  }

  /**
   * Get Webflow form submissions
   */
  static async getWebflowFormSubmissions(
    formId: string,
    limit: number = 100,
    offset: number = 0
  ) {
    try {
      const webflowService = new WebflowService();
      return await webflowService.getFormSubmissions(formId, limit, offset);
    } catch (error) {
      console.error('Error fetching Webflow form submissions:', error);
      throw new Error('Failed to fetch Webflow form submissions');
    }
  }

  /**
   * Get unique form names from enquiries
   */
  static async getFormNames(): Promise<string[]> {
    const { data, error } = await supabase
      .from('enquiries')
      .select('form_name')
      .not('form_name', 'is', null);

    if (error) {
      console.error('Error fetching form names:', error);
      throw new Error('Failed to fetch form names');
    }

    const uniqueFormNames = [
      ...new Set(data?.map(item => item.form_name).filter(Boolean) || []),
    ];
    return uniqueFormNames.sort();
  }

  /**
   * Get count of soft-deleted enquiries
   */
  static async getDeletedEnquiriesCount(): Promise<number> {
    const { count, error } = await supabase
      .from('enquiries')
      .select('*', { count: 'exact', head: true })
      .not('deleted_at', 'is', null);

    if (error) {
      console.error('Error fetching deleted enquiries count:', error);
      throw new Error('Failed to fetch deleted enquiries count');
    }

    return count || 0;
  }
}
