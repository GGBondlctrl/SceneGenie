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
