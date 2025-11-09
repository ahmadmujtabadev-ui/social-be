export function requireRole(role) {
  return (req, res, next) => {
  
    const userRole = req.user?.role || req.userRole;
    if (userRole !== role) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}