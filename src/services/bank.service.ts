import { supabase } from '@/integrations/supabase/client';

export interface IndianBank {
  id: string;
  bank_name: string;
  bank_code: string;
  ifsc_code_prefix: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export class BankService {
  static async getIndianBanks(): Promise<IndianBank[]> {
    try {
      console.log('🔍 [BankService] Fetching Indian banks from database...');
      const { data, error } = await supabase
        .from('indian_banks')
        .select('*')
        .eq('is_active', true)
        .order('bank_name');

      console.log('🔍 [BankService] Database response:', {
        dataCount: data?.length || 0,
        error: error?.message,
        hasData: !!data,
      });

      if (error) {
        console.error('🔍 [BankService] Database error:', error);
        throw new Error('Failed to fetch Indian banks');
      }

      console.log('🔍 [BankService] Returning banks:', {
        count: data?.length || 0,
        banks: data?.slice(0, 3) || [],
      });

      return data || [];
    } catch (error) {
      console.error('🔍 [BankService] Error in getIndianBanks:', error);
      throw error;
    }
  }

  static async getBankByName(bankName: string): Promise<IndianBank | null> {
    try {
      const { data, error } = await supabase
        .from('indian_banks')
        .select('*')
        .eq('bank_name', bankName)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching bank by name:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBankByName:', error);
      return null;
    }
  }
}
