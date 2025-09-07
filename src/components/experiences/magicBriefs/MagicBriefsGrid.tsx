import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MagicBriefCard } from './MagicBriefCard';
import { MagicBriefPreview } from './MagicBriefPreview';
import type { MagicBrief } from '@/types/magicBrief';

interface MagicBriefsGridProps {
  briefs: MagicBrief[];
  onExpand: (brief: MagicBrief) => void;
  onDelete: (brief: MagicBrief) => void;
  onRegenerate?: (updatedBrief: MagicBrief) => void;
  isLoading?: boolean;
}

/**
 * Grid layout for magic briefs with search and filtering
 * Manages local state for search and preview
 */
export const MagicBriefsGrid: React.FC<MagicBriefsGridProps> = ({
  briefs,
  onExpand,
  onDelete,
  onRegenerate,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'expanded' | 'pending'>('all');
  const [previewBrief, setPreviewBrief] = useState<MagicBrief | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Filter briefs based on search and status
  const filteredBriefs = briefs.filter(brief => {
    const matchesSearch = 
      brief.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brief.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brief.challenge_statement.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'expanded' && brief.expanded) ||
      (statusFilter === 'pending' && !brief.expanded);

    return matchesSearch && matchesStatus;
  });

  const handlePreview = (brief: MagicBrief) => {
    setPreviewBrief(brief);
    setPreviewOpen(true);
  };

  const handleRegenerate = (updatedBrief: MagicBrief) => {
    // Update the preview brief if it's the same one that was regenerated
    if (previewBrief && previewBrief.id === updatedBrief.id) {
      setPreviewBrief(updatedBrief);
    }
    
    // Notify parent component
    if (onRegenerate) {
      onRegenerate(updatedBrief);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-64 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search briefs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="w-48">
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Briefs</SelectItem>
              <SelectItem value="pending">Pending Expansion</SelectItem>
              <SelectItem value="expanded">Expanded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredBriefs.length} of {briefs.length} brief{briefs.length !== 1 ? 's' : ''}
      </div>

      {/* Briefs Grid */}
      {filteredBriefs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {briefs.length === 0 ? 
              'No magic briefs yet. Generate some using the Magic Create button!' :
              'No briefs match your search criteria.'
            }
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBriefs.map((brief) => (
            <MagicBriefCard
              key={brief.id}
              brief={brief}
              onExpand={onExpand}
              onDelete={onDelete}
              onPreview={handlePreview}
            />
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <MagicBriefPreview
        brief={previewBrief}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onExpand={onExpand}
        onRegenerate={handleRegenerate}
      />
    </div>
  );
};
