import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../../config/index.js';

interface AccessTokenPayload {
  userId: string;
  companyId: string;
  username: string;
}

interface RefreshTokenPayload {
  userId: string;
}

const blacklist = new Set<string>();

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = { expiresIn: 900 }; // 15 minutes in seconds
  return jwt.sign(payload, config.jwtSecret, options);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = { expiresIn: 604800 }; // 7 days in seconds
  return jwt.sign(payload, config.jwtRefreshSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwtRefreshSecret) as RefreshTokenPayload;
}

export function blacklistToken(token: string): void {
  blacklist.add(token);
}

export function isBlacklisted(token: string): boolean {
  return blacklist.has(token);
}
