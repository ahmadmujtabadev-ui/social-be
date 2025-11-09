// src/controllers/user.js
import asyncHandler from '../middleware/asyncHandler.js';
import { ok, created } from '../utils/http.js';
import {
  registerService,
  loginService,
  refreshService,
  meService,
  forgotPasswordService,
  resetPasswordService,
  changePasswordService,
  toggle2FAService,
} from '../services/user.js';

export const register = asyncHandler(async (req, res) => {
  console.log("req", req.body)
  const data = await registerService(req.body);
  return created(res, data, 'Signup processed');
});

export const login = asyncHandler(async (req, res) => {
  const data = await loginService(req, req.body);
  return ok(res, data, 'Login processed');
});

export const refresh = asyncHandler(async (req, res) => {
  const data = await refreshService(req.body);
  return ok(res, data, 'Token refreshed');
});

export const me = asyncHandler(async (req, res) => {
  const data = await meService(req.user.sub);
  return ok(res, data, 'OK');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const data = await forgotPasswordService(req.body);
  return ok(res, data, 'If the email exists, a reset link has been sent.');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const data = await resetPasswordService(req.body);
  return ok(res, data, 'Password reset');
});

export const changePassword = asyncHandler(async (req, res) => {
  const data = await changePasswordService(req.user.sub, req.body);
  return ok(res, data, 'Password changed');
});

export const toggle2FA = asyncHandler(async (req, res) => {
  const data = await toggle2FAService(req.user.sub);
  return ok(res, data, '2FA flag toggled');
});
