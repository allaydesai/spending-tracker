'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface ImportOptions {
  skipDuplicates: boolean;
  validateOnly: boolean;
}

interface ImportResult {
  session: {
    id: number;
    filename: string;
    status: 'pending' | 'completed' | 'failed';
    totalRows: number;
    importedCount: number;
    duplicateCount: number;
    errorCount: number;
  };
  imported: any[];
  duplicates: any[];
  errors: any[];
}

interface CSVUploaderProps {
  onImportComplete?: (result: ImportResult) => void;
  onImportError?: (error: string) => void;
  disabled?: boolean;
}

export function CSVUploader({ onImportComplete, onImportError, disabled = false }: CSVUploaderProps) {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    validateOnly: false
  });
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    sampleRows: string[][];
    estimatedRows: number;
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
      setUploadState('idle');

      // Generate preview
      generatePreview(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/csv': ['.csv']
    },
    multiple: false,
    disabled: disabled || uploadState === 'uploading' || uploadState === 'processing'
  });

  const generatePreview = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const sampleRows = lines.slice(1, 6).map(line =>
          line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        );

        setPreviewData({
          headers,
          sampleRows,
          estimatedRows: lines.length - 1
        });
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('options', JSON.stringify(options));

      setProgress(30);

      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData
      });

      setProgress(70);
      setUploadState('processing');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result: ImportResult = await response.json();

      setProgress(100);
      setUploadState('completed');

      // Call the completion callback
      onImportComplete?.(result);

    } catch (error: any) {
      setUploadState('error');
      setError(error.message);
      onImportError?.(error.message);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setUploadState('idle');
    setProgress(0);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isProcessing = uploadState === 'uploading' || uploadState === 'processing';

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragActive
                ? 'border-blue-500 bg-blue-50'
                : selectedFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }
              ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />

            <div className="space-y-4">
              {selectedFile ? (
                <>
                  <FileText className="h-12 w-12 text-green-500 mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-sm font-medium">
                      {isDragActive ? 'Drop the CSV file here' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500">CSV files only, max 10MB</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Preview */}
      {previewData && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium mb-3">File Preview</h3>
            <div className="space-y-3">
              <div className="flex gap-4 text-xs text-gray-600">
                <span>Headers: {previewData.headers.length}</span>
                <span>Estimated rows: {previewData.estimatedRows.toLocaleString()}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-gray-200 rounded">
                  <thead>
                    <tr className="bg-gray-50">
                      {previewData.headers.map((header, index) => (
                        <th key={index} className="p-2 text-left border-b font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.sampleRows.slice(0, 3).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="p-2 border-r last:border-r-0">
                            {cell || <span className="text-gray-400">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewData.sampleRows.length > 3 && (
                <p className="text-xs text-gray-500">
                  Showing first 3 rows of {previewData.estimatedRows} total rows
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Options */}
      {selectedFile && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium mb-3">Import Options</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipDuplicates"
                  checked={options.skipDuplicates}
                  onCheckedChange={(checked) =>
                    setOptions(prev => ({ ...prev, skipDuplicates: checked as boolean }))
                  }
                  disabled={isProcessing}
                />
                <label htmlFor="skipDuplicates" className="text-sm">
                  Skip duplicate transactions
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validateOnly"
                  checked={options.validateOnly}
                  onCheckedChange={(checked) =>
                    setOptions(prev => ({ ...prev, validateOnly: checked as boolean }))
                  }
                  disabled={isProcessing}
                />
                <label htmlFor="validateOnly" className="text-sm">
                  Validate only (don't import data)
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {uploadState === 'uploading' ? 'Uploading...' : 'Processing...'}
                </span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              {uploadState === 'processing' && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing CSV and importing transactions...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {uploadState === 'completed' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            File uploaded and processed successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Button */}
      {selectedFile && uploadState !== 'completed' && (
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={isProcessing || disabled}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadState === 'uploading' ? 'Uploading...' : 'Processing...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {options.validateOnly ? 'Validate CSV' : 'Import Transactions'}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}