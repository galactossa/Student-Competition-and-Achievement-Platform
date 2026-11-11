const { error } = require('../utils/response');

const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    return error(res, 'Data yang dikirim belum valid.', 422, errors);
  }
  if (source === 'query') {
    req.validatedQuery = result.data;
  } else {
    req[source] = result.data;
  }
  return next();
};

module.exports = validate;
