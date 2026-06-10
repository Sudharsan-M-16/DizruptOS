import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
      <div className="panel max-w-md p-8 text-center">
        <div className="mx-auto mb-4 w-fit rounded-xl bg-brand-soft p-3 text-brand">
          <Compass size={22} />
        </div>
        <h1 className="font-display text-base font-semibold">
          This entity doesn&apos;t exist
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-fg-secondary">
          The record may have been soft-deleted, or the link predates the
          current organizational graph.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-4 text-xs font-semibold text-white hover:shadow-glow"
        >
          Back to Command Center
        </Link>
      </div>
    </div>
  );
}
