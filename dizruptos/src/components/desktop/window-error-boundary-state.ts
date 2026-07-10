// Pure state machine for WindowErrorBoundary — no JSX, importable in Node tests.
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export function getDerivedStateFromError(error: Error): ErrorBoundaryState {
  return { hasError: true, error };
}

export function resetState(): ErrorBoundaryState {
  return { hasError: false, error: null };
}
