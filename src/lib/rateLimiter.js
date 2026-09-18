// Sliding Window Rate Limiter Module
const rateLimitStore = new Map();

// Periodic cleanup of expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Checks if a request from an IP exceeds the rate limit.
 * @param {string} ip - Client IP address
 * @param {string} routeKey - Identifier for the endpoint (e.g. 'login', 'signup', 'chat')
 * @param {number} maxRequests - Maximum allowed requests in window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetTime: number }}
 */
export function checkRateLimit(ip, routeKey, maxRequests = 10, windowMs = 15 * 60 * 1000) {
  const cleanIp = (ip || '127.0.0.1').toString().trim();
  const storeKey = `${routeKey}:${cleanIp}`;
  const now = Date.now();

  const record = rateLimitStore.get(storeKey);

  if (!record || now > record.resetTime) {
    const newRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(storeKey, newRecord);
    return { allowed: true, remaining: maxRequests - 1, resetTime: newRecord.resetTime };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count += 1;
  rateLimitStore.set(storeKey, record);
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}
