import { ValidationResult } from '../types';

export interface CsvParseConfig {
  requiredHeaders: string[];
  optionalHeaders?: string[];
}

export class CsvParser {
  static async parseFile<T>(
    file: File,
    config: CsvParseConfig,
    validateRow: (data: any, row: number) => string[]
  ): Promise<ValidationResult<T>> {
    const text = await file.text();
    const lines = text.trim().split('\n');
    
    if (lines.length === 0) {
      throw new Error('File is empty');
    }

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
      
      // Add required headers
      config.requiredHeaders.forEach(header => {
        rowData[header] = values[headers.indexOf(header)] || '';
      });
      
      // Add optional headers if present
      config.optionalHeaders?.forEach(header => {
        if (headers.includes(header)) {
          rowData[header] = values[headers.indexOf(header)] || '';
        }
      });

      const errors = validateRow(rowData, i + 1);
      
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

    return { valid, invalid, duplicates: [] };
  }

  static generateTemplateContent(config: CsvParseConfig, sampleData?: string): string {
    const allHeaders = [...config.requiredHeaders, ...(config.optionalHeaders || [])];
    return sampleData || allHeaders.join(',');
  }

  static downloadTemplate(config: CsvParseConfig, filename: string, sampleData?: string): void {
    const content = this.generateTemplateContent(config, sampleData);
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
