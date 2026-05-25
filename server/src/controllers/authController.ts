import type { Request, Response } from 'express';
import { sendCode, register, login } from '../services/authService.js';
import { isValidEmail, isValidPassword, isValidName, isValidCode } from '../utils/validators.js';

const KNOWN_REGISTER_ERRORS = [
  'Invalid or expired verification code',
  'Email already registered',
];

const KNOWN_LOGIN_ERRORS = [
  'Invalid email or password',
  'Account locked due to too many failed attempts',
];

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
    console.error('Send code error:', err);
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
      res.status(400).json({ error: 'Password must be at least 8 characters with at least one letter and one number' });
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
    const message = (err as Error).message;
    console.error('Register error:', err);
    if (KNOWN_REGISTER_ERRORS.some((known) => message.includes(known))) {
      res.status(400).json({ error: message });
    } else {
      res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
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
    const message = (err as Error).message;
    console.error('Login error:', err);
    if (KNOWN_LOGIN_ERRORS.some((known) => message.includes(known))) {
      res.status(401).json({ error: message });
    } else {
      res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
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
