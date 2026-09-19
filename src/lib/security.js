// Security Hardening Helper Utilities
import crypto from 'crypto';

/**
 * Validates password against policy:
 * - At least 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 */
export function validatePasswordPolicy(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required.' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number (0-9).' };
  }

  return { valid: true, message: '' };
}

/**
 * Validates email address format
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim()) && email.length <= 100;
}

/**
 * Sanitizes input strings against XSS and truncates excessive lengths
 */
export function sanitizeString(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  let str = input.trim().slice(0, maxLength);
  // HTML Escape unsafe XSS characters
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Removes HTML escaping for internal processing if needed
 */
export function unescapeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Sanitizes output user objects before sending over API (strips passwords, hashes, keys)
 */
export function sanitizeUserObject(user) {
  if (!user) return null;
  const { password, password_hash, secret, ...safeUser } = user;
  return safeUser;
}

// In-Memory CAPTCHA Challenge Store
if (!globalThis._captchaStore) {
  globalThis._captchaStore = new Map();
}
const captchaStore = globalThis._captchaStore;

// Normalizes digits across Arabic and English keyboard layouts
function normalizeDigits(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632)
    .replace(/[۰-۹]/g, d => d.charCodeAt(0) - 1776)
    .trim();
}

// Periodic cleanup of expired challenges
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [id, record] of captchaStore.entries()) {
      if (now > record.expiresAt) {
        captchaStore.delete(id);
      }
    }
  }, 3 * 60 * 1000);
}

/**
 * Generates a server-verified CAPTCHA challenge
 */
export function createCaptchaChallenge() {
  const num1 = Math.floor(Math.random() * 9) + 1;
  const num2 = Math.floor(Math.random() * 9) + 1;
  const answer = (num1 + num2).toString();
  const timestamp = Date.now();
  const secret = process.env.JWT_SECRET || 'smart_power_captcha_secret_99';
  const hmac = crypto.createHmac('sha256', secret).update(`${num1}:${num2}:${timestamp}`).digest('hex').slice(0, 16);
  const captchaId = `cap_${num1}_${num2}_${timestamp}_${hmac}`;

  captchaStore.set(captchaId, {
    answer,
    expiresAt: timestamp + 10 * 60 * 1000, // 10 minutes validity
  });

  return {
    captchaId,
    question: `Security Verification: What is ${num1} + ${num2}?`,
    num1,
    num2
  };
}

/**
 * Verifies a CAPTCHA challenge answer on the server-side
 */
export function verifyCaptchaToken(captchaId, userAnswer) {
  if (!captchaId || userAnswer === undefined || userAnswer === null) return false;

  const normalizedUserAnswer = normalizeDigits(userAnswer);
  if (!normalizedUserAnswer) return false;

  // 1. Check in-memory store if present
  if (captchaStore.has(captchaId)) {
    const record = captchaStore.get(captchaId);
    captchaStore.delete(captchaId);
    if (Date.now() <= record.expiresAt) {
      if (normalizeDigits(record.answer) === normalizedUserAnswer) {
        return true;
      }
    }
  }

  // 2. Stateless HMAC verification (resilient against server restarts and worker boundaries)
  try {
    const parts = captchaId.split('_');
    if (parts.length === 5 && parts[0] === 'cap') {
      const num1 = parseInt(parts[1], 10);
      const num2 = parseInt(parts[2], 10);
      const timestamp = parseInt(parts[3], 10);
      const expectedHmac = parts[4];

      // Expire after 10 minutes
      if (Date.now() - timestamp > 10 * 60 * 1000) return false;

      const secret = process.env.JWT_SECRET || 'smart_power_captcha_secret_99';
      const computedHmac = crypto.createHmac('sha256', secret).update(`${num1}:${num2}:${timestamp}`).digest('hex').slice(0, 16);

      if (computedHmac === expectedHmac) {
        const expectedAnswer = (num1 + num2).toString();
        return expectedAnswer === normalizedUserAnswer;
      }
    }
  } catch (err) {
    return false;
  }

  return false;
}

/**
 * Standard HTTP Security Headers
 */
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss:;"
  };
}
