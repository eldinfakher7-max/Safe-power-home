// Security Hardening Helper Utilities

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
const captchaStore = new Map();

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
  const captchaId = 'cap_' + Math.random().toString(36).slice(2, 10);

  captchaStore.set(captchaId, {
    answer,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
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
  if (!captchaId || !userAnswer) return false;

  const record = captchaStore.get(captchaId);
  if (!record) return false;

  // Single-use token (delete once checked)
  captchaStore.delete(captchaId);

  if (Date.now() > record.expiresAt) return false;

  return record.answer.trim() === userAnswer.toString().trim();
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
