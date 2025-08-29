import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mail, MessageCircle } from 'lucide-react';
import {
  CommunicationPreferencesService,
  CommunicationPreferences,
} from '@/services/communicationPreferences.service';
import { Skeleton } from '@/components/ui/skeleton';

interface CommunicationPreferencesProps {
  studentId: string;
}

export const CommunicationPreferences: React.FC<
  CommunicationPreferencesProps
> = ({ studentId }) => {
  const [preferences, setPreferences] =
    useState<CommunicationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [studentId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs =
        await CommunicationPreferencesService.getPreferences(studentId);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (
    channel: 'email' | 'whatsapp',
    enabled: boolean
  ) => {
    // Optimistic update - immediately update the UI
    if (preferences) {
      const updatedPreferences = {
        ...preferences,
        automated_communications: {
          ...preferences.automated_communications,
          [channel]: {
            ...preferences.automated_communications[channel],
            enabled,
          },
        },
      };
      setPreferences(updatedPreferences);
    }

    const updateKey = `automated_${channel}`;
    setUpdating(updateKey);

    try {
      const success = await CommunicationPreferencesService.updatePreference({
        studentId,
        channel,
        type: 'automated',
        enabled,
      });

      if (!success) {
        // Revert optimistic update on failure
        await loadPreferences();
      }
    } catch (error) {
      // Revert optimistic update on error
      await loadPreferences();
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Mail className='h-4 w-4 text-muted-foreground' />
            <Label className='text-sm'>Email Reminders</Label>
          </div>
          <Switch disabled />
        </div>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <MessageCircle className='h-4 w-4 text-muted-foreground' />
            <Label className='text-sm'>WhatsApp Reminders</Label>
          </div>
          <Switch disabled />
        </div>
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className='space-y-3'>
      {/* Email Automated */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Mail className='h-4 w-4 text-muted-foreground' />
          <Label htmlFor='email-automated' className='text-sm'>
            Email Reminders
          </Label>
        </div>
        <Switch
          id='email-automated'
          checked={preferences.automated_communications.email.enabled}
          onCheckedChange={enabled => handleToggle('email', enabled)}
          disabled={updating === 'automated_email'}
        />
      </div>

      {/* WhatsApp Automated */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <MessageCircle className='h-4 w-4 text-muted-foreground' />
          <Label htmlFor='whatsapp-automated' className='text-sm'>
            WhatsApp Reminders
          </Label>
        </div>
        <Switch
          id='whatsapp-automated'
          checked={preferences.automated_communications.whatsapp.enabled}
          onCheckedChange={enabled => handleToggle('whatsapp', enabled)}
          disabled={updating === 'automated_whatsapp'}
        />
      </div>
    </div>
  );
};
