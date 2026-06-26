// Load test scaffold — run with: node load-test.mjs
// Requires the dev server running at http://localhost:3000
// Expected p95 targets: health < 50ms, graph < 800ms, copilot < 10s

const BASE = "http://localhost:3000";
const COOKIE = "dz_session=u-elias"; // valid principal; run against `npm run build && npm start` for real perf numbers (dev is unoptimised; intelligence routes are rate-limited to 10/min by design)

async function singleRequest(url) {
  const start = performance.now();
  try {
    const res = await fetch(url, { headers: { Cookie: COOKIE } });
    const latency = performance.now() - start;
    // 429 = rate limiter doing its job — separate from real application errors
    if (res.status === 429) return { ok: true, status: 429, latency, rateLimited: true };
    return { ok: res.ok, status: res.status, latency, rateLimited: false };
  } catch (e) {
    return { ok: false, status: 0, latency: performance.now() - start, err: String(e), rateLimited: false };
  }
}

async function bench(label, url, concurrency, iterations) {
  console.log(`\n[${label}] ${url} — ${concurrency} concurrent × ${iterations} rounds`);
  const allLatencies = [];
  let errors = 0;
  let rateLimited = 0;

  for (let round = 0; round < iterations; round++) {
    const batch = Array.from({ length: concurrency }, () => singleRequest(url));
    const results = await Promise.all(batch);
    for (const r of results) {
      allLatencies.push(r.latency);
      if (r.rateLimited) rateLimited++;
      else if (!r.ok) errors++;
    }
  }

  allLatencies.sort((a, b) => a - b);
  const n = allLatencies.length;
  const p50 = allLatencies[Math.floor(n * 0.50)];
  const p95 = allLatencies[Math.floor(n * 0.95)];
  const p99 = allLatencies[Math.floor(n * 0.99)];
  const mean = allLatencies.reduce((a, b) => a + b, 0) / n;

  console.log(`  requests: ${n} | errors: ${errors} | rate-limited (429, expected): ${rateLimited}`);
  console.log(`  mean: ${mean.toFixed(0)}ms | p50: ${p50.toFixed(0)}ms | p95: ${p95.toFixed(0)}ms | p99: ${p99.toFixed(0)}ms`);

  return { label, n, errors, rateLimited, mean, p50, p95, p99 };
}

async function main() {
  console.log("DizruptOS Load Test — checking dev server...");

  // Verify server is up
  try {
    const probe = await fetch(`${BASE}/api/health`);
    if (!probe.ok) throw new Error(`Health check returned ${probe.status}`);
    console.log("Server is up. Starting benchmarks...");
  } catch (e) {
    console.error(`ERROR: Dev server not reachable at ${BASE}. Start it with: cd dizruptos && npm run dev`);
    process.exit(1);
  }

  const results = await Promise.all([
    bench("health", `${BASE}/api/health`, 50, 5),
    bench("graph", `${BASE}/api/v1/intelligence/graph`, 10, 3),
    bench("copilot", `${BASE}/api/v1/copilot?q=who+is+overloaded`, 5, 2),
  ]);

  console.log("\n=== SUMMARY ===");
  const targets = { health: 50, graph: 800, copilot: 10000 };
  for (const r of results) {
    const target = targets[r.label];
    const pass = r.p95 <= target;
    console.log(`[${pass ? "PASS" : "FAIL"}] ${r.label}: p95=${r.p95.toFixed(0)}ms (target: <${target}ms)`);
  }
}

main().catch(console.error);
