# SceneGenie Auth System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete backend auth system (Express + SQLite + Resend) and wire the frontend to use real API calls instead of mock auth.

**Architecture:** Backend follows layered architecture (routes → controllers → services → models) with JWT stateless sessions, bcrypt password hashing, and in-memory rate limiting. Frontend adds an API service layer that all hooks consume.

**Tech Stack:** Express 4, SQLite3, bcryptjs, jsonwebtoken, Resend, TypeScript (ESM), CORS, express-rate-limit

---

## File Map

### Backend — all new files

| File | Responsibility |
|------|---------------|
| `server/package.json` | Dependencies and scripts |
| `server/tsconfig.json` | TypeScript config (ESM, strict) |
| `server/.env` | Runtime secrets (not committed) |
| `server/src/db.ts` | SQLite connection, table creation |
| `server/src/utils/validators.ts` | Email, password, name, code validation |
| `server/src/middleware/rateLimiter.ts` | IP-based and email-based rate limiting |
| `server/src/middleware/authMiddleware.ts` | JWT Bearer token verification |
| `server/src/services/tokenService.ts` | JWT sign / verify |
| `server/src/services/emailService.ts` | Resend API wrapper for verification emails |
| `server/src/models/userModel.ts` | All SQL queries (users, codes, attempts) |
| `server/src/services/authService.ts` | Business logic: send-code, register, login |
| `server/src/controllers/authController.ts` | HTTP request/response handling |
| `server/src/routes/auth.ts` | Auth route definitions |
| `server/src/index.ts` | Express app bootstrap |

### Frontend — modify existing

| File | Change |
|------|--------|
| `app/src/services/api.ts` | **Create** — HTTP client with auth header injection |
| `app/src/hooks/useAuth.ts` | **Rewrite** — real API calls, token storage, register method |
| `app/src/components/LoginModal.tsx` | **Modify** — add verification code input + send-code button + countdown |
| `app/src/App.tsx` | **Modify** — pass `register` to LoginModal, wire up correctly |

---

## Task 1: Server Package & Config

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/.env`

- [ ] **Step 1: Write server/package.json**

```json
{
  "name": "scene-genie-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.21.0",
    "express-rate-limit": "^7.0.0",
    "jsonwebtoken": "^9.0.2",
    "resend": "^3.0.0",
    "sqlite3": "^5.1.7"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "~5.9.3"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
cd d:/video_gen/server && npm install
```

Expected: `node_modules` created, no errors.

- [ ] **Step 3: Write server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Write server/.env**

```bash
PORT=3001
JWT_SECRET=change-me-in-production-use-random-string
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=noreply@scenegenie.app
```

> In production, generate a strong JWT_SECRET with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

- [ ] **Step 5: Commit**

```bash
cd d:/video_gen && git add server/package.json server/tsconfig.json server/.env
git commit -m "chore: scaffold server package and config"
```

---

## Task 2: Database & Utilities

**Files:**
- Create: `server/src/db.ts`
- Create: `server/src/utils/validators.ts`

- [ ] **Step 1: Write server/src/db.ts**

```ts
import sqlite3 from 'sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dirname, '..', '..', 'data');
mkdirSync(DB_DIR, { recursive: true });

const dbPath = join(DB_DIR, 'scenegenie.db');
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database open error:', err);
  else console.log('SQLite connected at', dbPath);
});

