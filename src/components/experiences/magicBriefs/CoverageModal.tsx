import React, { useState } from 'react';
import { CheckCircle, Circle, Target, Sparkles, Loader2 } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OutcomeCoverage {
  outcome: string;
  covered: boolean;
}

interface CoverageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outcomesCoverage: OutcomeCoverage[];
  totalOutcomes: number;
  coveredCount: number;
  coveragePercentage: number;
  onGenerateTargeted?: (targetOutcome: string) => Promise<void>;
}

/**
 * Modal showing detailed learning outcomes coverage with tabs
 */
export const CoverageModal: React.FC<CoverageModalProps> = ({
  open,
  onOpenChange,
  outcomesCoverage,
  totalOutcomes,
  coveredCount,
  coveragePercentage,
  onGenerateTargeted
}) => {
  const [generatingOutcome, setGeneratingOutcome] = useState<string | null>(null);
  
  const coveredOutcomes = outcomesCoverage.filter(item => item.covered);
  const notCoveredOutcomes = outcomesCoverage.filter(item => !item.covered);

  const handleGenerateTargeted = async (outcome: string) => {
    if (!onGenerateTargeted) return;
    
    console.log('🎯 Starting targeted generation for outcome:', outcome);
    setGeneratingOutcome(outcome);
    try {
      toast.loading(`Generating magic brief for: ${outcome}`, { id: 'targeted-generation' });
      await onGenerateTargeted(outcome);
      console.log('✅ Targeted generation completed for outcome:', outcome);
      toast.success('Targeted magic brief generated successfully!', { id: 'targeted-generation' });
    } catch (error) {
      console.error('❌ Failed to generate targeted magic brief:', error);
      toast.error(error.message || 'Failed to generate targeted magic brief', { id: 'targeted-generation' });
    } finally {
      setGeneratingOutcome(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Learning Outcomes Coverage
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of learning outcomes coverage across magic briefs
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="space-y-3 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={coveragePercentage === 100 ? "default" : "secondary"}>
                {coveredCount}/{totalOutcomes}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {Math.round(coveragePercentage)}% Complete
              </span>
            </div>
          </div>
          
          <Progress value={coveragePercentage} className="h-2" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="covered" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="covered" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Covered ({coveredCount})
            </TabsTrigger>
            <TabsTrigger value="not-covered" className="flex items-center gap-2">
              <Circle className="h-4 w-4" />
              Not Covered ({notCoveredOutcomes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="covered" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              {coveredOutcomes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Circle className="h-8 w-8 mx-auto mb-2" />
                  <p>No learning outcomes have been covered yet.</p>
                  <p className="text-sm">Generate magic briefs to start covering outcomes.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {coveredOutcomes.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800">{item.outcome}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="not-covered" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              {notCoveredOutcomes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-green-800 font-medium">All learning outcomes covered!</p>
                  <p className="text-sm text-green-700">Your magic briefs provide complete coverage.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <strong>Tip:</strong> Click "Generate Brief" to create a targeted magic brief for specific learning outcomes.
                    </p>
                  </div>
                  {notCoveredOutcomes.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <Circle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-orange-800 flex-1">{item.outcome}</span>
                      </div>
                      {onGenerateTargeted && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateTargeted(item.outcome)}
                          disabled={generatingOutcome !== null}
                          className="flex-shrink-0 border-orange-300 text-orange-700 hover:bg-orange-200 hover:border-orange-400"
                        >
                          {generatingOutcome === item.outcome ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 mr-1" />
                              Generate Brief
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
