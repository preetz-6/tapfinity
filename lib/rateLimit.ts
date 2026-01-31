type Entry = {
  count: number;
  windowStart: number;
};

const store = new Map<string, Entry>();

/**
 * Simple in-memory rate limiter
 * @param key identifier (IP, device, etc.)
 * @param limit max requests
 * @param windowMs time window in ms
 */
export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 5000
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  // first request or window expired
  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return true;
  }

  // limit exceeded
  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}
