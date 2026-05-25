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

// Periodic cleanup: remove expired codes and old login attempts every 30 minutes
setInterval(() => {
  db.run('DELETE FROM verification_codes WHERE expires_at < datetime("now")', (err) => {
    if (err) console.error('Cleanup verification_codes error:', err);
  });
  db.run('DELETE FROM login_attempts WHERE created_at < datetime("now", "-7 days")', (err) => {
    if (err) console.error('Cleanup login_attempts error:', err);
  });
}, 30 * 60 * 1000);
