import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ValidationResult } from '../types';

interface ValidationResultsProps<T> {
  validationResult: ValidationResult<T>;
}

export const ValidationResults = <T,>({ validationResult }: ValidationResultsProps<T>) => {
  const { valid, invalid, duplicates } = validationResult;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium">Valid Records</span>
          <Badge variant="secondary">{valid.length}</Badge>
        </div>
        
        {invalid.length > 0 && (
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium">Invalid Records</span>
            <Badge variant="destructive">{invalid.length}</Badge>
          </div>
        )}
        
        {duplicates && duplicates.length > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium">Duplicates</span>
            <Badge variant="outline">{duplicates.length}</Badge>
          </div>
        )}
      </div>

      {/* Invalid Records Details */}
      {invalid.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Found {invalid.length} invalid records:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {invalid.slice(0, 5).map((item) => (
                  <div key={item.row} className="text-xs">
                    <span className="font-medium">Row {item.row}:</span> {item.errors.join(', ')}
                  </div>
                ))}
                {invalid.length > 5 && (
                  <div className="text-xs text-muted-foreground">
                    ... and {invalid.length - 5} more errors
                  </div>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Duplicates Details */}
      {duplicates && duplicates.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Found {duplicates.length} potential duplicates:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {duplicates.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-xs">
                    <span className="font-medium">Row {item.row}:</span> Similar record found
                  </div>
                ))}
                {duplicates.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    ... and {duplicates.length - 3} more duplicates
                  </div>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {valid.length > 0 && invalid.length === 0 && (!duplicates || duplicates.length === 0) && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All {valid.length} records are valid and ready to import!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
