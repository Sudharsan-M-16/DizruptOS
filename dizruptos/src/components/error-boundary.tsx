"use client";

import React from "react";
import { AlertOctagon, RefreshCcw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
    // Ship to Sentry when configured
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).__sentry_init__) {
      const Sentry = (window as unknown as Record<string, unknown>).Sentry as { captureException?: (e: Error, ctx?: unknown) => void } | undefined;
      Sentry?.captureException?.(error, { extra: { componentStack: info.componentStack } });
    }
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-xl border border-danger/30 bg-danger/5 p-8 text-center"
      >
        <AlertOctagon size={32} className="text-danger" aria-hidden />
        <div>
          <p className="text-[14px] font-semibold text-fg-primary">Something went wrong</p>
          <p className="mt-1 text-[12px] text-fg-muted">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
        </div>
        <button
          onClick={this.reset}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-medium text-fg-secondary transition-colors hover:bg-white/10"
        >
          <RefreshCcw size={12} aria-hidden /> Try again
        </button>
      </div>
    );
  }
}

/** Drop-in wrapper for any subtree that should survive render failures. */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const Wrapped = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${Component.displayName ?? Component.name})`;
  return Wrapped;
}