// Initialize tables
 db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'register',
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    ip TEXT NOT NULL,
    success BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_codes_email ON verification_codes(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_attempts_email ON login_attempts(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_attempts_created ON login_attempts(created_at)`);
});
```

- [ ] **Step 2: Write server/src/utils/validators.ts**

```ts
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 50;
}

export function isValidCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
cd d:/video_gen/server && npx tsc --noEmit
```

Expected: no errors (may have sqlite3 type warnings — safe to ignore).

- [ ] **Step 4: Commit**

```bash
cd d:/video_gen && git add server/src/db.ts server/src/utils/validators.ts
git commit -m "feat: add SQLite database setup and input validators"
```

---

## Task 3: Middleware (Rate Limiting & Auth)

**Files:**
- Create: `server/src/middleware/rateLimiter.ts`
- Create: `server/src/middleware/authMiddleware.ts`

- [ ] **Step 1: Write server/src/middleware/rateLimiter.ts**

```ts
import type { Request, Response, NextFunction } from 'express';

interface LimitEntry {
  count: number;
  resetTime: number;
}

const ipStore = new Map<string, LimitEntry>();
const emailStore = new Map<string, LimitEntry>();

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
    res.status(429).json({ error: 'Too many requests from this IP. Please try again later.' });
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
  const lastSentKey = `last:${email}`;
  const lastSent = (req.app.locals[lastSentKey] || 0) as number;
  if (now - lastSent < 60 * 1000) {
    res.status(429).json({ error: 'Please wait 1 minute before requesting a new code' });
    return;
  }

  if (entry.count >= 5) {
    res.status(429).json({ error: 'Maximum 5 codes per hour reached' });
    return;
  }

  entry.count++;
  req.app.locals[lastSentKey] = now;
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
}, 10 * 60 * 1000);
```

- [ ] **Step 2: Write server/src/middleware/authMiddleware.ts**

```ts
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/tokenService.js';

export interface AuthenticatedRequest extends Request {
  user?: { userId: number; email: string; name: string };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing or invalid token' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: token expired or invalid' });
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
cd d:/video_gen/server && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd d:/video_gen && git add server/src/middleware/rateLimiter.ts server/src/middleware/authMiddleware.ts
git commit -m "feat: add rate limiting and JWT auth middleware"
```

---

## Task 4: Services (Token & Email)

**Files:**
- Create: `server/src/services/tokenService.ts`
- Create: `server/src/services/emailService.ts`

- [ ] **Step 1: Write server/src/services/tokenService.ts**

```ts
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: number;
  email: string;
  name: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
```

- [ ] **Step 2: Write server/src/services/emailService.ts**

```ts
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || '');
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@scenegenie.app';

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: `SceneGenie <${FROM_EMAIL}>`,
    to: email,
    subject: 'Your SceneGenie Verification Code',
    text: `Your verification code is: ${code}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, please ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #010828;">SceneGenie</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #6FFF00; background: #010828; padding: 16px; text-align: center; border-radius: 8px; margin: 16px 0;">
          ${code}
        </div>
        <p style="color: #666;">This code will expire in <strong>5 minutes</strong>.</p>
        <p style="color: #999; font-size: 12px;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
cd d:/video_gen/server && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd d:/video_gen && git add server/src/services/tokenService.ts server/src/services/emailService.ts
git commit -m "feat: add JWT token and email services"
```

---

## Task 5: Data Model

**Files:**
- Create: `server/src/models/userModel.ts`

- [ ] **Step 1: Write server/src/models/userModel.ts**

```ts
import { db } from '../db.js';

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
}

export interface CodeRow {
  id: number;
  email: string;
  code: string;
  purpose: string;
  expires_at: string;
  used: number;
  created_at: string;
}

// ---- Users ----

export function findUserByEmail(email: string): Promise<UserRow | null> {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()], (err, row) => {
      if (err) reject(err);
      else resolve((row as UserRow) || null);
    });
  });
}

export function createUser(email: string, passwordHash: string, name: string): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email.toLowerCase().trim(), passwordHash, name.trim()],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

// ---- Verification Codes ----

export function createVerificationCode(email: string, code: string, expiresAt: string): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)',
      [email.toLowerCase().trim(), code, expiresAt],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

export function findValidCode(email: string, code: string): Promise<CodeRow | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND used = FALSE AND expires_at > datetime("now") ORDER BY created_at DESC LIMIT 1',
      [email.toLowerCase().trim(), code],
      (err, row) => {
        if (err) reject(err);
        else resolve((row as CodeRow) || null);
      }
    );
  });
}

