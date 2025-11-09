import jwt from 'jsonwebtoken';

const ACCESS_TTL  = process.env.JWT_ACCESS_TTL  || '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '7d';

export function signTokens(user) {
  const accessSecret  = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
  
    throw new Error('Missing JWT secrets: set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env');
  }

  const payload = { sub: user._id.toString(), role: user.role };
  const accessToken  = jwt.sign(payload, accessSecret,  { expiresIn: ACCESS_TTL });
  const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: REFRESH_TTL });
  return { accessToken, refreshToken };
}

export function verifyAccess(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export function verifyRefresh(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}