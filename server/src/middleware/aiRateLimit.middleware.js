/**
 * aiRateLimit.middleware.js
 *
 * Doc Section 40 — Rate Limiting, and Section 10 of the 5-member doc's
 * security checklist ("per-user/per-plan rate limiting"). This is a
 * baseline in-memory limiter so the AI routes aren't wide open while
 * QA/DevOps (Member 5's ownership per both docs' matrices) builds out
 * the real per-subscription-plan version with Redis, per Section 39's
 * FREE/PLUS/PRO request caps. Swap the Map below for a Redis-backed
 * store before running multiple server instances — in-memory state
 * doesn't share across processes.
 *
 * Per-plan limits: the doc's FREE/PLUS/PRO names were illustrative
 * ("actual commercial limits can be configured later" — Doc 2 §39).
 * This app's real, already-live plan taxonomy is
 * User.subscriptionPlan: FREE | TRIAL | PREMIUM | ENTERPRISE (see
 * admin.controller.js's allowed-values list and notification.controller.js's
 * PREMIUM audience). Rather than introduce a second, disconnected
 * PLUS/PRO enum that has to be kept in sync with the real one, limits
 * are keyed off the plan the rest of the app already uses.
 *
 * Env overrides (per plan, minute and day):
 *   AI_RATE_LIMIT_FREE_PER_MINUTE=5      AI_RATE_LIMIT_FREE_PER_DAY=20
 *   AI_RATE_LIMIT_TRIAL_PER_MINUTE=8     AI_RATE_LIMIT_TRIAL_PER_DAY=50
 *   AI_RATE_LIMIT_PREMIUM_PER_MINUTE=15  AI_RATE_LIMIT_PREMIUM_PER_DAY=200
 *   AI_RATE_LIMIT_ENTERPRISE_PER_MINUTE=30 AI_RATE_LIMIT_ENTERPRISE_PER_DAY=2000
 * Falling back to the old flat env vars keeps existing deployments
 * working unchanged if only those are set:
 *   AI_RATE_LIMIT_PER_MINUTE=10          AI_RATE_LIMIT_PER_DAY=200
 */

const FALLBACK_PER_MINUTE = Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 10);
const FALLBACK_PER_DAY = Number(process.env.AI_RATE_LIMIT_PER_DAY || 200);

const PLAN_LIMITS = {
  FREE: {
    perMinute: Number(process.env.AI_RATE_LIMIT_FREE_PER_MINUTE || 5),
    perDay: Number(process.env.AI_RATE_LIMIT_FREE_PER_DAY || 20),
  },
  TRIAL: {
    perMinute: Number(process.env.AI_RATE_LIMIT_TRIAL_PER_MINUTE || 8),
    perDay: Number(process.env.AI_RATE_LIMIT_TRIAL_PER_DAY || 50),
  },
  PREMIUM: {
    perMinute: Number(process.env.AI_RATE_LIMIT_PREMIUM_PER_MINUTE || 15),
    perDay: Number(process.env.AI_RATE_LIMIT_PREMIUM_PER_DAY || 200),
  },
  ENTERPRISE: {
    perMinute: Number(process.env.AI_RATE_LIMIT_ENTERPRISE_PER_MINUTE || 30),
    perDay: Number(process.env.AI_RATE_LIMIT_ENTERPRISE_PER_DAY || 2000),
  },
};

// Unknown/missing plan (e.g. legacy user doc, admin-triggered edge case)
// gets the *safest* default, not the most generous one.
const DEFAULT_LIMITS = { perMinute: FALLBACK_PER_MINUTE, perDay: FALLBACK_PER_DAY };

function limitsForPlan(plan) {
  return PLAN_LIMITS[plan] || DEFAULT_LIMITS;
}

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** @type {Map<string, {minuteWindowStart:number, minuteCount:number, dayWindowStart:number, dayCount:number}>} */
const buckets = new Map();

function getBucket(userId) {
  const now = Date.now();
  let bucket = buckets.get(userId);
  if (!bucket) {
    bucket = { minuteWindowStart: now, minuteCount: 0, dayWindowStart: now, dayCount: 0 };
    buckets.set(userId, bucket);
  }
  if (now - bucket.minuteWindowStart >= MINUTE_MS) {
    bucket.minuteWindowStart = now;
    bucket.minuteCount = 0;
  }
  if (now - bucket.dayWindowStart >= DAY_MS) {
    bucket.dayWindowStart = now;
    bucket.dayCount = 0;
  }
  return bucket;
}

/**
 * Express middleware — apply only to the AI message/stream endpoints,
 * not read-only routes like GET /conversations (see ai.routes.js).
 */
export function aiRateLimit(req, res, next) {
  const userId = req.auth?.user?._id?.toString();
  if (!userId) return next(); // auth middleware runs first; nothing to key on if missing

  // req.auth.user is already the full User doc (auth.middleware.js
  // selects everything but the password) — no extra DB call needed.
  const plan = req.auth.user.subscriptionPlan;
  const { perMinute, perDay } = limitsForPlan(plan);

  const bucket = getBucket(userId);

  if (bucket.minuteCount >= perMinute) {
    return res.status(429).json({
      success: false,
      message: "Too many AI requests — please slow down.",
      code: "AI_RATE_LIMIT_EXCEEDED",
      plan: plan || "FREE",
      limit: perMinute,
      window: "minute",
      retryAfterMs: MINUTE_MS - (Date.now() - bucket.minuteWindowStart),
    });
  }
  if (bucket.dayCount >= perDay) {
    return res.status(429).json({
      success: false,
      message: "Daily AI request limit reached for your plan.",
      code: "AI_DAILY_LIMIT_EXCEEDED",
      plan: plan || "FREE",
      limit: perDay,
      window: "day",
      retryAfterMs: DAY_MS - (Date.now() - bucket.dayWindowStart),
    });
  }

  bucket.minuteCount += 1;
  bucket.dayCount += 1;
  next();
}

export default aiRateLimit;
