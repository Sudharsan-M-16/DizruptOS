"use client";

// Route-segment error boundary — failures degrade to a recoverable surface,
// never a white screen. Errors are reported through the structured logger.

import * as React from "react";
import { OctagonAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { log } from "@/lib/logger";

export default function ShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    log.error("route_error_boundary", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="panel max-w-md p-8 text-center">
        <div className="mx-auto mb-4 w-fit rounded-xl bg-danger-soft p-3 text-danger">
          <OctagonAlert size={22} />
        </div>
        <h2 className="font-display text-base font-semibold">
          This view hit an error
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-fg-secondary">
          The failure is contained to this route — the rest of DIZRUPT is
          unaffected. The event was logged with a diagnostic digest
          {error.digest ? ` (${error.digest})` : ""}.
        </p>
        <Button onClick={reset} className="mt-5">
          <RotateCcw size={12} /> Try again
        </Button>
      </div>
    </div>
  );
}
