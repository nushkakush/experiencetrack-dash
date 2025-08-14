import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bug, X } from 'lucide-react';
import { LifecycleDebugPanel } from './LifecycleDebugPanel';
import { appLifecycleLogger } from '@/lib/logging/AppLifecycleLogger';
import { useLifecycleLogging } from '@/hooks/useLifecycleLogging';

interface DebugButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function DebugButton({ 
  className = '', 
  variant = 'outline',
  size = 'sm'
}: DebugButtonProps) {
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);

  // Use the lifecycle logging hook for this component
  useLifecycleLogging({
    componentName: 'DebugButton',
    trackMount: true,
    trackUnmount: true
  });

  const handleOpenDebugPanel = () => {
    setIsDebugPanelOpen(true);
    appLifecycleLogger.logEvent('focus', {
      message: 'Debug panel opened',
      componentName: 'DebugButton'
    });
  };

  const handleCloseDebugPanel = () => {
    setIsDebugPanelOpen(false);
    appLifecycleLogger.logEvent('blur', {
      message: 'Debug panel closed',
      componentName: 'DebugButton'
    });
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenDebugPanel}
        className={`fixed bottom-4 right-4 z-40 ${className}`}
        title="Open Debug Panel"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug
      </Button>

      <LifecycleDebugPanel
        isVisible={isDebugPanelOpen}
        onClose={handleCloseDebugPanel}
      />
    </>
  );
}

// Floating debug button that's always visible
export function FloatingDebugButton() {
  return <DebugButton />;
}

// Inline debug button for use in components
export function InlineDebugButton({ className = '' }: { className?: string }) {
  return <DebugButton className={className} variant="ghost" size="sm" />;
}
