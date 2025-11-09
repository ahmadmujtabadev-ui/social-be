// src/services/user.js
import User from '../models/user.js';
import { signTokens, verifyRefresh } from '../utils/jwt.js';
import extractClientInfo from '../utils/auth.js';
import AppError from '../utils/appError.js';
// import sendResetEmail from '../utils/send-reset-email.js'; // optional

export const toPublicUser = (u) => ({
  id: u._id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  businessName: u.businessName,
  role: u.role,
  emailVerified: u.emailVerified,
  twoFactorEnabled: u.twoFactorEnabled, // kept for compatibility (not used)
  apiKeyLast4: u.apiKeyLast4,
  subscription: u.subscription,
  profile: u.profile,
  settings: u.settings,
  lastLoginAt: u.lastLoginAt,
});

export async function registerService({ email, password, businessName, country, phone, role }) {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered', 409);

  const user = await User.create({
    email,
    password,
    businessName,
    country,
    phone,
    role,
    isActive: true,
    emailVerified: true, // no OTP → verified immediately
  });

  const tokens = signTokens(user);
  return { user: toPublicUser(user), ...tokens, message: 'Signup successful.' };
}

/**
 * LOGIN (no OTP)
 */
export async function loginService(req, { email, password }) {
  const { ip, userAgent } = extractClientInfo(req);
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) throw new AppError('Invalid credentials', 401);

  const ok = await user.comparePassword(password);
  
  if (!ok) {
    await User.updateOne(
      { _id: user._id },
      { $push: { loginHistory: { ip, userAgent, status: 'failure' } } }
    );
    throw new AppError('Invalid credentials', 401);
  }

  user.lastLoginAt = new Date();
  user.loginHistory.push({ ip, userAgent, status: 'success' });
  await user.save();

  const tokens = signTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

/**
 * CHANGE PASSWORD (authenticated)
 */
export async function changePasswordService(userId, { oldPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const ok = await user.comparePassword(oldPassword);
  if (!ok) throw new AppError('Old password incorrect', 400);

  user.password = newPassword;
  await user.save();
  return { message: 'Password changed successfully.' };
}

/**
 * FORGOT PASSWORD (no OTP) → token link
 * - Generates a short-lived token, stores hash+expiry
 * - Returns generic message; in dev you can also return the raw token
 */
export async function forgotPasswordService({ email }) {
  const user = await User.findOne({ email });
  if (user) {
    const raw = user.createPasswordResetToken();
    await user.save();

    // Send reset email with a link containing ?token=<raw>
    // await sendResetEmail({ to: user.email, resetToken: raw });

    // For development convenience, you can return the token here:
    return { message: 'If the email exists, a reset link has been sent.', devToken: raw };
  }
  return { message: 'If the email exists, a reset link has been sent.' };
}

/**
 * RESET PASSWORD (no OTP)
 * - Accepts { token, newPassword }
 */
export async function resetPasswordService({ token, newPassword }) {
  if (!token) throw new AppError('Invalid token', 400);
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password');

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  user.password = newPassword;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return { message: 'Password updated. You can now log in.' };
}

/**
 * REFRESH TOKENS
 */
export async function refreshService({ refreshToken }) {
  try {
    const payload = verifyRefresh(refreshToken);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw new AppError('Invalid token', 401);
    const tokens = signTokens(user);
    return tokens;
  } catch {
    throw new AppError('Invalid token', 401);
  }
}

/**
 * ME
 */
export async function meService(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return { user: toPublicUser(user) };
}

/**
 * Toggle 2FA flag (optional; no OTP flows behind it)
 */
export async function toggle2FAService(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.twoFactorEnabled = !user.twoFactorEnabled;
  await user.save();
  return { twoFactorEnabled: user.twoFactorEnabled };
}
