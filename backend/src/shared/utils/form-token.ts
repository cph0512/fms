import crypto from 'crypto';
import { config } from '../../config/index.js';

const ALGORITHM = 'sha256';

/**
 * Creates an HMAC-signed token that encodes a company_id.
 * Format: base64url(company_id):base64url(hmac)
 */
export function signFormToken(companyId: string): string {
  const payload = Buffer.from(companyId).toString('base64url');
  const hmac = crypto.createHmac(ALGORITHM, config.jwtSecret).update(payload).digest('base64url');
  return `${payload}.${hmac}`;
}

/**
 * Verifies an HMAC-signed form token and returns the company_id.
 * Throws if the token is invalid or tampered with.
 */
export function verifyFormToken(token: string): string {
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) {
    throw new Error('Invalid form token');
  }

  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  const expected = crypto.createHmac(ALGORITHM, config.jwtSecret).update(payload).digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error('Invalid form token');
  }

  return Buffer.from(payload, 'base64url').toString();
}
