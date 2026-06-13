"use client";

// App-wide client providers. Currently the TanStack Query cache; future
// realtime/session providers compose here. Mounted once in the root layout.

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";

export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
