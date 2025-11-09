import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized } from '../utils/http.js';

export function signTokens(payload) {
  const access = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  const refresh = jwt.sign(payload, env.REFRESH_SECRET, { expiresIn: env.REFRESH_EXPIRES_IN });
  return { access, refresh };
}

export function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return unauthorized(res, 'Missing token');
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    return unauthorized(res, 'Invalid token');
  }
}
