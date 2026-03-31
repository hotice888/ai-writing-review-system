const pool = require('../config/database');

// 获取所有菜单
const getMenus = async (req, res) => {
  try {
    const { clientType, page = 1, pageSize = 10, flatten = false, keyword, status, needPermission, position } = req.query;
    let query = 'SELECT * FROM menus WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (clientType) {
      query += ` AND client_type = $${paramIndex}`;
      params.push(clientType);
      paramIndex++;
    }
    
    // 按状态筛选
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    // 按是否需要权限筛选
    if (needPermission !== undefined && needPermission !== '') {
      query += ` AND need_permission = $${paramIndex}`;
      params.push(needPermission === 'true');
      paramIndex++;
    }
    
    // 按菜单位置筛选
    if (position) {
      query += ` AND position = $${paramIndex}`;
      params.push(position);
      paramIndex++;
    }
    
    // 添加关键词搜索
    if (keyword) {
      query += ` AND (name LIKE $${paramIndex} OR path LIKE $${paramIndex + 1} OR code LIKE $${paramIndex + 2})`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      paramIndex += 3;
    }
    
    if (flatten === 'true') {
      // 扁平化列表，支持分页
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      
      // 获取总数
      const countResult = await pool.query(query, params);
      const total = countResult.rows.length;
      
      // 获取分页数据
      query += ' ORDER BY client_type ASC, position ASC, sort_order ASC, created_at ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(parseInt(pageSize), offset);
      
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
    } else {
      // 树形结构
      query += ' ORDER BY client_type ASC, position ASC, sort_order ASC, created_at ASC';
      const result = await pool.query(query, params);
      
      // 构建树形结构
      const menus = result.rows;
      const menuTree = buildMenuTree(menus);
      
      res.json({
        code: 200,
        message: '获取成功',
        data: menuTree,
      });
    }
  } catch (error) {
    console.error('获取菜单列表错误:', error);
    res.json({
      code: 500,
      message: '获取菜单列表失败',
    });
  }
};

// 获取菜单详情
const getMenuById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM menus WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        code: 404,
        message: '菜单不存在',
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('获取菜单详情错误:', error);
    res.json({
      code: 500,
      message: '获取菜单详情失败',
    });
  }
};

