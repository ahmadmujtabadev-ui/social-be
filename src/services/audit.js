import { AuditLog } from '../models/sponser.js';

export async function logAudit({ actorId, entity, entityId, action, meta, req }) {
  return AuditLog.create({
    actorId,
    entity,
    entityId,
    action,
    meta,
    ip: req?.ip,
    ua: req?.headers['user-agent'],
  });
}
