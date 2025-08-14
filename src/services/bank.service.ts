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
      const { data, error } = await supabase
        .from('indian_banks')
        .select('*')
        .eq('is_active', true)
        .order('bank_name');

      if (error) {
        console.error('Error fetching Indian banks:', error);
        throw new Error('Failed to fetch Indian banks');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getIndianBanks:', error);
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
