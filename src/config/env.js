// src/config/env.js
import 'dotenv/config';
import crypto from 'crypto';
const required = (v, key) => {
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};
const pick = (...keys) => keys.find((k) => typeof k === 'string' && k.length) || undefined;

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  PORT: Number(process.env.PORT || 4000),

  // MONGO
  MONGO_URI:
    process.env.MONGO_URI ||
    process.env.CONNECTION_URL ,

  // JWT (support both naming styles)
  JWT_SECRET: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'dev_jwt_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_TTL || '15m',

  REFRESH_SECRET:
    process.env.REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
  REFRESH_EXPIRES_IN:
    process.env.REFRESH_EXPIRES_IN || process.env.JWT_REFRESH_TTL || '30d',

  // encryption key for AES-256-GCM
  // ───────── EMAIL CONFIG (for Nodemailer + Gmail) ─────────
  MAIL_USER: required(process.env.MAIL_USER, "MAIL_USER"),
  MAIL_PASS: required(process.env.MAIL_PASS, "MAIL_PASS"),

  // Admin notification email(s)
  MARKETING_ADMIN_EMAIL: process.env.MARKETING_ADMIN_EMAIL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
};

const isHex64 = (v) => typeof v === 'string' && /^[0-9a-fA-F]{64}$/.test(v);


