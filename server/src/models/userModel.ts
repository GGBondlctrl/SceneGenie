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
