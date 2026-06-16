import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props { children: ReactNode; moduleName: string; }
interface State { hasError: boolean; errorMsg: string; }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, errorMsg: '' };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ${this.props.moduleName}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex flex-col items-center justify-center text-center h-64 w-full">
          <AlertTriangle className="h-10 w-10 text-rose-500 mb-3" />
          <h2 className="text-slate-200 font-bold mb-1">{this.props.moduleName} Crashed</h2>
          <p className="text-rose-400 font-mono text-[10px] mb-4">{this.state.errorMsg}</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-full font-mono text-xs transition-colors"
          >
            <RefreshCcw className="h-3 w-3" /> Retry Render
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
