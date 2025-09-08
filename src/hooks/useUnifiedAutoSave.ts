import { useCallback, useEffect, useRef } from 'react';
import { ProfileExtendedService } from '@/services/profileExtended.service';
import { ProfileExtendedUpdate } from '@/types/profileExtended';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseUnifiedAutoSaveProps {
  profileId: string;
  debounceMs?: number;
  showToast?: boolean;
}

interface PendingChanges {
  profiles: Record<string, any>;
  profileExtended: Partial<ProfileExtendedUpdate>;
}

export const useUnifiedAutoSave = ({
  profileId,
  debounceMs = 1000,
  showToast = false,
}: UseUnifiedAutoSaveProps) => {
  const service = ProfileExtendedService.getInstance();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const pendingChangesRef = useRef<PendingChanges>({
    profiles: {},
    profileExtended: {},
  });

  const saveData = useCallback(
    async (
      updates: {
        profiles?: Record<string, any>;
        profileExtended?: Partial<ProfileExtendedUpdate>;
      },
      immediate = false
    ) => {
      try {
        // Merge with pending changes
        if (updates.profiles) {
          pendingChangesRef.current.profiles = {
            ...pendingChangesRef.current.profiles,
            ...updates.profiles,
          };
        }
        if (updates.profileExtended) {
          pendingChangesRef.current.profileExtended = {
            ...pendingChangesRef.current.profileExtended,
            ...updates.profileExtended,
          };
        }

        if (immediate) {
          // Save immediately
          await savePendingChanges();
        } else {
          // Debounce the save operation
          debouncedSave();
        }
      } catch (error) {
        console.error('Unified auto-save failed:', error);
        if (showToast) {
          toast.error('Failed to save changes');
        }
      }
    },
    [profileId, debounceMs, showToast]
  );

  const debouncedSave = useCallback(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      savePendingChanges();
    }, debounceMs);
  }, [debounceMs]);

  const savePendingChanges = useCallback(async () => {
    if (isSavingRef.current) {
      return;
    }

    const profilesChanges = pendingChangesRef.current.profiles;
    const profileExtendedChanges = pendingChangesRef.current.profileExtended;

    // Check if there are any changes to save
    if (
      Object.keys(profilesChanges).length === 0 &&
      Object.keys(profileExtendedChanges).length === 0
    ) {
      return;
    }

    isSavingRef.current = true;

    // Clear pending changes
    pendingChangesRef.current = {
      profiles: {},
      profileExtended: {},
    };

    try {
      // Save profiles changes
      if (Object.keys(profilesChanges).length > 0) {
        const { error: profilesError } = await supabase
          .from('profiles')
          .update(profilesChanges)
          .eq('id', profileId);

        if (profilesError) {
          console.error('Error saving profiles data:', profilesError);
          // Put changes back in pending queue for retry
          pendingChangesRef.current.profiles = {
            ...pendingChangesRef.current.profiles,
            ...profilesChanges,
          };
        } else {
          console.log('Successfully saved profiles data:', profilesChanges);
        }
      }

      // Save profile_extended changes
      if (Object.keys(profileExtendedChanges).length > 0) {
        await service.updateProfileExtended(
          profileId,
          profileExtendedChanges,
          true
        );
      }

      if (showToast) {
        toast.success('Changes saved');
      }
    } catch (error) {
      console.error('Error saving pending changes:', error);
      if (showToast) {
        toast.error('Failed to save changes');
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [profileId, service, showToast]);

  const handleFieldChange = useCallback(
    (
      field: string,
      value: any,
      table: 'profiles' | 'profileExtended' = 'profileExtended'
    ) => {
      if (table === 'profiles') {
        saveData({ profiles: { [field]: value } });
      } else {
        saveData({
          profileExtended: { [field as keyof ProfileExtendedUpdate]: value },
        });
      }
    },
    [saveData]
  );

  const handleFieldBlur = useCallback(
    (
      field: string,
      value: any,
      table: 'profiles' | 'profileExtended' = 'profileExtended'
    ) => {
      if (table === 'profiles') {
        saveData({ profiles: { [field]: value } }, true);
      } else {
        saveData(
          {
            profileExtended: { [field as keyof ProfileExtendedUpdate]: value },
          },
          true
        );
      }
    },
    [saveData]
  );

  const handleDateOfBirthChange = useCallback(
    (dateOfBirth: { day: string; month: string; year: string }) => {
      if (dateOfBirth.day && dateOfBirth.month && dateOfBirth.year) {
        const dateOfBirthString = `${dateOfBirth.year}-${dateOfBirth.month.padStart(2, '0')}-${dateOfBirth.day.padStart(2, '0')}`;
        saveData({ profiles: { date_of_birth: dateOfBirthString } });
      }
    },
    [saveData]
  );

  const forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await savePendingChanges();
  }, [savePendingChanges]);

  const hasUnsavedChanges = useCallback(() => {
    return (
      Object.keys(pendingChangesRef.current.profiles).length > 0 ||
      Object.keys(pendingChangesRef.current.profileExtended).length > 0
    );
  }, []);

  const getPendingChangesCount = useCallback(() => {
    return (
      Object.keys(pendingChangesRef.current.profiles).length +
      Object.keys(pendingChangesRef.current.profileExtended).length
    );
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    handleFieldChange,
    handleFieldBlur,
    handleDateOfBirthChange,
    forceSave,
    hasUnsavedChanges,
    getPendingChangesCount,
    isSaving: isSavingRef.current,
  };
};
