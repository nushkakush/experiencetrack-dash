import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Eye, EyeOff } from 'lucide-react';

interface FeatureFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showDeprecated: boolean;
  onShowDeprecatedChange: (value: boolean) => void;
  showExperimental: boolean;
  onShowExperimentalChange: (value: boolean) => void;
  filteredCount: number;
  totalCount: number;
}

export const FeatureFilters: React.FC<FeatureFiltersProps> = ({
  searchTerm,
  onSearchChange,
  showDeprecated,
  onShowDeprecatedChange,
  showExperimental,
  onShowExperimentalChange,
  filteredCount,
  totalCount,
}) => {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search features..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="show-deprecated"
            checked={showDeprecated}
            onChange={(e) => onShowDeprecatedChange(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="show-deprecated" className="text-sm">
            Show Deprecated
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="show-experimental"
            checked={showExperimental}
            onChange={(e) => onShowExperimentalChange(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="show-experimental" className="text-sm">
            Show Experimental
          </Label>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCount} of {totalCount} features
      </div>
    </div>
  );
};
