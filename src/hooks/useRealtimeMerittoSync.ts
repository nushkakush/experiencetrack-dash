import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';

interface RealtimeSyncOptions {
  debounceMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  enabled?: boolean;
}

interface SyncData {
  profileId: string;
  applicationId?: string;
  syncType?: 'realtime' | 'extended' | 'registration';
  data?: any;
}

export const useRealtimeMerittoSync = (options: RealtimeSyncOptions = {}) => {
  const {
    debounceMs = 2000, // 2 seconds debounce
    maxRetries = 3,
    retryDelayMs = 1000,
    enabled = true
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);
  const lastSyncDataRef = useRef<string>('');

  const logger = Logger.getInstance();

  // Debounced sync function
  const debouncedSync = useCallback(async (syncData: SyncData) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create a unique key for this sync data to avoid duplicate syncs
    const dataKey = JSON.stringify(syncData);
    
    // If this is the same data as last sync, skip it
    if (dataKey === lastSyncDataRef.current) {
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      await performSync(syncData);
    }, debounceMs);
  }, [debounceMs]);

  // Actual sync function with retry logic
  const performSync = useCallback(async (syncData: SyncData) => {
    if (!enabled || isSyncingRef.current) {
      return;
    }

    try {
      isSyncingRef.current = true;
      retryCountRef.current = 0;

      console.log('🚀 [REALTIME SYNC] Starting Meritto sync', {
        profileId: syncData.profileId,
        applicationId: syncData.applicationId,
        syncType: syncData.syncType || 'realtime',
        data: syncData.data
      });

      logger.debug('Starting real-time Meritto sync', {
        profileId: syncData.profileId,
        applicationId: syncData.applicationId,
        syncType: syncData.syncType || 'realtime'
      });

      const { data: syncResult, error: syncError } = await supabase.functions.invoke(
        'merito-registration-sync',
        {
          body: {
            profileId: syncData.profileId,
            applicationId: syncData.applicationId,
            syncType: syncData.syncType || 'realtime',
            ...syncData.data
          }
        }
      );

      if (syncError) {
        console.error('❌ [REALTIME SYNC] Supabase Edge Function Error:', {
          error: syncError,
          message: syncError.message,
          details: syncError.details,
          hint: syncError.hint,
          code: syncError.code,
          profileId: syncData.profileId,
          applicationId: syncData.applicationId
        });
        throw new Error(syncError.message);
      }

      if (syncResult?.success) {
        console.log('✅ [REALTIME SYNC] Meritto sync successful', {
          leadId: syncResult.leadId,
          profileId: syncData.profileId,
          applicationId: syncData.applicationId,
          message: syncResult.message
        });
        
        logger.debug('Real-time Meritto sync successful', {
          leadId: syncResult.leadId,
          profileId: syncData.profileId
        });
        
        // Update last sync data to prevent duplicate syncs
        lastSyncDataRef.current = JSON.stringify(syncData);
        retryCountRef.current = 0;
      } else {
        console.error('❌ [REALTIME SYNC] Meritto API returned unsuccessful result:', {
          result: syncResult,
          message: syncResult?.message || 'Unknown sync error',
          profileId: syncData.profileId,
          applicationId: syncData.applicationId
        });
        throw new Error(syncResult?.message || 'Unknown sync error');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('❌ [REALTIME SYNC] Sync failed:', {
        error: errorMessage,
        errorDetails: error,
        profileId: syncData.profileId,
        applicationId: syncData.applicationId,
        retryCount: retryCountRef.current,
        maxRetries,
        syncData: syncData.data
      });

      logger.warn('Real-time Meritto sync failed', {
        error: errorMessage,
        profileId: syncData.profileId,
        retryCount: retryCountRef.current
      });

      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`🔄 [REALTIME SYNC] Retrying sync (attempt ${retryCountRef.current}/${maxRetries})`, {
          profileId: syncData.profileId,
          retryDelay: retryDelayMs * retryCountRef.current
        });
        
        logger.debug(`Retrying Meritto sync (attempt ${retryCountRef.current}/${maxRetries})`);
        
        setTimeout(() => {
          performSync(syncData);
        }, retryDelayMs * retryCountRef.current);
      } else {
        console.error('💥 [REALTIME SYNC] Max retries exceeded - sync permanently failed', {
          profileId: syncData.profileId,
          applicationId: syncData.applicationId,
          maxRetries,
          finalError: errorMessage,
          syncData: syncData.data
        });
        
        logger.error('Max retries exceeded for Meritto sync', {
          profileId: syncData.profileId,
          maxRetries
        });
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [enabled, maxRetries, retryDelayMs, logger]);

  // Immediate sync (bypasses debouncing)
  const syncImmediately = useCallback(async (syncData: SyncData) => {
    if (!enabled) {
      return;
    }

    // Clear any pending debounced sync
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    await performSync(syncData);
  }, [enabled, performSync]);

  // Sync with profile and application data
  const syncProfileData = useCallback(async (profileId: string, applicationId?: string, additionalData?: any) => {
    const syncData: SyncData = {
      profileId,
      applicationId,
      syncType: 'realtime',
      data: additionalData
    };

    await debouncedSync(syncData);
  }, [debouncedSync]);

  // Sync extended profile data
  const syncExtendedProfile = useCallback(async (profileId: string, applicationId?: string, extendedData?: any) => {
    const syncData: SyncData = {
      profileId,
      applicationId,
      syncType: 'extended',
      data: extendedData
    };

    await debouncedSync(syncData);
  }, [debouncedSync]);

  // Force sync (immediate, no debouncing)
  const forceSync = useCallback(async (profileId: string, applicationId?: string, syncType: 'realtime' | 'extended' | 'registration' = 'realtime') => {
    const syncData: SyncData = {
      profileId,
      applicationId,
      syncType
    };

    await syncImmediately(syncData);
  }, [syncImmediately]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    syncProfileData,
    syncExtendedProfile,
    forceSync,
    syncImmediately,
    isSyncing: isSyncingRef.current
  };
};

export default useRealtimeMerittoSync;
