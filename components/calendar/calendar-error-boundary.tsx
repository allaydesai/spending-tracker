'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface CalendarErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface CalendarErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

class CalendarErrorBoundary extends React.Component<
  CalendarErrorBoundaryProps,
  CalendarErrorBoundaryState
> {
  constructor(props: CalendarErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): CalendarErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Calendar Error Boundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultCalendarErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

const DefaultCalendarErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({
  error,
  retry
}) => (
  <div className="bg-card rounded-lg border border-border p-6">
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Calendar Error
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          There was an error loading the spending calendar.
        </p>
        {error && process.env.NODE_ENV === 'development' && (
          <pre className="text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded text-left overflow-auto max-w-md">
            {error.message}
          </pre>
        )}
        <button
          onClick={retry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  </div>
);

export { CalendarErrorBoundary };