import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { CoverageModal } from './CoverageModal';
import { useTargetedMagicBriefGeneration } from '@/hooks/useMagicBriefs';
import type { MagicBrief } from '@/types/magicBrief';

interface CompactCoverageProgressProps {
  epicOutcomes: string[];
  magicBriefs: MagicBrief[];
  className?: string;
  onBriefGenerated?: () => void;
}

/**
 * Compact progress bar showing learning outcomes coverage
 * Clickable to open detailed coverage modal
 */
export const CompactCoverageProgress: React.FC<CompactCoverageProgressProps> = ({
  epicOutcomes,
  magicBriefs,
  className = '',
  onBriefGenerated
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { generateTargetedMagicBrief } = useTargetedMagicBriefGeneration();

  // Get all learning outcomes covered by magic briefs
  const coveredOutcomes = magicBriefs.flatMap(brief => brief.connected_learning_outcomes || []);
  
  // Find which epic outcomes are covered
  const outcomesCoverage = epicOutcomes.map(epicOutcome => {
    const isCovered = coveredOutcomes.some(coveredOutcome => 
      coveredOutcome.toLowerCase().trim() === epicOutcome.toLowerCase().trim()
    );
    return {
      outcome: epicOutcome,
      covered: isCovered
    };
  });
  
  const totalOutcomes = epicOutcomes.length;
  const coveredCount = outcomesCoverage.filter(item => item.covered).length;
  const coveragePercentage = totalOutcomes > 0 ? (coveredCount / totalOutcomes) * 100 : 0;

  const handleClick = () => {
    setModalOpen(true);
  };

  const handleGenerateTargeted = async (targetOutcome: string) => {
    await generateTargetedMagicBrief(targetOutcome, magicBriefs);
    
    // Notify parent component to refresh data
    if (onBriefGenerated) {
      onBriefGenerated();
    }
  };

  return (
    <>
      <div 
        className={`space-y-2 cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors ${className}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Coverage</span>
          </div>
          <Badge variant={coveragePercentage === 100 ? "default" : "secondary"} className="text-xs">
            {coveredCount}/{totalOutcomes}
          </Badge>
        </div>

        {/* Progress Bar */}
        <Progress 
          value={coveragePercentage} 
          className="h-2"
        />
      </div>

      {/* Coverage Modal */}
      <CoverageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        outcomesCoverage={outcomesCoverage}
        totalOutcomes={totalOutcomes}
        coveredCount={coveredCount}
        coveragePercentage={coveragePercentage}
        onGenerateTargeted={handleGenerateTargeted}
      />
    </>
  );
};
