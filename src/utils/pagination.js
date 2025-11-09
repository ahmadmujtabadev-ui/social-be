export function parsePageQuery(req, defaults = { limit: 20, max: 100 }) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(defaults.max, Math.max(1, Number(req.query.limit || defaults.limit)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
