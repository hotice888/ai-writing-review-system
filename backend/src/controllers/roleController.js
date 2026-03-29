const pool = require('../config/database');

// 获取所有角色
const getRoles = async (req, res) => {
  try {
    console.log('角色列表API被调用');
    console.log('请求参数:', req.query);
    console.log('用户信息:', req.user);
    
    const { includeDisabled, page = 1, pageSize = 10, keyword, status } = req.query;
    const pageNum = parseInt(page) || 1;
    const size = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * size;
    
    let whereClause = '';
    let params = [];
    let paramIndex = 1;
    
    // 按状态筛选
    if (status) {
      whereClause = ` WHERE status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    } else if (includeDisabled !== 'true') {
      // 默认不包含禁用的角色，除非明确指定
      whereClause = " WHERE status != 'disabled' OR status IS NULL";
    }
    
    // 添加关键词搜索
    if (keyword) {
      if (whereClause) {
        whereClause += " AND (name LIKE $" + paramIndex + " OR code LIKE $" + (paramIndex + 1) + ")";
      } else {
        whereClause = " WHERE name LIKE $" + paramIndex + " OR code LIKE $" + (paramIndex + 1);
      }
      params = [...params, `%${keyword}%`, `%${keyword}%`];
      paramIndex += 2;
    }
    
    // 获取总数
    const countResult = await pool.query(`SELECT COUNT(*) FROM roles${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);
    
    // 获取分页数据
    let query = `SELECT * FROM roles${whereClause} ORDER BY created_at ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const result = await pool.query(query, [...params, size, offset]);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: result.rows,
        total,
        page: pageNum,
        pageSize: size,
      },
    });
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.json({
      code: 500,
      message: '获取角色列表失败',
    });
  }
};

// 获取角色详情（包含菜单权限）
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const roleResult = await pool.query(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    );
    
    if (roleResult.rows.length === 0) {
      return res.json({
        code: 404,
        message: '角色不存在',
      });
    }

    const menuResult = await pool.query(
      `SELECT m.* FROM menus m
       INNER JOIN role_menus rm ON m.id = rm.menu_id
       WHERE rm.role_id = $1`,
      [id]
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        ...roleResult.rows[0],
        menus: menuResult.rows,
      },
    });
  } catch (error) {
    console.error('获取角色详情错误:', error);
    res.json({
      code: 500,
      message: '获取角色详情失败',
    });
  }
};

// 创建角色
const createRole = async (req, res) => {
  try {
    const { name, code, description, menuIds } = req.body;

    const existingRole = await pool.query(
      'SELECT id FROM roles WHERE code = $1 OR name = $2',
      [code, name]
    );

    if (existingRole.rows.length > 0) {
      return res.json({
        code: 400,
        message: '角色代码或名称已存在',
      });
    }

    const result = await pool.query(
      'INSERT INTO roles (name, code, description) VALUES ($1, $2, $3) RETURNING *',
      [name, code, description]
    );

    const roleId = result.rows[0].id;

    // 关联菜单
    if (menuIds && menuIds.length > 0) {
      for (const menuId of menuIds) {
        await pool.query(
          'INSERT INTO role_menus (role_id, menu_id) VALUES ($1, $2)',
          [roleId, menuId]
        );
      }
    }

    res.json({
      code: 200,
      message: '创建成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('创建角色错误:', error);
    res.json({
      code: 500,
      message: '创建角色失败',
    });
  }
};

// 系统内置角色代码（禁止修改）
const SYSTEM_ROLES = ['super_admin', 'admin', 'developer', 'user'];

// 更新角色
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, menuIds } = req.body;

    const existingRole = await pool.query(
      'SELECT id, code FROM roles WHERE id = $1',
      [id]
    );

    if (existingRole.rows.length === 0) {
      return res.json({
        code: 404,
        message: '角色不存在',
      });
    }

    const oldCode = existingRole.rows[0].code;

    // 检查是否是系统内置角色，禁止修改代码
    if (SYSTEM_ROLES.includes(oldCode) && code !== oldCode) {
      return res.json({
        code: 403,
        message: '系统内置角色代码不允许修改',
      });
    }

    const result = await pool.query(
      'UPDATE roles SET name = $1, code = $2, description = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, code, description, id]
    );

    // 更新菜单关联
    if (menuIds) {
      await pool.query('DELETE FROM role_menus WHERE role_id = $1', [id]);
      for (const menuId of menuIds) {
        await pool.query(
          'INSERT INTO role_menus (role_id, menu_id) VALUES ($1, $2)',
          [id, menuId]
        );
      }
    }

    res.json({
      code: 200,
      message: '更新成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('更新角色错误:', error);
    res.json({
      code: 500,
      message: '更新角色失败',
    });
  }
};

// 删除角色
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否是系统内置角色
    const existingRole = await pool.query(
      'SELECT code, status FROM roles WHERE id = $1',
      [id]
    );

    if (existingRole.rows.length === 0) {
      return res.json({
        code: 404,
        message: '角色不存在',
      });
    }

    if (SYSTEM_ROLES.includes(existingRole.rows[0].code)) {
      return res.json({
        code: 403,
        message: '系统内置角色不允许删除',
      });
    }

    // 检查角色是否被用户使用
    const userRolesResult = await pool.query(
      'SELECT COUNT(*) FROM user_roles WHERE role_id = $1',
      [id]
    );

    if (parseInt(userRolesResult.rows[0].count) > 0) {
      return res.json({
        code: 403,
        message: '角色已被用户分配使用，请先解除用户绑定后再删除',
      });
    }

    // 删除角色与菜单的绑定关系（如果存在）
    await pool.query('DELETE FROM role_menus WHERE role_id = $1', [id]);

    // 删除角色
    await pool.query('DELETE FROM roles WHERE id = $1', [id]);

    res.json({
      code: 200,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除角色错误:', error);
    res.json({
      code: 500,
      message: '删除角色失败',
    });
  }
};

// 获取当前用户的菜单（根据角色）
const getUserMenus = async (req, res) => {
  try {
    const { roles } = req.user;
    const { clientType } = req.query;

    const isDeveloper = roles.includes('developer');

    let query = `
      SELECT DISTINCT m.* FROM menus m
      WHERE m.status != 'disabled'
      AND (
        m.status = 'enabled'
        OR (m.status = 'not_implemented')
        OR (m.status = 'in_progress' AND $1)
      )
      AND (
        m.need_permission = false
        OR (
          m.need_permission = true
          AND EXISTS (
            SELECT 1 FROM role_menus rm
            INNER JOIN roles r ON rm.role_id = r.id
            WHERE rm.menu_id = m.id AND r.code = ANY($2)
          )
        )
      )
    `;
    
    const params = [isDeveloper, roles];
    
    if (clientType) {
      query += ` AND m.client_type = $3`;
      params.push(clientType);
    }
    
    query += ` ORDER BY m.sort_order ASC`;

    const result = await pool.query(query, params);

    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows,
    });
  } catch (error) {
    console.error('获取用户菜单错误:', error);
    res.json({
      code: 500,
      message: '获取用户菜单失败',
    });
  }
};

// 获取角色成员
const getRoleMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10, keyword } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    let whereClause = 'WHERE ur.role_id = $1';
    let params = [id];
    let paramIndex = 2;
    
    if (keyword) {
      whereClause += ` AND (u.username LIKE $${paramIndex} OR u.email LIKE $${paramIndex + 1})`;
      params.push(`%${keyword}%`, `%${keyword}%`);
      paramIndex += 2;
    }
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM user_roles ur INNER JOIN users u ON ur.user_id = u.id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.avatar, u.created_at 
       FROM user_roles ur 
       INNER JOIN users u ON ur.user_id = u.id 
       ${whereClause} 
       ORDER BY u.created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(pageSize), offset]
    );
    
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
    console.error('获取角色成员错误:', error);
    res.json({
      code: 500,
      message: '获取角色成员失败',
    });
  }
};

// 添加角色成员
const addRoleMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;
    
    if (!userIds || userIds.length === 0) {
      return res.json({
        code: 400,
        message: '请选择用户',
      });
    }
    
    for (const userId of userIds) {
      const existing = await pool.query(
        'SELECT id FROM user_roles WHERE role_id = $1 AND user_id = $2',
        [id, userId]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO user_roles (role_id, user_id) VALUES ($1, $2)',
          [id, userId]
        );
      }
    }
    
    res.json({
      code: 200,
      message: '添加成功',
    });
  } catch (error) {
    console.error('添加角色成员错误:', error);
    res.json({
      code: 500,
      message: '添加角色成员失败',
    });
  }
};

// 移除角色成员
const removeRoleMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    await pool.query(
      'DELETE FROM user_roles WHERE role_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    res.json({
      code: 200,
      message: '移除成功',
    });
  } catch (error) {
    console.error('移除角色成员错误:', error);
    res.json({
      code: 500,
      message: '移除角色成员失败',
    });
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getUserMenus,
  getRoleMembers,
  addRoleMember,
  removeRoleMember,
};
