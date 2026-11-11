const { AuditLog } = require('../models');

async function logAudit(req, action, model, modelId, oldValues = null, newValues = null, options = {}) {
  return AuditLog.create({
    user_id: req.user?.id || null,
    action,
    model_type: model,
    model_id: modelId,
    old_values: oldValues,
    new_values: newValues,
    ip_address: req.ip || null,
    user_agent: req.get('user-agent') || null
  }, options);
}

module.exports = { logAudit };
