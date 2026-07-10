"use client";

interface SparkAreaProps {
  data: number[];
  color?: string;
  height?: number;
}

export function SparkArea({ data, color = "#00ED82", height = 40 }: SparkAreaProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 100;
  const H = height;
  const step = W / (data.length - 1);

  const pts = data.map((v, i) => ({
    x: i * step,
    y: H - ((v - min) / range) * (H - 6) - 3,
  }));

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${H} L0,${H} Z`;
  const gradId = `sg-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: `${height}px`, display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={color} />
    </svg>
  );
}

/** Vertical bar chart sparkline for sprint velocity / discrete series. */
export function SparkBars({ data, color = "#00ED82" }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const W = 100;
  const H = 36;
  const barW = W / data.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: `${H}px`, display: "block" }} aria-hidden="true">
      {data.map((v, i) => {
        const barH = (v / max) * H;
        return (
          <rect
            key={i}
            x={i * (barW + 1)}
            y={H - barH}
            width={barW}
            height={barH}
            rx={1}
            fill={color}
            fillOpacity={i === data.length - 1 ? 1 : 0.5}
          />
        );
      })}
    </svg>
  );
}

/** Circular capacity ring — shows utilization pct as an arc. */
export function CapacityRing({ pct, size = 56 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(pct, 1);
  const color = pct >= 1 ? "#EF4444" : pct >= 0.85 ? "#F59E0B" : "#00ED82";
  return (
    <svg width={size} height={size} style={{ display: "block" }} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={`${fill * circ} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={color} fontFamily="var(--font-plex-mono, monospace)">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}
