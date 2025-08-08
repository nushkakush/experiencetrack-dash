import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle, Download as DownloadIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface ValidationResult<T> {
  valid: T[];
  invalid: Array<{
    data: any;
    errors: string[];
    row: number;
  }>;
  duplicates?: Array<{
    data: T;
    row: number;
    existingData?: any;
  }>;
}

export interface BulkUploadConfig<T> {
  requiredHeaders: string[];
  optionalHeaders?: string[];
  validateRow: (data: any, row: number) => string[];
  processValidData: (data: T[], duplicateHandling: 'ignore' | 'overwrite') => Promise<{ success: boolean; message: string }>;
  checkDuplicates?: (data: T[]) => Promise<Array<{ data: T; row: number; existingData?: any }>>;
  templateData: string;
  dialogTitle: string;
  dialogDescription: string;
  fileType: string;
  fileExtension: string;
}

interface BulkUploadDialogProps<T> {
  config: BulkUploadConfig<T>;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export default function BulkUploadDialog<T>({ 
  config, 
  trigger, 
  onSuccess 
}: BulkUploadDialogProps<T>) {
  const [open, setOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult<T> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [duplicateHandling, setDuplicateHandling] = useState<'ignore' | 'overwrite'>('ignore');

  const parseFile = useCallback(async (file: File): Promise<ValidationResult<T>> => {
    const text = await file.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate headers
    const missingHeaders = config.requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const valid: T[] = [];
    const invalid: Array<{ data: any; errors: string[]; row: number }> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < config.requiredHeaders.length) continue; // Skip empty lines

      const rowData: any = {};
      config.requiredHeaders.forEach(header => {
        rowData[header] = values[headers.indexOf(header)] || '';
      });
      
      // Add optional headers if present
      config.optionalHeaders?.forEach(header => {
        if (headers.includes(header)) {
          rowData[header] = values[headers.indexOf(header)] || '';
        }
      });

      const errors = config.validateRow(rowData, i + 1);
      
      if (errors.length === 0) {
        valid.push(rowData as T);
      } else {
        invalid.push({
          data: rowData,
          errors,
          row: i + 1
        });
      }
    }

    // Check for duplicates if function is provided
    let duplicates: Array<{ data: T; row: number; existingData?: any }> = [];
    if (config.checkDuplicates && valid.length > 0) {
      try {
        duplicates = await config.checkDuplicates(valid);
      } catch (error) {
        console.error("Error checking duplicates:", error);
        // Continue without duplicate checking if it fails
      }
    }

    return { valid, invalid, duplicates };
  }, [config]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith(config.fileExtension)) {
      toast.error(`Please upload a ${config.fileType} file`);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await parseFile(file);
      setValidationResult(result);
      setSelectedFile(file);
      
      const totalRecords = result.valid.length + result.invalid.length;
      const duplicateCount = result.duplicates?.length || 0;
      
      if (totalRecords === 0) {
        toast.error("No valid data found in the file");
      } else {
        let message = `Found ${result.valid.length} valid and ${result.invalid.length} invalid records`;
        if (duplicateCount > 0) {
          message += `, ${duplicateCount} potential duplicates`;
        }
        toast.success(message);
      }
    } catch (error) {
      console.error("File parsing error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to parse file");
    } finally {
      setIsProcessing(false);
    }
  }, [parseFile, config.fileType, config.fileExtension]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleUploadValidData = async () => {
    if (!validationResult || validationResult.valid.length === 0) {
      toast.error("No valid data to upload");
      return;
    }

    setIsUploading(true);
    try {
      const result = await config.processValidData(validationResult.valid, duplicateHandling);
      if (result.success) {
        toast.success(result.message);
        onSuccess?.();
        setOpen(false);
        setValidationResult(null);
        setSelectedFile(null);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload data");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([config.templateData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template.${config.fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportInvalidData = () => {
    if (!validationResult || validationResult.invalid.length === 0) {
      toast.error("No invalid data to export");
      return;
    }

    const csvContent = [
      // Headers
      [...config.requiredHeaders, ...(config.optionalHeaders || []), 'Row', 'Errors'].join(','),
      // Data rows
      ...validationResult.invalid.map(item => {
        const rowData = [
          ...config.requiredHeaders.map(h => item.data[h] || ''),
          ...(config.optionalHeaders?.map(h => item.data[h] || '') || []),
          item.row,
          `"${item.errors.join('; ')}"`
        ];
        return rowData.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invalid_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getValidDataForUpload = () => {
    if (!validationResult) return [];
    
    if (duplicateHandling === 'ignore' && validationResult.duplicates) {
      // Filter out duplicates
      const duplicateRows = new Set(validationResult.duplicates.map(d => d.row));
      return validationResult.valid.filter((_, index) => !duplicateRows.has(index + 1));
    }
    
    return validationResult.valid;
  };

  const validDataForUpload = getValidDataForUpload();
  const duplicateCount = validationResult?.duplicates?.length || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{config.dialogTitle}</DialogTitle>
          <DialogDescription>
            {config.dialogDescription}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Download */}
          <div className="flex items-center justify-between">
            <Label>Template</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          {!validationResult && (
            <div className="space-y-4">
              <Label>Upload {config.fileType} File</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50",
                  isProcessing && "opacity-50 pointer-events-none"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isProcessing ? (
                  <div className="space-y-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                    <div>
                      <p className="font-medium">Processing file...</p>
                      <p className="text-sm text-muted-foreground">Please wait while we validate the data</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-medium">
                        {selectedFile ? selectedFile.name : `Drop your ${config.fileType} file here`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFile 
                          ? "File selected successfully" 
                          : "or click to browse files"
                        }
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept={config.fileExtension}
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Validation Results</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    {validationResult.valid.length} Valid
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <XCircle className="h-3 w-3 text-red-600" />
                    {validationResult.invalid.length} Invalid
                  </Badge>
                  {duplicateCount > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-600" />
                      {duplicateCount} Duplicates
                    </Badge>
                  )}
                </div>
              </div>

              {/* Duplicate Handling Options */}
              {duplicateCount > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p>Found {duplicateCount} potential duplicate records. How would you like to handle them?</p>
                      <RadioGroup
                        value={duplicateHandling}
                        onValueChange={(value) => setDuplicateHandling(value as 'ignore' | 'overwrite')}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ignore" id="ignore" />
                          <Label htmlFor="ignore" className="text-sm">
                            Ignore duplicates ({validDataForUpload.length} records will be uploaded)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="overwrite" id="overwrite" />
                          <Label htmlFor="overwrite" className="text-sm">
                            Overwrite duplicates ({validationResult.valid.length} records will be uploaded)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="valid" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="valid" className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Valid Data ({validDataForUpload.length})
                  </TabsTrigger>
                  <TabsTrigger value="invalid" className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Invalid Data ({validationResult.invalid.length})
                  </TabsTrigger>
                  {duplicateCount > 0 && (
                    <TabsTrigger value="duplicates" className="gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Duplicates ({duplicateCount})
                    </TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="valid" className="space-y-4">
                  {validDataForUpload.length > 0 ? (
                    <div className="rounded-lg border bg-card">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              {config.requiredHeaders.map(header => (
                                <th key={header} className="text-left p-3 font-medium">
                                  {header.replace(/_/g, ' ').toUpperCase()}
                                </th>
                              ))}
                              {config.optionalHeaders?.map(header => (
                                <th key={header} className="text-left p-3 font-medium">
                                  {header.replace(/_/g, ' ').toUpperCase()}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {validDataForUpload.slice(0, 10).map((row, index) => (
                              <tr key={index} className="border-t">
                                {config.requiredHeaders.map(header => (
                                  <td key={header} className="p-3">
                                    {(row as any)[header] || '-'}
                                  </td>
                                ))}
                                {config.optionalHeaders?.map(header => (
                                  <td key={header} className="p-3">
                                    {(row as any)[header] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {validDataForUpload.length > 10 && (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          Showing first 10 of {validDataForUpload.length} valid records
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No valid data to upload
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="invalid" className="space-y-4">
                  {validationResult.invalid.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportInvalidData}
                          className="gap-2"
                        >
                          <DownloadIcon className="h-4 w-4" />
                          Export Invalid Data
                        </Button>
                      </div>
                      <div className="rounded-lg border bg-card">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left p-3 font-medium">Row</th>
                                {config.requiredHeaders.map(header => (
                                  <th key={header} className="text-left p-3 font-medium">
                                    {header.replace(/_/g, ' ').toUpperCase()}
                                  </th>
                                ))}
                                {config.optionalHeaders?.map(header => (
                                  <th key={header} className="text-left p-3 font-medium">
                                    {header.replace(/_/g, ' ').toUpperCase()}
                                  </th>
                                ))}
                                <th className="text-left p-3 font-medium">Errors</th>
                              </tr>
                            </thead>
                            <tbody>
                              {validationResult.invalid.slice(0, 10).map((item, index) => (
                                <tr key={index} className="border-t">
                                  <td className="p-3 font-medium">{item.row}</td>
                                  {config.requiredHeaders.map(header => (
                                    <td key={header} className="p-3">
                                      {item.data[header] || '-'}
                                    </td>
                                  ))}
                                  {config.optionalHeaders?.map(header => (
                                    <td key={header} className="p-3">
                                      {item.data[header] || '-'}
                                    </td>
                                  ))}
                                  <td className="p-3">
                                    <div className="space-y-1">
                                      {item.errors.map((error, errorIndex) => (
                                        <div key={errorIndex} className="text-xs text-red-600">
                                          • {error}
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {validationResult.invalid.length > 10 && (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            Showing first 10 of {validationResult.invalid.length} invalid records
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No invalid data found
                    </div>
                  )}
                </TabsContent>

                {duplicateCount > 0 && (
                  <TabsContent value="duplicates" className="space-y-4">
                    <div className="rounded-lg border bg-card">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 font-medium">Row</th>
                              {config.requiredHeaders.map(header => (
                                <th key={header} className="text-left p-3 font-medium">
                                  {header.replace(/_/g, ' ').toUpperCase()}
                                </th>
                              ))}
                              {config.optionalHeaders?.map(header => (
                                <th key={header} className="text-left p-3 font-medium">
                                  {header.replace(/_/g, ' ').toUpperCase()}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {validationResult.duplicates?.slice(0, 10).map((item, index) => (
                              <tr key={index} className="border-t">
                                <td className="p-3 font-medium">{item.row}</td>
                                {config.requiredHeaders.map(header => (
                                  <td key={header} className="p-3">
                                    {(item.data as any)[header] || '-'}
                                  </td>
                                ))}
                                {config.optionalHeaders?.map(header => (
                                  <td key={header} className="p-3">
                                    {(item.data as any)[header] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {duplicateCount > 10 && (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          Showing first 10 of {duplicateCount} duplicate records
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Required columns:</strong> {config.requiredHeaders.join(', ')}</p>
            {config.optionalHeaders && config.optionalHeaders.length > 0 && (
              <p><strong>Optional columns:</strong> {config.optionalHeaders.join(', ')}</p>
            )}
            <p><strong>Format:</strong> {config.fileType} with headers on the first line</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setOpen(false);
              setValidationResult(null);
              setSelectedFile(null);
            }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          {validationResult && validDataForUpload.length > 0 && (
            <Button
              onClick={handleUploadValidData}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Valid Data ({validDataForUpload.length})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