export function markCodeUsed(codeId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run('UPDATE verification_codes SET used = TRUE WHERE id = ?', [codeId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function countRecentCodes(email: string, sinceMs: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const since = new Date(Date.now() - sinceMs).toISOString();
    db.get(
      'SELECT COUNT(*) as count FROM verification_codes WHERE email = ? AND created_at > ?',
      [email.toLowerCase().trim(), since],
      (err, row) => {
        if (err) reject(err);
        else resolve((row as { count: number }).count || 0);
      }
    );
  });
}

// ---- Login Attempts ----

export function recordLoginAttempt(email: string, ip: string, success: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO login_attempts (email, ip, success) VALUES (?, ?, ?)',
      [email.toLowerCase().trim(), ip, success],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function countRecentFailedAttempts(email: string, sinceMs: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const since = new Date(Date.now() - sinceMs).toISOString();
    db.get(
      'SELECT COUNT(*) as count FROM login_attempts WHERE email = ? AND success = FALSE AND created_at > ?',
      [email.toLowerCase().trim(), since],
      (err, row) => {
        if (err) reject(err);
        else resolve((row as { count: number }).count || 0);
      }
    );
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd d:/video_gen/server && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd d:/video_gen && git add server/src/models/userModel.ts
git commit -m "feat: add user data model with users, codes, and attempts"
```

---

## Task 6: Auth Service (Business Logic)

**Files:**
- Create: `server/src/services/authService.ts`

- [ ] **Step 1: Write server/src/services/authService.ts**

```ts
import bcrypt from 'bcryptjs';
import {
  findUserByEmail,
  createUser,
  createVerificationCode,
  findValidCode,
  markCodeUsed,
  countRecentCodes,
  recordLoginAttempt,
  countRecentFailedAttempts,
} from '../models/userModel.js';
import { sendVerificationCode as sendEmail } from './emailService.js';
import { generateToken } from './tokenService.js';

// ---- Send Code ----

export async function sendCode(email: string): Promise<void> {
  const hourCount = await countRecentCodes(email, 60 * 60 * 1000);
  if (hourCount >= 5) {
    throw new Error('Maximum 5 verification codes per hour reached');
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await createVerificationCode(email, code, expiresAt);

  // Fire-and-forget; log error but don't fail if email service is down
  sendEmail(email, code).catch((err) => {
    console.error('Email send failed:', err);
  });
}

// ---- Register ----

export async function register(
  email: string,
  password: string,
  name: string,
  code: string
): Promise<{ token: string; user: { id: number; email: string; name: string } }> {
  const validCode = await findValidCode(email, code);
  if (!validCode) {
    throw new Error('Invalid or expired verification code');
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('Email already registered');
  }

  await markCodeUsed(validCode.id);

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = await createUser(email, passwordHash, name);

  const token = generateToken({ userId, email: email.toLowerCase().trim(), name: name.trim() });

  return {
    token,
    user: { id: userId, email: email.toLowerCase().trim(), name: name.trim() },
  };
}

// ---- Login ----

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export async function login(
  email: string,
  password: string,
  ip: string
): Promise<{ token: string; user: { id: number; email: string; name: string } }> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check lockout
  const failedCount = await countRecentFailedAttempts(normalizedEmail, LOCKOUT_DURATION_MS);
  if (failedCount >= MAX_FAILED_ATTEMPTS) {
    throw new Error('Account locked due to too many failed attempts. Please try again in 15 minutes.');
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    await recordLoginAttempt(normalizedEmail, ip, false);
    throw new Error('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    await recordLoginAttempt(normalizedEmail, ip, false);
    throw new Error('Invalid email or password');
  }

  await recordLoginAttempt(normalizedEmail, ip, true);

  const token = generateToken({ userId: user.id, email: user.email, name: user.name });

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name },
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd d:/video_gen/server && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd d:/video_gen && git add server/src/services/authService.ts
git commit -m "feat: add auth business logic with lockout and bcrypt"
```

---

## Task 7: Controller & Routes

**Files:**
- Create: `server/src/controllers/authController.ts`
- Create: `server/src/routes/auth.ts`

- [ ] **Step 1: Write server/src/controllers/authController.ts**

```ts
import type { Request, Response } from 'express';
import { sendCode, register, login } from '../services/authService.js';
import { isValidEmail, isValidPassword, isValidName, isValidCode } from '../utils/validators.js';

export async function handleSendCode(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email address' });
      return;
    }
    await sendCode(email);
    res.json({ message: 'Verification code sent to your email' });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function handleRegister(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, code } = req.body;

    if (!email || !isValidEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email address' });
      return;
    }
    if (!password || !isValidPassword(password)) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }
    if (!name || !isValidName(name)) {
      res.status(400).json({ error: 'Please provide a valid name (1-50 characters)' });
      return;
    }
    if (!code || !isValidCode(code)) {
      res.status(400).json({ error: 'Please provide a valid 6-digit verification code' });
      return;
    }

    const result = await register(email, password, name, code);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email address' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    const ip = req.ip || 'unknown';
    const result = await login(email, password, ip);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
}

export function handleLogout(_req: Request, res: Response): void {
  res.json({ message: 'Logged out successfully' });
}

export function handleMe(req: Request, res: Response): void {
  const user = (req as unknown as Record<string, unknown>).user as { userId: number; email: string; name: string } | undefined;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ user: { id: user.userId, email: user.email, name: user.name } });
}
```

- [ ] **Step 2: Write server/src/routes/auth.ts**

```ts
import { Router } from 'express';
import {
  handleSendCode,
  handleRegister,
  handleLogin,
  handleLogout,
  handleMe,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { emailCodeRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/send-code', emailCodeRateLimiter, handleSendCode);
router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.post('/logout', handleLogout);
router.get('/me', authMiddleware, handleMe);

export default router;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
cd d:/video_gen/server && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd d:/video_gen && git add server/src/controllers/authController.ts server/src/routes/auth.ts
git commit -m "feat: add auth controller and routes"
```

---

## Task 8: Express Entry Point

**Files:**
- Create: `server/src/index.ts`

- [ ] **Step 1: Write server/src/index.ts**

```ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import { ipRateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// CORS: allow frontend dev server
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json());

// Global IP rate limiting
app.use(ipRateLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`SceneGenie server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 2: Start server and test health endpoint**

Run in one terminal:
```bash
cd d:/video_gen/server && npm run dev
```

Expected output:
```
SQLite connected at D:\video_gen\server\data\scenegenie.db
SceneGenie server running on http://localhost:3001
```

In another terminal, test:
```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok","time":"..."}`

- [ ] **Step 3: Commit**

```bash
cd d:/video_gen && git add server/src/index.ts
git commit -m "feat: add Express entry point with CORS and routing"
```

---

## Task 9: Frontend API Service Layer

**Files:**
- Create: `app/src/services/api.ts`

- [ ] **Step 1: Write app/src/services/api.ts**

```ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('scene-genie-token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...((options?.headers as Record<string, string>) || {}),
    },
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    throw new ApiError(res.status, (data.error as string) || `HTTP ${res.status}`);
  }

  return data as T;
}

export const api = {
  sendCode: (email: string): Promise<{ message: string }> =>
    fetchJson('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  register: (email: string, password: string, name: string, code: string): Promise<AuthResponse> =>
    fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, code }),
    }),

  login: (email: string, password: string): Promise<AuthResponse> =>
    fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: (): Promise<{ message: string }> =>
    fetchJson('/auth/logout', { method: 'POST' }),

  me: (): Promise<{ user: ApiUser }> =>
    fetchJson('/auth/me'),
};
```

- [ ] **Step 2: Verify frontend compiles**

Run:
```bash
cd d:/video_gen/app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd d:/video_gen && git add app/src/services/api.ts
git commit -m "feat: add frontend API service layer"
```

---

## Task 10: Frontend useAuth Hook

**Files:**
- Modify: `app/src/hooks/useAuth.ts`

- [ ] **Step 1: Rewrite app/src/hooks/useAuth.ts**

```ts
import { useState, useCallback } from 'react';
import { api, type ApiUser } from '../services/api.js';

const STORAGE_KEY = 'scene-genie-auth';
const TOKEN_KEY = 'scene-genie-token';

export interface User {
  id: number;
  email: string;
  name: string;
}

function parseUser(stored: string | null): User | null {
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as ApiUser;
    return { id: parsed.id, email: parsed.email, name: parsed.name };
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() =>
    parseUser(localStorage.getItem(STORAGE_KEY))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!user;

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { token, user: apiUser } = await api.login(email, password);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apiUser));
      setUser({ id: apiUser.id, email: apiUser.email, name: apiUser.name });
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string, code: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const { token, user: apiUser } = await api.register(email, password, name, code);
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apiUser));
        setUser({ id: apiUser.id, email: apiUser.email, name: apiUser.name });
        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setError(null);
  }, []);

  return { user, isLoggedIn, isLoading, error, login, logout, register };
}
```

- [ ] **Step 2: Verify frontend compiles**

Run:
```bash
cd d:/video_gen/app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd d:/video_gen && git add app/src/hooks/useAuth.ts
git commit -m "feat: wire useAuth hook to real backend API"
```

---

## Task 11: Frontend LoginModal — Verification Code UI

**Files:**
- Modify: `app/src/components/LoginModal.tsx`

- [ ] **Step 1: Modify LoginModal.tsx — add state for code, countdown, and send-code handler**

Add imports at top (after existing imports):
```ts
import { useState, useEffect, useCallback } from 'react'; // change existing import
import { api } from '../services/api.js';
```

> Note: the existing `useState` import should be replaced with `useState, useEffect, useCallback`.

Add these state declarations inside the component (after existing state):
```ts
const [code, setCode] = useState('');
const [countdown, setCountdown] = useState(0);
const [codeSent, setCodeSent] = useState(false);
```

Add this effect for countdown timer (inside component, before return):
```ts
useEffect(() => {
  if (countdown <= 0) return;
  const timer = setInterval(() => {
    setCountdown((prev) => prev - 1);
  }, 1000);
  return () => clearInterval(timer);
}, [countdown]);
```

Add send-code handler (inside component, before handleSubmit):
```ts
const handleSendCode = useCallback(async () => {
  if (!email.trim() || !email.includes('@')) {
    setError(t({ en: 'Please enter a valid email first', zh: '请先输入有效邮箱' }));
    return;
  }
  setError('');
  try {
    await api.sendCode(email);
    setCodeSent(true);
    setCountdown(60);
  } catch (err) {
    setError((err as Error).message);
  }
}, [email, t]);
```

- [ ] **Step 2: Modify LoginModal.tsx — update handleSubmit for register flow**

Replace the register branch in `handleSubmit` (around line 32-48) with:
```ts
    if (mode === 'register') {
      if (!name.trim()) {
        setError(t({ en: 'Please enter your name', zh: '请输入您的姓名' }));
        return;
      }
      if (password !== confirmPassword) {
        setError(t({ en: 'Passwords do not match', zh: '密码不一致' }));
        return;
      }
      if (!code.trim() || code.length !== 6) {
        setError(t({ en: 'Please enter the 6-digit verification code', zh: '请输入6位验证码' }));
        return;
      }
      onRegister(email, password, name, code);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setCode('');
      setCodeSent(false);
      return;
    }
```

Also update `toggleMode` to reset code state:
```ts
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setCode('');
    setCodeSent(false);
    setCountdown(0);
  };
```

- [ ] **Step 3: Modify LoginModal.tsx — add verification code input field (after confirm password, before error display)**

Insert this JSX block after the confirm-password `<div>` and before the `{error && ...}` block:

```tsx
            {mode === 'register' && (
              <div>
                <label className="font-mono text-cream/70 text-[11px] uppercase tracking-wider block mb-2">
                  {t({ en: 'Verification Code', zh: '验证码' })}
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder={t({ en: '6-digit code', zh: '6位数字' })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-neon/50 transition-colors text-center tracking-[0.3em]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0}
                    className="px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-cream text-[12px] font-mono uppercase tracking-wider hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {countdown > 0
                      ? `${countdown}s`
                      : t({ en: 'Send Code', zh: '发送验证码' })}
                  </button>
                </div>
                {codeSent && countdown > 0 && (
                  <p className="font-mono text-neon/70 text-[11px] mt-2">
                    {t({ en: 'Code sent! Check your inbox.', zh: '验证码已发送！请查收邮箱。' })}
                  </p>
                )}
              </div>
            )}
```

- [ ] **Step 4: Modify LoginModal.tsx — update props interface**

Change the interface to:
```ts
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, name: string, code: string) => void;
  lang: Language;
  t: (dict: Record<Language, string>) => string;
}
```

And update destructuring:
```ts
export default function LoginModal({ isOpen, onClose, onLogin, onRegister, lang: _lang, t }: LoginModalProps) {
```

- [ ] **Step 5: Verify frontend compiles**

Run:
```bash
cd d:/video_gen/app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd d:/video_gen && git add app/src/components/LoginModal.tsx
git commit -m "feat: add verification code UI to LoginModal"
```

---

## Task 12: Frontend App.tsx Integration

**Files:**
- Modify: `app/src/App.tsx`

- [ ] **Step 1: Modify App.tsx to pass register handler**

Update the destructuring from `useAuth`:
```ts
  const { user, isLoggedIn, login, logout, register } = useAuth();
```

Add register handler:
```ts
  const handleRegister = async (email: string, password: string, name: string, code: string) => {
    const success = await register(email, password, name, code);
    if (success) {
      setShowLogin(false);
    }
  };
```

Update `handleLogin` to be async:
```ts
  const handleLogin = async (email: string, password: string) => {
    const success = await login(email, password);
    if (success) {
      setShowLogin(false);
    }
  };
```

Update LoginModal props:
```tsx
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        lang={lang}
        t={t}
      />
```

- [ ] **Step 2: Verify frontend compiles**

Run:
```bash
cd d:/video_gen/app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd d:/video_gen && git add app/src/App.tsx
git commit -m "feat: wire register handler into App root"
```

---

## Task 13: End-to-End Verification

**Files:**
- None (manual testing)

- [ ] **Step 1: Start both servers**

Terminal 1 — backend:
```bash
cd d:/video_gen/server && npm run dev
```

Terminal 2 — frontend:
```bash
cd d:/video_gen/app && npm run dev
```

- [ ] **Step 2: Test registration flow**

1. Open `http://localhost:5173`
2. Click "Log In" → switch to "Sign Up"
3. Fill name, email, password, confirm password
4. Click "Send Code" → check server logs (if no Resend API key, it'll log an error but proceed)
5. For testing without Resend, temporarily check the database: `sqlite3 server/data/scenegenie.db "SELECT code FROM verification_codes WHERE email='your@email.com' ORDER BY id DESC LIMIT 1;"`
6. Enter the code, click "Sign Up"
7. Expected: modal closes, Dashboard appears with user email in sidebar

- [ ] **Step 3: Test login flow**

1. Sign out from Dashboard
2. Click "Log In" → enter email and password
3. Click "Sign In"
4. Expected: modal closes, Dashboard appears

- [ ] **Step 4: Test /me endpoint**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/auth/me
```

Expected: `{"user":{"id":1,"email":"...","name":"..."}}`

- [ ] **Step 5: Test rate limiting**

Send more than 5 `/send-code` requests within 1 hour:
```bash
for i in {1..6}; do curl -X POST http://localhost:3001/api/auth/send-code -H "Content-Type: application/json" -d '{"email":"test@test.com"}'; echo; done
```

Expected: 6th request returns 429 with "Maximum 5 codes per hour reached".

- [ ] **Step 6: Commit**

```bash
cd d:/video_gen && git add -A
git commit -m "test: verify end-to-end auth flow"
```

---

## Spec Coverage Checklist

| Spec Section | Implementing Task |
|-------------|-------------------|
| SQLite schema (users, verification_codes, login_attempts) | Task 2 |
| bcrypt password hashing (cost 12) | Task 6 |
| JWT generation/verification (HS256, 7d) | Task 4 |
| 6-digit code generation, 5min expiry | Task 6 |
| Code single-use (used flag) | Task 5 + Task 6 |
| Email rate limit: 1/min, 5/hour | Task 3 + Task 6 |
| IP rate limit: 100/hour | Task 3 + Task 8 |
| Login lockout: 5 fails → 15min | Task 6 |
| Fuzzy error messages (no user enum) | Task 6 |
| `/api/auth/send-code` endpoint | Task 7 + Task 8 |
| `/api/auth/register` endpoint | Task 7 + Task 8 |
| `/api/auth/login` endpoint | Task 7 + Task 8 |
| `/api/auth/logout` endpoint | Task 7 + Task 8 |
| `/api/auth/me` endpoint | Task 7 + Task 8 |
| Frontend API service layer | Task 9 |
| Frontend useAuth with real calls | Task 10 |
| LoginModal verification code UI | Task 11 |
| Resend email integration | Task 4 |

---

## Placeholder Scan

- No "TBD", "TODO", "implement later", "fill in details" found.
- No vague error handling instructions — all handlers have explicit try/catch with specific error messages.
- No "similar to Task N" references.
- All code shown in full for every step.

## Type Consistency Check

- `TokenPayload` uses `{ userId: number; email: string; name: string }` consistently across Task 4, Task 3, Task 7.
- `ApiUser` / `User` both have `{ id: number; email: string; name: string }` consistently across Task 9, Task 10.
- `AuthenticatedRequest` interface in Task 3 matches usage in Task 7.
- SQLite column types match between Task 2 (CREATE TABLE) and Task 5 (queries).
