// src/config/env.js
import 'dotenv/config';
import crypto from 'crypto';

const pick = (...keys) => keys.find((k) => typeof k === 'string' && k.length) || undefined;

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  PORT: Number(process.env.PORT || 4000),

  // MONGO
  MONGO_URI:
    process.env.MONGO_URI ||
    process.env.CONNECTION_URL || // your .env
    'mongodb://127.0.0.1:27017/exchangehub',

  // JWT (support both naming styles)
  JWT_SECRET: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'dev_jwt_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_TTL || '15m',

  REFRESH_SECRET:
    process.env.REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
  REFRESH_EXPIRES_IN:
    process.env.REFRESH_EXPIRES_IN || process.env.JWT_REFRESH_TTL || '30d',

  // encryption key for AES-256-GCM
  MASTER_KEY_HEX: process.env.MASTER_KEY_HEX,
  // Optional: pass-through of your CC_* vars if used elsewhere
  CC_BASE_URL: process.env.CC_BASE_URL,
  CC_CLIENT_ID: process.env.CC_CLIENT_ID,
  CC_CLIENT_SECRET: process.env.CC_CLIENT_SECRET,
  CC_ROOT: process.env.CC_ROOT,
  CC_EDITOR_URL: process.env.CC_EDITOR_URL,
  CC_TENANT_ID: process.env.CC_TENANT_ID,
};

const isHex64 = (v) => typeof v === 'string' && /^[0-9a-fA-F]{64}$/.test(v);


