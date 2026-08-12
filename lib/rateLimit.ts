const hits = new Map<string, { count: number; resetAt: number }>();

// In-memory per-process limiter — fine for a single-instance deployment;
// switch to a shared store (Redis/Upstash) if scaled to multiple instances.
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count += 1;
  return true;
}
