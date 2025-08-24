import { useState, useEffect } from 'react';
import { BankService, IndianBank } from '@/services/bank.service';

export const useIndianBanks = () => {
  const [banks, setBanks] = useState<IndianBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        console.log('🔍 [useIndianBanks] Starting to fetch banks...');
        setLoading(true);
        setError(null);
        const banksData = await BankService.getIndianBanks();
        console.log('🔍 [useIndianBanks] Banks fetched successfully:', {
          count: banksData.length,
          banks: banksData.slice(0, 3), // Show first 3 banks
        });
        setBanks(banksData);
      } catch (err) {
        console.error('🔍 [useIndianBanks] Error fetching banks:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch banks');
        console.error('Error fetching Indian banks:', err);
      } finally {
        setLoading(false);
        console.log('🔍 [useIndianBanks] Loading finished');
      }
    };

    fetchBanks();
  }, []);

  const getBankByName = async (
    bankName: string
  ): Promise<IndianBank | null> => {
    try {
      return await BankService.getBankByName(bankName);
    } catch (err) {
      console.error('Error fetching bank by name:', err);
      return null;
    }
  };

  return {
    banks,
    loading,
    error,
    getBankByName,
    refetch: () => {
      setLoading(true);
      setError(null);
      BankService.getIndianBanks()
        .then(setBanks)
        .catch(err =>
          setError(err instanceof Error ? err.message : 'Failed to fetch banks')
        )
        .finally(() => setLoading(false));
    },
  };
};
