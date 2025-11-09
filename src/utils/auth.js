const extractClientInfo = (req) => ({
  ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
  userAgent: req.get('user-agent')
});

export default extractClientInfo;