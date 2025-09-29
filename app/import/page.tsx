'use client';

import { useState } from 'react';
import { ArrowLeft, Database, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CSVUploader } from '@/components/csv-uploader';
import { ImportResults } from '@/components/import-results';

interface ImportResult {
  session: {
    id: number;
    filename: string;
    status: 'pending' | 'completed' | 'failed';
    totalRows: number;
    importedCount: number;
    duplicateCount: number;
    errorCount: number;
    startedAt: string;
    completedAt?: string;
    errorMessage?: string;
  };
  imported: any[];
  duplicates: any[];
  errors: any[];
}

export default function ImportPage() {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleImportComplete = (result: ImportResult) => {
    setImportResult(result);
    setShowResults(true);
    setImportError(null);
  };

  const handleImportError = (error: string) => {
    setImportError(error);
    setImportResult(null);
    setShowResults(false);
  };

  const handleStartNewImport = () => {
    setImportResult(null);
    setShowResults(false);
    setImportError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Transactions</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Upload your CSV file to import transactions into your spending tracker.
              The system will automatically detect duplicates and validate your data.
            </p>
          </div>
        </div>

        {/* Main Content */}
        {showResults && importResult ? (
          <ImportResults
            result={importResult}
            onStartNewImport={handleStartNewImport}
          />
        ) : (
          <>
            {/* Instructions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  CSV Format Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Required Columns</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li><strong>Date:</strong> Transaction date (YYYY-MM-DD, MM/DD/YYYY, etc.)</li>
                      <li><strong>Amount:</strong> Transaction amount (positive for income, negative for expenses)</li>
                      <li><strong>Description:</strong> Transaction description or merchant name</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-3">Optional Columns</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li><strong>Category:</strong> Transaction category or type</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Example CSV Format:</h4>
                  <pre className="text-xs text-gray-700 overflow-x-auto">
{`Date,Amount,Description,Category
2025-01-01,-50.00,Grocery Store,Food
2025-01-02,-25.50,Coffee Shop,Dining
2025-01-03,2500.00,Salary,Income`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Upload Area */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
              </CardHeader>
              <CardContent>
                <CSVUploader
                  onImportComplete={handleImportComplete}
                  onImportError={handleImportError}
                />
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Database className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Duplicate Detection</h3>
                  <p className="text-sm text-gray-600">
                    Automatically detects and prevents duplicate transactions based on date, amount, and description.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Smart Validation</h3>
                  <p className="text-sm text-gray-600">
                    Validates data format and provides detailed error reporting for any issues found in your CSV.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Instant Analytics</h3>
                  <p className="text-sm text-gray-600">
                    Imported data is immediately available in your dashboard with updated charts and statistics.
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}