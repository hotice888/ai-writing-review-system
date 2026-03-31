const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = (req, res, next) => {
  try {
    console.log('Authorization header:', req.headers.authorization);
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Token:', token);

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    return res.status(401).json({
      code: 401,
      message: '无效的认证令牌',
    });
  }
};

const adminMiddleware = (req, res, next) => {
  const roles = req.user.roles || [];
  if (!roles.includes('admin') && !roles.includes('super_admin')) {
    return res.status(403).json({
      code: 403,
      message: '需要管理员权限',
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  JWT_SECRET,
};
