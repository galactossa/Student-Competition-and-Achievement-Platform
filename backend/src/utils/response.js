function success(res, data, message, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function error(res, message, status = 400, errors = null) {
  const body = { success: false, message, data: null };
  if (errors !== null) body.errors = errors;
  return res.status(status).json(body);
}

module.exports = { success, error };
