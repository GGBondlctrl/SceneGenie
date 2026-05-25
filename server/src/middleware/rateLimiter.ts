import type { Request, Response, NextFunction } from 'express';

interface LimitEntry {
  count: number;
  resetTime: number;
}

const ipStore = new Map<string, LimitEntry>();
const emailStore = new Map<string, LimitEntry>();
const lastSentStore = new Map<string, number>();

function checkLimit(store: Map<string, LimitEntry>, key: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// Global IP rate limiter: 100 requests per hour per IP
export function ipRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip || 'unknown';
  if (!checkLimit(ipStore, key, 60 * 60 * 1000, 100)) {
    res.status(429)
      .set('Retry-After', '3600')
      .json({ error: 'Too many requests from this IP. Please try again later.' });
    return;
  }
  next();
}

// Email rate limiter for sending codes: 1 per minute, 5 per hour
export function emailCodeRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const email = (req.body.email || '').toLowerCase().trim();
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const now = Date.now();
  const entry = emailStore.get(email);

  if (!entry || now > entry.resetTime) {
    emailStore.set(email, { count: 1, resetTime: now + 60 * 60 * 1000 });
    next();
    return;
  }

  // Check 1-minute window (reuse same entry but check last sent)
  const lastSent = lastSentStore.get(email) || 0;
  if (now - lastSent < 60 * 1000) {
    res.status(429)
      .set('Retry-After', '60')
      .json({ error: 'Please wait 1 minute before requesting a new code' });
    return;
  }

  if (entry.count >= 5) {
    res.status(429)
      .set('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString())
      .json({ error: 'Maximum 5 codes per hour reached' });
    return;
  }

  entry.count++;
  lastSentStore.set(email, now);
  next();
}

// Cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of ipStore.entries()) {
    if (now > entry.resetTime) ipStore.delete(key);
  }
  for (const [key, entry] of emailStore.entries()) {
    if (now > entry.resetTime) emailStore.delete(key);
  }
  for (const [key, time] of lastSentStore.entries()) {
    if (now - time > 60 * 60 * 1000) lastSentStore.delete(key);
  }
}, 10 * 60 * 1000);
