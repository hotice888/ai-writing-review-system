const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const getUserList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, role } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    // 关键词搜索（用户名或邮箱）
    if (keyword) {
      whereClause = 'WHERE (u.username LIKE $1 OR u.email LIKE $2)';
      params = [`%${keyword}%`, `%${keyword}%`];
      paramIndex = 3;
    }



    // 基础查询SQL
    let baseQuery = `FROM users u ${whereClause}`;
    
    // 如果按角色筛选，需要关联user_roles表
    if (role) {
      baseQuery = `FROM users u 
        INNER JOIN user_roles ur ON u.id = ur.user_id 
        INNER JOIN roles r ON ur.role_id = r.id 
        ${whereClause ? whereClause + ' AND' : 'WHERE'} r.code = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    const countResult = await pool.query(`SELECT COUNT(DISTINCT u.id) ${baseQuery}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT DISTINCT u.id, u.username, u.email, u.avatar, u.created_at ${baseQuery} ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );

    // 获取每个用户的角色
    const usersWithRoles = await Promise.all(
      result.rows.map(async (user) => {
        const rolesResult = await pool.query(
          `SELECT r.id, r.code, r.name FROM user_roles ur
           INNER JOIN roles r ON ur.role_id = r.id
           WHERE ur.user_id = $1`,
          [user.id]
        );
        return {
          ...user,
          roles: rolesResult.rows,
        };
      })
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: usersWithRoles,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.json({
      code: 500,
      message: '获取用户列表失败',
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        code: 404,
        message: '用户不存在',
      });
    }

    const user = result.rows[0];

    // 获取用户角色
    const rolesResult = await pool.query(
      `SELECT r.id, r.code, r.name FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        ...user,
        roles: rolesResult.rows,
      },
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.json({
      code: 500,
      message: '获取用户详情失败',
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, roles = [] } = req.body;

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.json({
        code: 400,
        message: '用户名或邮箱已存在',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, hashedPassword]
    );

    const user = result.rows[0];

    // 分配角色 - 将角色代码转换为角色ID
    if (roles && roles.length > 0) {
      for (const roleCode of roles) {
        const roleResult = await pool.query(
          'SELECT id FROM roles WHERE code = $1',
          [roleCode]
        );
        if (roleResult.rows.length > 0) {
          const roleId = roleResult.rows[0].id;
          await pool.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING',
            [user.id, roleId]
          );
        }
      }
    }

    // 获取用户角色
    const rolesResult = await pool.query(
      `SELECT r.id, r.code, r.name FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    res.json({
      code: 200,
      message: '创建成功',
      data: {
        ...user,
        roles: rolesResult.rows,
      },
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.json({
      code: 500,
      message: '创建用户失败',
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, password, roles } = req.body;
    
    console.log('更新用户 - userId:', userId);
    console.log('更新用户 - roles:', roles);
    console.log('更新用户 - roles类型:', typeof roles, '是否为数组:', Array.isArray(roles));

    const existingUser = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (existingUser.rows.length === 0) {
      return res.json({
        code: 404,
        message: '用户不存在',
      });
    }

    const updateFields = [];
    const updateParams = [];
    let paramIndex = 1;

    if (username) {
      updateFields.push(`username = $${paramIndex++}`);
      updateParams.push(username);
    }

    if (email) {
      updateFields.push(`email = $${paramIndex++}`);
      updateParams.push(email);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(`password = $${paramIndex++}`);
      updateParams.push(hashedPassword);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateParams.push(userId);

    if (updateFields.length > 1) {
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
      await pool.query(query, updateParams);
    }

    // 更新角色 - 将角色代码转换为角色ID
    if (roles !== undefined) {
      console.log('开始更新角色，roles:', roles);
      // 删除原有角色
      await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
      console.log('已删除原有角色');
      // 添加新角色
      if (roles.length > 0) {
        for (const roleCode of roles) {
          console.log('处理角色代码:', roleCode);
          const roleResult = await pool.query(
            'SELECT id FROM roles WHERE code = $1',
            [roleCode]
          );
          if (roleResult.rows.length > 0) {
            const roleId = roleResult.rows[0].id;
            console.log('找到角色ID:', roleId);
            await pool.query(
              'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING',
              [userId, roleId]
            );
          } else {
            console.log('未找到角色代码:', roleCode);
          }
        }
      }
    }

    const updatedUser = await pool.query(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = $1',
      [userId]
    );

    // 获取用户角色
    const rolesResult = await pool.query(
      `SELECT r.id, r.code, r.name FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    console.log('更新后的用户角色:', rolesResult.rows);

    res.json({
      code: 200,
      message: '更新成功',
      data: {
        ...updatedUser.rows[0],
        roles: rolesResult.rows,
      },
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.json({
      code: 500,
      message: '更新用户失败',
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      code: 200,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.json({
      code: 500,
      message: '删除用户失败',
    });
  }
};

const getReviewList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT COUNT(*) FROM reviews';
    let params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    const countResult = await pool.query(query, params);
    const total = parseInt(countResult.rows[0].count);

    query = 'SELECT * FROM reviews';
    if (status) {
      query += ' WHERE status = $1';
    }
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(pageSize, offset);

    const result = await pool.query(query, params);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: result.rows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    console.error('获取评审列表错误:', error);
    res.json({
      code: 500,
      message: '获取评审列表失败',
    });
  }
};

const approveReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    await pool.query(
      'UPDATE reviews SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['approved', reviewId]
    );

    res.json({
      code: 200,
      message: '审核通过',
    });
  } catch (error) {
    console.error('审核通过错误:', error);
    res.json({
      code: 500,
      message: '审核通过失败',
    });
  }
};

const rejectReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    await pool.query(
      'UPDATE reviews SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['rejected', reviewId]
    );

    res.json({
      code: 200,
      message: '审核拒绝',
    });
  } catch (error) {
    console.error('审核拒绝错误:', error);
    res.json({
      code: 500,
      message: '审核拒绝失败',
    });
  }
};

const getUserModels = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT um.*, u.username 
      FROM user_models um
      LEFT JOIN users u ON um.user_id = u.id
      ORDER BY um.created_at DESC
    `);
    console.log('用户模型查询结果:', result.rows);
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows
    });
  } catch (error) {
    console.error('获取用户模型列表错误:', error);
    res.json({
      code: 500,
      message: '获取用户模型列表失败',
    });
  }
};

const getUserAgents = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ua.*, u.username 
      FROM user_agents ua
      LEFT JOIN users u ON ua.user_id = u.id
      ORDER BY ua.created_at DESC
    `);
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows
    });
  } catch (error) {
    console.error('获取用户智能体列表错误:', error);
    res.json({
      code: 500,
      message: '获取用户智能体列表失败',
    });
  }
};

module.exports = {
  getUserList,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserModels,
  getUserAgents,
  getReviewList,
  approveReview,
  rejectReview,
};
