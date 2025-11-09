export default function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(
      { body: req.body, params: req.params, query: req.query },
      { abortEarly: false, stripUnknown: true }
    );
    if (error) {
      error.status = 400;
      return next(error);
    }
    req.body = value.body ?? req.body;
    req.params = value.params ?? req.params;
    req.query = value.query ?? req.query;
    next();
  };
}
