import React, { useState, useEffect, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PartialPaymentToggleProps {
  studentId: string;
  installmentKey: string; // Format: "semester-1-installment-0"
  onToggle?: (enabled: boolean) => void;
  disabled?: boolean;
}

export const PartialPaymentToggle: React.FC<PartialPaymentToggleProps> = ({
  studentId,
  installmentKey,
  onToggle,
  disabled = false,
}) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadCurrentSetting = useCallback(async () => {
    try {
      setInitialLoading(true);
      console.log('🔧 PartialPaymentToggle - Loading config:', { studentId, installmentKey });
      
      // Get student payment record
      const { data: studentPayment, error: studentPaymentError } = await supabase
        .from('student_payments')
        .select('allow_partial_payments_json')
        .eq('student_id', studentId)
        .single();

      if (studentPaymentError) {
        console.error('🚨 [PartialPaymentToggle] Error loading student payment:', studentPaymentError);
        setEnabled(false);
        return;
      }

      const config = studentPayment?.allow_partial_payments_json || {};
      const currentValue = config[installmentKey] || false;
      
      console.log('✅ [PartialPaymentToggle] Successfully loaded config:', {
        config,
        installmentKey,
        currentValue,
        configType: typeof config,
        directLookup: config[installmentKey],
      });
      
      setEnabled(currentValue);
    } catch (error) {
      console.error('🚨 [PartialPaymentToggle] Exception loading partial payment setting:', error);
      setEnabled(false);
    } finally {
      setInitialLoading(false);
    }
  }, [studentId, installmentKey]);

  // Load current setting on mount
  useEffect(() => {
    if (studentId && installmentKey) {
      loadCurrentSetting();
    }
  }, [studentId, installmentKey, loadCurrentSetting]);

  const handleToggle = async (newValue: boolean) => {
    if (disabled || loading) return;

    // ✨ OPTIMISTIC UPDATE: Update UI immediately
    const previousValue = enabled;
    setEnabled(newValue);
    onToggle?.(newValue);
    console.log('🔧 [PartialPaymentToggle] Optimistic update applied:', newValue);

    try {
      // Set subtle loading state (won't affect main UI)
      setLoading(true);
      console.log('🔧 PartialPaymentToggle - Updating config:', { studentId, installmentKey, allowPartialPayments: newValue });
      
      // Get student payment record
      const { data: studentPayment, error: studentPaymentError } = await supabase
        .from('student_payments')
        .select('id, allow_partial_payments_json')
        .eq('student_id', studentId)
        .single();

      if (studentPaymentError) {
        console.error('🚨 [PartialPaymentToggle] Error loading student payment:', studentPaymentError);
        // ❌ REVERT: Restore previous state on error
        setEnabled(previousValue);
        onToggle?.(previousValue);
        toast.error('Failed to update partial payment setting');
        return;
      }

      // Update the specific installment setting
      const currentConfig = studentPayment?.allow_partial_payments_json || {};
      const updatedConfig = {
        ...currentConfig,
        [installmentKey]: newValue,
      };

      const { error: updateError } = await supabase
        .from('student_payments')
        .update({ allow_partial_payments_json: updatedConfig })
        .eq('id', studentPayment.id);

      if (updateError) {
        console.error('🚨 [PartialPaymentToggle] Error updating partial payment setting:', updateError);
        // ❌ REVERT: Restore previous state on error
        setEnabled(previousValue);
        onToggle?.(previousValue);
        toast.error('Failed to update partial payment setting');
        return;
      }

      console.log('✅ [PartialPaymentToggle] Successfully updated config:', { updatedConfig });
      // ✅ SUCCESS: UI already shows correct state, just confirm
      toast.success(`Partial payments ${newValue ? 'enabled' : 'disabled'}`);

    } catch (error) {
      console.error('🚨 [PartialPaymentToggle] Exception during toggle update:', error);
      // ❌ REVERT: Restore previous state on exception
      setEnabled(previousValue);
      onToggle?.(previousValue);
      toast.error('Failed to update partial payment setting');
    } finally {
      setLoading(false);
    }
  };

  // Debug log state changes only (minimal logging to prevent extra renders)
  useEffect(() => {
    console.log('🔧 [PartialPaymentToggle] State:', { installmentKey, enabled });
  }, [installmentKey, enabled]);

  if (initialLoading) {
    return (
      <div className="flex items-center space-x-1">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/60" />
        <span className="text-xs text-muted-foreground/60">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1.5">
      <Switch
        id={`partial-payment-${installmentKey}`}
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={disabled}
        className="scale-75" // Make the switch smaller
      />
      <span className="text-xs text-muted-foreground/70">
        Partial {enabled ? 'ON' : 'OFF'}
      </span>
    </div>
  );
};
