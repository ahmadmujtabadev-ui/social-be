import { Credential } from '../models/credientials.js';
import { logAudit } from './audit.js';
import { encryptSecret, fingerprint, maskKeyLast4 } from '../config/crypto.js';
import { parsePageQuery } from '../utils/pagination.js';

// ⬇️ NEW
export async function deleteCredentialService(req, id) {
  const ownerId = req.user.sub;

  const c = await Credential.findOne({ _id: id, ownerId });
  if (!c) throw new Error('Credential not found');

  await Credential.deleteOne({ _id: c._id, ownerId });

  await logAudit({
    actorId: ownerId,
    entity: 'credential',
    entityId: c._id,
    action: 'deleted',
    meta: { exchange: c.exchange, label: c.label },
    req,
  });

  return { id: c.id };
}


export async function createCredentialService(req, body) {
  const ownerId = req?.user?.sub;
  if (!ownerId) throw new Error('Unauthorized');

  const { exchange, apiKey, apiSecret, email, username, label } = body || {};

  if (!exchange || !apiKey || !apiSecret) {
    throw new Error('exchange, apiKey and apiSecret are required');
  }

  // derive display + storage fields
  const { last4, masked } = maskKeyLast4(apiKey);
  const fp = fingerprint(apiKey);            // sha256 hex
  const secretEnc = encryptSecret(apiSecret); // AES-256-GCM

  // create doc
  const doc = await Credential.create({
    ownerId,
    exchange,
    label,
    apiKeyLast4: last4,
    apiKeyFingerprint: fp,
    secretEnc,
    ownerEmail: email || undefined,
    ownerUsername: username || undefined,
    status: 'active',
  });

  // audit (non-blocking if you prefer)
  await logAudit({
    actorId: ownerId,
    entity: 'credential',
    entityId: doc._id,
    action: 'created',
    meta: { exchange, label },
    req,
  });

  // response payload
  return {
    id: doc.id,
    exchange: doc.exchange,
    label: doc.label,
    apiKeyMasked: masked,
    apiKeyFingerprint: doc.apiKeyFingerprint,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

export async function listCredentialService(req, query) {
  const ownerId = req.user.sub;
  const { q, exchange, status, age, sortBy, sortDir } = query;
  const { page, limit, skip } = parsePageQuery(req);

  const filter = { ownerId };
  if (exchange) filter.exchange = exchange;
  if (status) filter.status = status;

  if (q) {
    filter.$or = [
      { label: new RegExp(q, 'i') },
      { ownerEmail: new RegExp(q, 'i') },
      { ownerUsername: new RegExp(q, 'i') },
      { apiKeyLast4: new RegExp(q, 'i') },
    ];
  }

  if (age === 'gt30') filter.lastUsedAt = { $lte: new Date(Date.now() - 30 * 24 * 3600 * 1000) };
  if (age === 'gt90') filter.lastUsedAt = { $lte: new Date(Date.now() - 90 * 24 * 3600 * 1000) };

  const sort = {};
  if (sortBy === 'lastUsed') sort.lastUsedAt = sortDir === 'asc' ? 1 : -1;
  else sort.createdAt = sortDir === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    Credential.find(filter).sort(sort).skip(skip).limit(limit),
    Credential.countDocuments(filter),
  ]);

  return {
    items: items.map((c) => ({
      id: c.id,
      exchange: c.exchange,
      label: c.label,
      apiKeyLast4: c.apiKeyLast4,
      apiKeyFingerprint: c.apiKeyFingerprint,
      ownerEmail: c.ownerEmail,
      ownerUsername: c.ownerUsername,
      status: c.status,
      createdAt: c.createdAt,
      lastUsedAt: c.lastUsedAt,
      notes: c.notes,
    })),
    page, limit, total,
  };
}

export async function rotateCredentialService(req, id) {
  const ownerId = req.user.sub;
  const c = await Credential.findOne({ _id: id, ownerId });
  if (!c) throw new Error('Credential not found');

  // rotation is domain-specific; here we just mark an audit
  await logAudit({ actorId: ownerId, entity: 'credential', entityId: c._id, action: 'rotated', meta: {}, req });
  return { id: c.id, message: 'Rotate requested' };
}

export async function revokeCredentialService(req, id) {
  const ownerId = req.user.sub;
  const c = await Credential.findOne({ _id: id, ownerId });
  if (!c) throw new Error('Credential not found');

  c.status = 'revoked';
  await c.save();

  await logAudit({ actorId: ownerId, entity: 'credential', entityId: c._id, action: 'revoked', meta: {}, req });
  return { id: c.id, status: c.status };
}
