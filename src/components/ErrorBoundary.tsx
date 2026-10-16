import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMsg: ''
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error?.message || 'Unknown runtime error' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, errorMsg: '' });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="bg-white dark:bg-[#081729] rounded-xl border border-red-100 dark:border-[#5C1D24] shadow-xs flex flex-col h-full min-h-[160px] w-full">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#152A42] flex items-center justify-between">
            <h4 className="font-bold text-[#071B49] dark:text-white text-sm sm:text-base">{this.props.title || 'Component Error'}</h4>
            <button
              type="button"
              onClick={this.handleRetry}
              className="text-xs text-[#2563EB] dark:text-[#2684FF] hover:text-[#1d4ed8] dark:hover:text-[#6BA1FF] font-medium flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-8 h-8 text-[#EF476F] dark:text-[#FF5368] mb-2 opacity-80" />
            <p className="text-sm text-[#EF476F] dark:text-[#FF5368] font-semibold">Failed to render component</p>
            <p className="text-xs text-[#64748B] dark:text-[#8297B2] mt-1.5 max-w-[280px] break-words" title={this.state.errorMsg}>
              {this.state.errorMsg}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