// 创建菜单
const createMenu = async (req, res) => {
  try {
    const { name, code, path, component, icon, parentId, sortOrder, type, status, clientType, needPermission, position } = req.body;

    const result = await pool.query(
      `INSERT INTO menus (name, code, path, component, icon, parent_id, sort_order, type, status, client_type, need_permission, position) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [name, code, path, component, icon, parentId || null, sortOrder || 0, type || 'menu', status || 'enabled', clientType || 'admin', needPermission !== false, position || 'left']
    );

    res.json({
      code: 200,
      message: '创建成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('创建菜单错误:', error);
    res.json({
      code: 500,
      message: '创建菜单失败',
    });
  }
};

// 更新菜单
const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existingMenu = await pool.query(
      'SELECT * FROM menus WHERE id = $1',
      [id]
    );

    if (existingMenu.rows.length === 0) {
      return res.json({
        code: 404,
        message: '菜单不存在',
      });
    }

    // 获取现有菜单数据
    const existingMenuData = existingMenu.rows[0];
    
    // 构建更新语句和参数
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    // 只更新前端提供的字段
    if (body.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      params.push(body.name);
      paramIndex++;
    }
    if (body.code !== undefined) {
      updateFields.push(`code = $${paramIndex}`);
      params.push(body.code);
      paramIndex++;
    }
    if (body.path !== undefined) {
      updateFields.push(`path = $${paramIndex}`);
      params.push(body.path);
      paramIndex++;
    }
    if (body.component !== undefined) {
      updateFields.push(`component = $${paramIndex}`);
      params.push(body.component);
      paramIndex++;
    }
    if (body.icon !== undefined) {
      updateFields.push(`icon = $${paramIndex}`);
      params.push(body.icon);
      paramIndex++;
    }
    if (body.parentId !== undefined) {
      updateFields.push(`parent_id = $${paramIndex}`);
      params.push(body.parentId || null);
      paramIndex++;
    }
    if (body.sortOrder !== undefined) {
      updateFields.push(`sort_order = $${paramIndex}`);
      params.push(body.sortOrder || 0);
      paramIndex++;
    }
    if (body.type !== undefined) {
      updateFields.push(`type = $${paramIndex}`);
      params.push(body.type || 'menu');
      paramIndex++;
    }
    if (body.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      params.push(body.status || 'enabled');
      paramIndex++;
    }
    if (body.clientType !== undefined) {
      updateFields.push(`client_type = $${paramIndex}`);
      params.push(body.clientType || 'admin');
      paramIndex++;
    }
    if (body.needPermission !== undefined) {
      updateFields.push(`need_permission = $${paramIndex}`);
      params.push(body.needPermission);
      paramIndex++;
    }
    if (body.position !== undefined) {
      updateFields.push(`position = $${paramIndex}`);
      params.push(body.position || 'left');
      paramIndex++;
    }

    // 添加updated_at字段
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // 如果没有字段需要更新，直接返回
    if (updateFields.length === 1) {
      return res.json({
        code: 200,
        message: '更新成功',
        data: existingMenuData,
      });
    }

    // 构建SQL语句
    const query = `UPDATE menus SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    // 执行更新
    const result = await pool.query(query, params);

    res.json({
      code: 200,
      message: '更新成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('更新菜单错误:', error);
    res.json({
      code: 500,
      message: '更新菜单失败',
    });
  }
};

// 删除菜单
const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否有子菜单
    const childrenResult = await pool.query(
      'SELECT id FROM menus WHERE parent_id = $1',
      [id]
    );

    if (childrenResult.rows.length > 0) {
      return res.json({
        code: 400,
        message: '该菜单下存在子菜单，无法删除',
      });
    }

    // 检查菜单是否被角色使用
    const roleMenusResult = await pool.query(
      'SELECT COUNT(*) FROM role_menus WHERE menu_id = $1',
      [id]
    );

    if (parseInt(roleMenusResult.rows[0].count) > 0) {
      return res.json({
        code: 403,
        message: '菜单已被角色使用，请先解除角色绑定后再删除',
      });
    }

    await pool.query('DELETE FROM role_menus WHERE menu_id = $1', [id]);
    await pool.query('DELETE FROM menus WHERE id = $1', [id]);

    res.json({
      code: 200,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除菜单错误:', error);
    res.json({
      code: 500,
      message: '删除菜单失败',
    });
  }
};

// 获取菜单绑定的角色
const getMenuRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10, keyword } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    let whereClause = 'WHERE rm.menu_id = $1';
    let params = [id];
    let paramIndex = 2;
    
    if (keyword) {
      whereClause += ` AND (r.name LIKE $${paramIndex} OR r.code LIKE $${paramIndex + 1})`;
      params.push(`%${keyword}%`, `%${keyword}%`);
      paramIndex += 2;
    }
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM role_menus rm INNER JOIN roles r ON rm.role_id = r.id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    const result = await pool.query(
      `SELECT r.id, r.name, r.code, r.description, r.status, r.created_at 
       FROM role_menus rm 
       INNER JOIN roles r ON rm.role_id = r.id 
       ${whereClause} 
       ORDER BY r.created_at ASC 
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
    console.error('获取菜单角色错误:', error);
    res.json({
      code: 500,
      message: '获取菜单角色失败',
    });
  }
};

// 绑定角色到菜单
const addMenuRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleIds } = req.body;
    
    if (!roleIds || roleIds.length === 0) {
      return res.json({
        code: 400,
        message: '请选择角色',
      });
    }
    
    for (const roleId of roleIds) {
      const existing = await pool.query(
        'SELECT id FROM role_menus WHERE menu_id = $1 AND role_id = $2',
        [id, roleId]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO role_menus (menu_id, role_id) VALUES ($1, $2)',
          [id, roleId]
        );
      }
    }
    
    res.json({
      code: 200,
      message: '绑定成功',
    });
  } catch (error) {
    console.error('绑定菜单角色错误:', error);
    res.json({
      code: 500,
      message: '绑定菜单角色失败',
    });
  }
};

// 解除角色与菜单的绑定
const removeMenuRole = async (req, res) => {
  try {
    const { id, roleId } = req.params;
    
    await pool.query(
      'DELETE FROM role_menus WHERE menu_id = $1 AND role_id = $2',
      [id, roleId]
    );
    
    res.json({
      code: 200,
      message: '解除绑定成功',
    });
  } catch (error) {
    console.error('解除菜单角色绑定错误:', error);
    res.json({
      code: 500,
      message: '解除菜单角色绑定失败',
    });
  }
};

// 构建菜单树
const buildMenuTree = (menus, parentId = null) => {
  const tree = [];
  for (const menu of menus) {
    if (menu.parent_id === parentId) {
      // 转换字段名
      const menuObj = {
        id: menu.id,
        name: menu.name,
        code: menu.code,
        path: menu.path,
        component: menu.component,
        icon: menu.icon,
        parentId: menu.parent_id,
        sortOrder: menu.sort_order,
        type: menu.type,
        status: menu.status,
        clientType: menu.client_type,
        needPermission: menu.need_permission,
        position: menu.position || 'left',
        createdAt: menu.created_at,
        updatedAt: menu.updated_at
      };
      
      const children = buildMenuTree(menus, menu.id);
      if (children.length > 0) {
        menuObj.children = children;
      }
      tree.push(menuObj);
    }
  }
  return tree;
};

module.exports = {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenuRoles,
  addMenuRole,
  removeMenuRole,
};
