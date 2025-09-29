'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  imported: Array<{
    id: number;
    date: string;
    amount: number;
    description: string;
    category?: string;
    createdAt: string;
  }>;
  duplicates: Array<{
    row: number;
    date: string;
    amount: number;
    description: string;
    existingId: number;
  }>;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
    data: any;
  }>;
}

interface ImportResultsProps {
  result: ImportResult;
  onClose?: () => void;
  onStartNewImport?: () => void;
}

export function ImportResults({ result, onClose, onStartNewImport }: ImportResultsProps) {
  const [showImported, setShowImported] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const { session, imported, duplicates, errors } = result;
  const isValidationOnly = session.importedCount === 0 && session.status === 'completed' && imported.length === 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportResults = () => {
    const data = {
      session,
      summary: {
        filename: session.filename,
        totalRows: session.totalRows,
        imported: session.importedCount,
        duplicates: session.duplicateCount,
        errors: session.errorCount,
        status: session.status
      },
      imported: imported.map(t => ({
        date: t.date,
        amount: t.amount,
        description: t.description,
        category: t.category
      })),
      duplicates,
      errors
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-results-${session.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(session.status)}
              <div>
                <CardTitle className="text-lg">
                  {isValidationOnly ? 'CSV Validation Results' : 'Import Results'}
                </CardTitle>
                <p className="text-sm text-gray-600">{session.filename}</p>
              </div>
            </div>
            <Badge className={getStatusColor(session.status)}>
              {session.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{session.totalRows.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{session.importedCount.toLocaleString()}</div>
              <div className="text-sm text-gray-600">
                {isValidationOnly ? 'Valid' : 'Imported'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{session.duplicateCount.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Duplicates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{session.errorCount.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <div>Started: {formatDateTime(session.startedAt)}</div>
            {session.completedAt && (
              <div>Completed: {formatDateTime(session.completedAt)}</div>
            )}
          </div>

          {session.status === 'failed' && session.errorMessage && (
            <Alert variant="destructive" className="mt-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{session.errorMessage}</AlertDescription>
            </Alert>
          )}

          {isValidationOnly && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                This was a validation-only run. No data was imported to the database.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Imported Transactions */}
      {imported.length > 0 && (
        <Card>
          <Collapsible open={showImported} onOpenChange={setShowImported}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Imported Transactions ({imported.length})
                  </CardTitle>
                  {showImported ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {imported.slice(0, 50).map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-sm">
                            {formatDate(transaction.date)}
                          </TableCell>
                          <TableCell className={`font-mono text-sm ${
                            transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-sm">{transaction.description}</TableCell>
                          <TableCell className="text-sm">
                            {transaction.category ? (
                              <Badge variant="outline">{transaction.category}</Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {imported.length > 50 && (
                    <div className="text-center py-2 text-sm text-gray-500">
                      Showing first 50 of {imported.length} imported transactions
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Duplicate Transactions */}
      {duplicates.length > 0 && (
        <Card>
          <Collapsible open={showDuplicates} onOpenChange={setShowDuplicates}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Duplicate Transactions ({duplicates.length})
                  </CardTitle>
                  {showDuplicates ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Existing ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {duplicates.map((duplicate, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{duplicate.row}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatDate(duplicate.date)}
                          </TableCell>
                          <TableCell className={`font-mono text-sm ${
                            duplicate.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(duplicate.amount)}
                          </TableCell>
                          <TableCell className="text-sm">{duplicate.description}</TableCell>
                          <TableCell className="font-mono text-sm">#{duplicate.existingId}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card>
          <Collapsible open={showErrors} onOpenChange={setShowErrors}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Errors ({errors.length})
                  </CardTitle>
                  {showErrors ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{error.row}</TableCell>
                          <TableCell className="text-sm">
                            {error.field ? (
                              <Badge variant="outline">{error.field}</Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-red-600">{error.message}</TableCell>
                          <TableCell className="text-xs text-gray-500 font-mono max-w-32 truncate">
                            {typeof error.data === 'object'
                              ? JSON.stringify(error.data)
                              : String(error.data)
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={exportResults} variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Export Results
        </Button>

        {onStartNewImport && (
          <Button onClick={onStartNewImport} className="flex-1">
            Import Another File
          </Button>
        )}

        {onClose && (
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        )}
      </div>
    </div>
  );
}