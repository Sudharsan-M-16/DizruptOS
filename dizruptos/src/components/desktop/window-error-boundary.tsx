"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  windowId: string;
  windowTitle: string;
  accent?: string;
}

export class WindowErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[DizruptOS] Window "${this.props.windowTitle}" (${this.props.windowId}) crashed:`,
      error,
      info.componentStack
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { accent = "#00ED82", windowTitle } = this.props;

    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: `${accent}18`,
              border: `1px solid ${accent}40`,
            }}
          >
            <AlertTriangle size={20} style={{ color: accent }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-fg-secondary">
              {windowTitle} crashed
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-fg-muted">
              {this.state.error?.message ?? "An unexpected error occurred in this window."}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: `${accent}18`,
              color: accent,
              border: `1px solid ${accent}30`,
            }}
          >
            <RefreshCw size={11} />
            <span>Reload window</span>
          </button>
          <p className="text-[10px] text-fg-faint">
            Other windows are unaffected
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
