const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}

/**
 * Strips line breaks (prevents email header injection via \r\n) and
 * enforces a max length on any user-supplied field.
 */
function sanitizeField(value, maxLen = 500) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[\r\n]+/g, ' ').trim().slice(0, maxLen);
}

/**
 * Very small best-effort in-memory rate limiter, keyed by IP + route.
 * NOTE: this resets whenever a Vercel function instance goes cold, and does
 * not share state across multiple concurrent instances — it is a helpful
 * speed bump against casual abuse/scripts, not a bulletproof guarantee.
 * For hard guarantees, use Vercel Firewall rules or an Upstash Redis-backed
 * rate limiter instead.
 */
const hits = new Map();

function isRateLimited(key, { limit = 5, windowMs = 10 * 60 * 1000 } = {}) {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    hits.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  if (entry.count > limit) return true;
  return false;
}

function getClientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

module.exports = { isValidEmail, sanitizeField, isRateLimited, getClientIp };