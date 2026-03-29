const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const register = async (req, res) => {
  console.log('接收到注册请求:', req.body);
  try {
    const { username, email, password } = req.body;

    // 检查用户是否存在
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      console.log('用户已存在:', existingUser.rows[0]);
      return res.json({
        code: 400,
        message: '用户名或邮箱已存在',
      });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入用户数据
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, hashedPassword]
    );

    const user = result.rows[0];
    console.log('用户创建成功:', user);

    // 为新用户分配默认角色（普通用户）
    try {
      const roleResult = await pool.query(
        'SELECT id FROM roles WHERE code = $1',
        ['user']
      );
      
      if (roleResult.rows.length > 0) {
        const roleId = roleResult.rows[0].id;
        await pool.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [user.id, roleId]
        );
        console.log('角色分配成功');
      }
    } catch (roleError) {
      console.error('分配默认角色错误:', roleError);
      // 分配角色失败不影响注册
    }

    console.log('注册成功，返回用户信息');
    res.json({
      code: 200,
      message: '注册成功',
      data: user,
    });
  } catch (error) {
    console.error('注册错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      code: 500,
      message: '注册失败: ' + error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.json({
        code: 401,
        message: '用户名或密码错误',
      });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.json({
        code: 401,
        message: '用户名或密码错误',
      });
    }

    // 获取用户角色列表
    const rolesResult = await pool.query(
      `SELECT r.code FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );
    const roles = rolesResult.rows.map(r => r.code);

    const token = jwt.sign(
      { id: user.id, username: user.username, roles },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          roles,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.json({
      code: 500,
      message: '登录失败',
    });
  }
};

const getUserInfo = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({
        code: 404,
        message: '用户不存在',
      });
    }

    const user = result.rows[0];

    // 获取用户角色列表
    const rolesResult = await pool.query(
      `SELECT r.code, r.name FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [req.user.id]
    );
    const roles = rolesResult.rows.map(r => r.code);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        ...user,
        roles,
      },
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.json({
      code: 500,
      message: '获取用户信息失败',
    });
  }
};

const logout = async (req, res) => {
  res.json({
    code: 200,
    message: '退出成功',
  });
};

const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.json({
        code: 400,
        message: '未提供令牌',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.json({
        code: 404,
        message: '用户不存在',
      });
    }

    const user = result.rows[0];

    const rolesResult = await pool.query(
      `SELECT r.code, r.name FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );
    const roles = rolesResult.rows.map(r => r.code);

    res.json({
      code: 200,
      message: '验证成功',
      data: {
        user: {
          ...user,
          roles,
        },
        token,
      },
    });
  } catch (error) {
    console.error('验证令牌错误:', error);
    res.json({
      code: 401,
      message: '无效的认证令牌',
    });
  }
};

module.exports = {
  register,
  login,
  getUserInfo,
  logout,
  verifyToken,
};
