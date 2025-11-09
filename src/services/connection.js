import { Connection } from '../models/vendor.js';
import { Credential } from '../models/participant.js';
import { logAudit } from './audit.js';
import { parsePageQuery } from '../utils/pagination.js';

export async function createConnectionService(req, body) {
  const ownerId = req.user.sub;
  const { credentialId, label, scope, account } = body;

  const cred = await Credential.findOne({ _id: credentialId, ownerId, status: 'active' });
  if (!cred) throw new Error('Active credential not found');

  const conn = await Connection.create({
    ownerId,
    credentialId: cred._id,
    exchange: cred.exchange,
    label: label || cred.label,
    account: account || cred.ownerUsername || cred.ownerEmail,
    scope,
    status: 'verifying',
    lastSyncAt: null,
  });

  await logAudit({ actorId: ownerId, entity: 'connection', entityId: conn._id, action: 'created', meta: { scope }, req });
  return { id: conn.id, status: conn.status };
}

export async function listConnectionService(req, query) {
  const ownerId = req.user.sub;
  const { q, exchange, status, scope, issuesOnly } = query;
  const { page, limit, skip } = parsePageQuery(req);

  const filter = { ownerId };
  if (exchange) filter.exchange = exchange;
  if (status) filter.status = status;
  if (scope) filter.scope = scope;
  if (issuesOnly) filter.status = 'failed';

  if (q) {
    filter.$or = [
      { label: new RegExp(q, 'i') },
      { account: new RegExp(q, 'i') },
      { exchange: new RegExp(q, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    Connection.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Connection.countDocuments(filter),
  ]);

  return {
    items: items.map((x) => ({
      id: x.id,
      exchange: x.exchange,
      label: x.label,
      account: x.account,
      status: x.status,
      lastSyncAt: x.lastSyncAt,
      scope: x.scope,
      fingerprint: undefined, // can join via credential if needed
      createdAt: x.createdAt,
      lastError: x.lastError || null,
    })),
    page, limit, total,
  };
}

export async function pauseConnectionService(req, id) {
  const ownerId = req.user.sub;
  const conn = await Connection.findOne({ _id: id, ownerId });
  if (!conn) throw new Error('Connection not found');
  conn.status = 'paused';
  await conn.save();
  await logAudit({ actorId: ownerId, entity: 'connection', entityId: conn._id, action: 'paused', meta: {}, req });
  return { id: conn.id, status: conn.status };
}

export async function resumeConnectionService(req, id) {
  const ownerId = req.user.sub;
  const conn = await Connection.findOne({ _id: id, ownerId });
  if (!conn) throw new Error('Connection not found');
  conn.status = 'connected';
  await conn.save();
  await logAudit({ actorId: ownerId, entity: 'connection', entityId: conn._id, action: 'resumed', meta: {}, req });
  return { id: conn.id, status: conn.status };
}

export async function removeConnectionService(req, id) {
  const ownerId = req.user.sub;
  const conn = await Connection.findOneAndDelete({ _id: id, ownerId });
  if (!conn) throw new Error('Connection not found');
  await logAudit({ actorId: ownerId, entity: 'connection', entityId: id, action: 'removed', meta: {}, req });
  return { id };
}

export async function syncNowService(req, id) {
  const ownerId = req.user.sub;
  const conn = await Connection.findOne({ _id: id, ownerId });
  if (!conn) throw new Error('Connection not found');
  // simulate sync
  conn.lastSyncAt = new Date();
  conn.status = conn.status === 'failed' ? 'verifying' : conn.status;
  await conn.save();
  await logAudit({ actorId: ownerId, entity: 'connection', entityId: conn._id, action: 'sync', meta: {}, req });
  return { id: conn.id, lastSyncAt: conn.lastSyncAt, status: conn.status };
}
