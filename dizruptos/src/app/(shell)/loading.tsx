// Shared route-transition skeleton — shimmering panels that match the
// command-center layout so loading never feels like a different product.

export default function ShellLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading view">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel h-36 overflow-hidden p-5">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="mt-4 h-7 w-16" />
            <Shimmer className="mt-4 h-2.5 w-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="panel h-80 p-5 xl:col-span-3">
          <Shimmer className="h-3 w-40" />
          <Shimmer className="mt-5 h-56 w-full" />
        </div>
        <div className="space-y-3 xl:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="panel h-24 p-4">
              <Shimmer className="h-3 w-32" />
              <Shimmer className="mt-3 h-2.5 w-full" />
              <Shimmer className="mt-2 h-2.5 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-md bg-gradient-to-r from-ink-elevated via-ink-raised to-ink-elevated bg-[length:400px_100%] ${className ?? ""}`}
    />
  );
}
