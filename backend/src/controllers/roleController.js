const pool = require('../config/database');

// 检测角色继承循环依赖
const detectCycleDependency = async (roleId, parentIds, visited = new Set()) => {
  // 如果当前角色已经在访问路径中，说明存在循环依赖
  if (visited.has(roleId)) {
    return true;
  }
  
  // 创建新的访问路径集合，避免引用类型导致的问题
  const newVisited = new Set(visited);
  newVisited.add(roleId);
  
  // 确保 parentIds 是数组
  let parentIdArray = [];
  if (Array.isArray(parentIds)) {
    parentIdArray = parentIds;
  } else if (typeof parentIds === 'object' && parentIds !== null) {
    // 如果是对象，尝试转换为数组
    parentIdArray = Object.values(parentIds);
  }
  
  // 检查每个父角色
  for (const parentId of parentIdArray) {
    // 检查父角色是否是当前角色本身
    if (parentId === roleId) {
      return true;
    }
    
    // 获取父角色的父角色列表
    const parentRoleResult = await pool.query(
      'SELECT parent_ids FROM roles WHERE id = $1',
      [parentId]
    );
    
    if (parentRoleResult.rows.length > 0) {
      // 确保 parent_ids 是数组
      let parentParentIds = [];
      const parentData = parentRoleResult.rows[0].parent_ids;
      if (Array.isArray(parentData)) {
        parentParentIds = parentData;
      } else if (typeof parentData === 'object' && parentData !== null) {
        // 如果是对象，尝试转换为数组
        parentParentIds = Object.values(parentData);
      }
      // 递归检测父角色是否存在循环依赖
      if (await detectCycleDependency(parentId, parentParentIds, newVisited)) {
        return true;
      }
    }
  }
  
  return false;
};

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
    
    // 转换角色数据格式（snake_case 转 camelCase）
    const formattedRoles = result.rows.map(role => ({
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      parent_ids: Array.isArray(role.parent_ids) ? role.parent_ids : (typeof role.parent_ids === 'object' && role.parent_ids !== null ? Object.values(role.parent_ids) : []),
      status: role.status,
      createdAt: role.created_at,
      updatedAt: role.updated_at
    }));
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: formattedRoles,
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

// 递归获取角色及其父角色的权限
const getRolePermissions = async (roleId, visited = new Set(), isInherited = false, deduplicate = true) => {
  // 避免循环依赖
  if (visited.has(roleId)) {
    return [];
  }
  visited.add(roleId);
  
  // 获取角色信息
  const roleResult = await pool.query(
    'SELECT name, parent_ids FROM roles WHERE id = $1',
    [roleId]
  );
  
  if (roleResult.rows.length === 0) {
    return [];
  }
  
  const roleName = roleResult.rows[0].name;
  // 确保 parent_ids 是数组
  const parentIds = Array.isArray(roleResult.rows[0].parent_ids) ? roleResult.rows[0].parent_ids : [];
  
  // 获取直接权限
  const directMenusResult = await pool.query(
    `SELECT m.* FROM menus m
     INNER JOIN role_menus rm ON m.id = rm.menu_id
     WHERE rm.role_id = $1`,
    [roleId]
  );
  
  // 标记直接权限
  const directPermissions = directMenusResult.rows.map(menu => ({
    id: menu.id,
    name: menu.name,
    code: menu.code,
    path: menu.path,
    component: menu.component,
    icon: menu.icon,
    parentId: menu.parent_id,
    sortOrder: menu.sort_order,
    status: menu.status,
    clientType: menu.client_type,
    needPermission: menu.need_permission,
    position: menu.position,
    source: roleName,
    inheritanceType: isInherited ? 'inherited' : 'direct',
    createdAt: menu.created_at,
    updatedAt: menu.updated_at
  }));
  
  // 递归获取父角色的权限
  let inheritedPermissions = [];
  for (const parentId of parentIds) {
    const parentPermissions = await getRolePermissions(parentId, new Set(visited), true, deduplicate);
    inheritedPermissions = [...inheritedPermissions, ...parentPermissions];
  }
  
  if (!deduplicate) {
    // 不去重，直接返回所有权限
    return [...directPermissions, ...inheritedPermissions];
  } else {
    // 去重，保留直接权限
    const menuMap = new Map();
    
    // 先添加继承权限
    inheritedPermissions.forEach(permission => {
      menuMap.set(permission.id, permission);
    });
    
    // 再添加直接权限，覆盖继承权限
    directPermissions.forEach(permission => {
      menuMap.set(permission.id, permission);
    });
    
    return Array.from(menuMap.values());
  }
};

// 获取角色详情（包含菜单权限）
const getRoleById = async (req, res) => {
  try {
    console.log('获取角色详情接口被调用');
    console.log('请求参数:', req.params);
    const { id } = req.params;
    console.log('获取角色详情，ID:', id);
    
    // 从数据库获取角色信息
    const roleResult = await pool.query(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    );
    
    if (roleResult.rows.length === 0) {
      return res.json({
        code: 404,
        message: '角色不存在'
      });
    }
    
    const role = roleResult.rows[0];
    
    // 获取直接菜单权限
    const directMenusResult = await pool.query(
      `SELECT m.* FROM menus m
       INNER JOIN role_menus rm ON m.id = rm.menu_id
       WHERE rm.role_id = $1`,
      [id]
    );
    
    // 转换直接菜单格式
    const directMenus = directMenusResult.rows.map(menu => ({
      id: menu.id,
      name: menu.name,
      code: menu.code,
      path: menu.path,
      component: menu.component,
      icon: menu.icon,
      parentId: menu.parent_id,
      sortOrder: menu.sort_order,
      status: menu.status,
      clientType: menu.client_type,
      needPermission: menu.need_permission,
      createdAt: menu.created_at,
      updatedAt: menu.updated_at
    }));
    
    // 递归获取所有权限（直接+继承）
    const allPermissions = await getRolePermissions(id, new Set(), false, false);
    
    // 获取所有不需要权限的菜单
    const noPermissionMenusResult = await pool.query(
      `SELECT * FROM menus 
       WHERE need_permission = false
       AND status != 'disabled'
       AND (status = 'enabled' OR status = 'not_implemented')`
    );
    
    // 标记不需要权限的菜单
    const noPermissionMenus = noPermissionMenusResult.rows.map(menu => ({
      id: menu.id,
      name: menu.name,
      code: menu.code,
      path: menu.path,
      component: menu.component,
      icon: menu.icon,
      parentId: menu.parent_id,
      sortOrder: menu.sort_order,
      status: menu.status,
      clientType: menu.client_type,
      needPermission: menu.need_permission,
      source: '公开',
      inheritanceType: 'public',
      createdAt: menu.created_at,
      updatedAt: menu.updated_at
    }));
    
    // 合并所有菜单，不进行去重，便于检查重复的菜单
    // 先添加不需要权限的菜单
    const allMenus = [...noPermissionMenus];
    
    // 再添加需要权限的菜单
    allMenus.push(...allPermissions.map(permission => ({
      id: permission.id,
      name: permission.name,
      code: permission.code,
      path: permission.path,
      component: permission.component,
      icon: permission.icon,
      parentId: permission.parentId,
      sortOrder: permission.sortOrder,
      status: permission.status,
      clientType: permission.clientType,
      needPermission: permission.needPermission,
      source: permission.source,
      inheritanceType: permission.inheritanceType,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt
    })));
    
    // 构建角色详情数据
    const roleData = {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      parent_ids: Array.isArray(role.parent_ids) ? role.parent_ids : (typeof role.parent_ids === 'object' && role.parent_ids !== null ? Object.values(role.parent_ids) : []),
      status: role.status,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
      directMenus,
      allMenus
    };

    console.log('返回角色详情数据:', roleData);
    res.json({
      code: 200,
      message: '获取成功',
      data: roleData
    });
  } catch (error) {
    console.error('获取角色详情错误:', error);
    res.json({
      code: 500,
      message: '获取角色详情失败'
    });
  }
};

// 创建角色
const createRole = async (req, res) => {
  try {
    const { name, code, description, menuIds, parentIds = [] } = req.body;

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

    // 检测循环依赖
    if (parentIds && parentIds.length > 0) {
      // 临时创建角色ID用于检测
      const tempRoleId = 'temp-' + Date.now();
      if (await detectCycleDependency(tempRoleId, parentIds)) {
        return res.json({
          code: 400,
          message: '角色继承存在循环依赖',
        });
      }
    }

    const result = await pool.query(
      'INSERT INTO roles (name, code, description, parent_ids) VALUES ($1, $2, $3, $4::jsonb) RETURNING *',
      [name, code, description, JSON.stringify(parentIds)]
    );

    const roleId = result.rows[0].id;

    // 关联菜单
    if (menuIds && menuIds.length > 0) {
      // 过滤掉不需要权限的菜单
      const menusToSave = [];
      for (const menuId of menuIds) {
        const menuResult = await pool.query('SELECT need_permission FROM menus WHERE id = $1', [menuId]);
        if (menuResult.rows.length > 0 && menuResult.rows[0].need_permission) {
          menusToSave.push(menuId);
        }
      }
      
      for (const menuId of menusToSave) {
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
    console.log('更新角色API被调用');
    console.log('请求参数:', req.params);
    console.log('请求体:', req.body);
    
    const { id } = req.params;
    const { name, code, description, menuIds, parentIds } = req.body;

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
    console.log('旧角色代码:', oldCode);
    console.log('请求中的角色代码:', code);
    
    // 对于系统内置角色，使用原有的code，忽略请求中的code字段
    const updateCode = SYSTEM_ROLES.includes(oldCode) ? oldCode : (code || oldCode);
    console.log('更新后的角色代码:', updateCode);
    
    // 检查是否是系统内置角色，如果是，且请求中包含code字段，且code与原code不同，则返回403错误
    if (SYSTEM_ROLES.includes(oldCode) && code && code !== oldCode) {
      console.log('系统内置角色代码不允许修改');
      return res.json({
        code: 403,
        message: '系统内置角色代码不允许修改'
      });
    }
    
    // 确保 parentIds 是数组
    const safeParentIds = Array.isArray(parentIds) ? parentIds : [];
    console.log('安全的父角色ID:', safeParentIds);

    // 检测循环依赖
  if (safeParentIds.length > 0) {
    console.log('开始检测循环依赖');
    try {
      if (await detectCycleDependency(id, safeParentIds)) {
        return res.json({
          code: 400,
          message: '角色继承存在循环依赖',
        });
      }
      console.log('循环依赖检测通过');
    } catch (error) {
      console.error('循环依赖检测错误:', error);
      // 如果循环依赖检测失败，继续执行更新操作
    }
  }

    console.log('开始更新角色基本信息');
    // 确保parent_ids是数组格式
    const parentIdsToUpdate = Array.isArray(safeParentIds) ? safeParentIds : [];
    console.log('更新的父角色ID:', parentIdsToUpdate);
    const result = await pool.query(
      'UPDATE roles SET name = $1, code = $2, description = $3, parent_ids = $4::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, updateCode, description, JSON.stringify(parentIdsToUpdate), id]
    );
    console.log('角色基本信息更新成功:', result.rows[0]);

    // 更新菜单关联
    if (menuIds && Array.isArray(menuIds)) {
      console.log('开始更新菜单关联');
      // 过滤掉不需要权限的菜单
      const menusToSave = [];
      for (const menuId of menuIds) {
        const menuResult = await pool.query('SELECT need_permission FROM menus WHERE id = $1', [menuId]);
        if (menuResult.rows.length > 0 && menuResult.rows[0].need_permission) {
          menusToSave.push(menuId);
        }
      }
      console.log('需要保存的菜单ID:', menusToSave);
      
      // 删除旧的关联
      await pool.query('DELETE FROM role_menus WHERE role_id = $1', [id]);
      console.log('旧菜单关联删除成功');
      
      // 添加新的关联
      for (const menuId of menusToSave) {
        await pool.query(
          'INSERT INTO role_menus (role_id, menu_id) VALUES ($1, $2)',
          [id, menuId]
        );
      }
      console.log('新菜单关联添加成功');
    }

    res.json({
      code: 200,
      message: '更新成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('更新角色错误:', error);
    console.error('错误堆栈:', error.stack);
    res.json({
      code: 500,
      message: '更新角色失败',
      error: error.message
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

// 递归获取角色及其父角色的所有角色代码
const getRoleCodeHierarchy = async (roleCode, visited = new Set()) => {
  if (visited.has(roleCode)) {
    return [];
  }
  visited.add(roleCode);
  
  const roleResult = await pool.query(
    'SELECT id, parent_ids FROM roles WHERE code = $1',
    [roleCode]
  );
  
  if (roleResult.rows.length === 0) {
    return [roleCode];
  }
  
  const roleId = roleResult.rows[0].id;
  const parentIds = roleResult.rows[0].parent_ids || [];
  
  let allRoles = [roleCode];
  
  for (const parentId of parentIds) {
    const parentRoleResult = await pool.query(
      'SELECT code FROM roles WHERE id = $1',
      [parentId]
    );
    if (parentRoleResult.rows.length > 0) {
      const parentRoleCode = parentRoleResult.rows[0].code;
      const parentRoles = await getRoleCodeHierarchy(parentRoleCode, new Set(visited));
      allRoles = [...allRoles, ...parentRoles];
    }
  }
  
  return allRoles;
};

// 获取当前用户的菜单（根据角色）
const getUserMenus = async (req, res) => {
  try {
    console.log('获取用户菜单接口被调用');
    console.log('用户信息:', req.user);
    console.log('请求参数:', req.query);
    const { roles } = req.user;
    const { clientType, position } = req.query;

    // 1. 获取无需权限的菜单（need_permission = false）
    let noPermissionQuery = `
      SELECT DISTINCT m.* FROM menus m
      WHERE m.status != 'disabled'
      AND m.need_permission = false
      AND (
        m.status = 'enabled'
        OR (m.status = 'not_implemented')
        OR (m.status = 'in_progress' AND $1)
      )
    `;

    // 构建参数数组
    const isDeveloper = roles.includes('developer');
    const params = [isDeveloper];

    // 添加客户端类型过滤
    if (clientType) {
      noPermissionQuery += ` AND m.client_type = $2`;
      params.push(clientType);
    }

    // 添加菜单位置过滤
    if (position) {
      noPermissionQuery += ` AND m.position = $${params.length + 1}`;
      params.push(position);
    }

    console.log('无需权限查询参数:', params);

    // 执行查询获取无需权限的菜单
    const noPermissionResult = await pool.query(noPermissionQuery, params);

    // 2. 获取需要权限的菜单（基于角色权限，包括继承的权限）
    let allPermissionMenus = [];
    
    // 获取所有角色的ID
    let roleIds = [];
    if (roles.length > 0) {
      // 构建参数占位符
      const placeholders = roles.map((_, index) => '$' + (index + 1)).join(', ');
      // 构建查询语句
      const query = 'SELECT id FROM roles WHERE code IN (' + placeholders + ')';
      // 执行查询
      const roleIdsResult = await pool.query(query, roles);
      roleIds = roleIdsResult.rows.map(row => row.id);
      console.log('角色ID列表:', roleIds);
    } else {
      console.log('角色为空，跳过查询');
    }
    
    // 获取每个角色的权限（包括继承的权限）
    for (const roleId of roleIds) {
      console.log('获取角色权限，角色ID:', roleId);
      const rolePermissions = await getRolePermissions(roleId, new Set(), false, true);
      console.log('角色权限:', rolePermissions);
      allPermissionMenus = [...allPermissionMenus, ...rolePermissions];
    }
    console.log('所有权限菜单:', allPermissionMenus);
    console.log('过滤前的权限菜单数量:', allPermissionMenus.length);
    console.log('客户端类型:', clientType);
    console.log('菜单位置:', position);
    console.log('是否为开发者:', isDeveloper);
    
    // 过滤需要权限的菜单，根据客户端类型和位置
    const filteredPermissionMenus = allPermissionMenus.filter(menu => {
      let match = menu.status !== 'disabled' && menu.needPermission;
      
      // 检查菜单状态
      if (match) {
        match = menu.status === 'enabled' || 
                menu.status === 'not_implemented' || 
                (menu.status === 'in_progress' && isDeveloper);
      }
      
      // 检查客户端类型
      if (match && clientType) {
        match = menu.clientType === clientType;
      }
      
      // 检查菜单位置
      if (match && position) {
        match = menu.position === position;
      }
      
      return match;
    });
    console.log('过滤后的权限菜单数量:', filteredPermissionMenus.length);
    
    // 合并菜单并去重
    const menuMap = new Map();
    
    // 统一处理无需权限的菜单，确保字段名一致
    noPermissionResult.rows.forEach(menu => {
      menuMap.set(menu.id, {
        ...menu,
        sort_order: menu.sort_order || 0
      });
    });
    
    // 统一处理需要权限的菜单，确保字段名一致
    filteredPermissionMenus.forEach(menu => {
      menuMap.set(menu.id, {
        id: menu.id,
        name: menu.name,
        code: menu.code,
        path: menu.path,
        component: menu.component,
        icon: menu.icon,
        parent_id: menu.parentId,
        sort_order: menu.sortOrder || 0,
        status: menu.status,
        client_type: menu.clientType,
        need_permission: menu.needPermission,
        position: menu.position,
        target: menu.target,
        type: menu.type,
        created_at: menu.createdAt,
        updated_at: menu.updatedAt
      });
    });

    // 转换为数组并排序
    const allMenus = Array.from(menuMap.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    
    // 添加调试日志
    console.log('排序后的菜单:');
    allMenus.forEach(menu => {
      console.log(`  - ${menu.name} (sort_order: ${menu.sort_order})`);
    });

    // 构建菜单树形结构
    const menuTree = [];
    const menuMapById = new Map();

    // 首先创建所有菜单的映射，并保存sort_order
    allMenus.forEach(menu => {
      menuMapById.set(menu.id, {
        id: menu.id,
        name: menu.name,
        path: menu.path,
        component: menu.component,
        icon: menu.icon,
        status: menu.status,
        type: menu.type,
        parentId: menu.parent_id,
        clientType: menu.client_type,
        needPermission: menu.need_permission,
        position: menu.position,
        target: menu.target || '_self',
        sortOrder: menu.sort_order, // 保存排序值
        children: []
      });
    });

    // 构建树形结构
    allMenus.forEach(menu => {
      const menuItem = menuMapById.get(menu.id);
      if (menu.parent_id) {
        // 有父菜单，添加到父菜单的children中
        const parentMenu = menuMapById.get(menu.parent_id);
        if (parentMenu) {
          parentMenu.children.push(menuItem);
        } else {
          // 如果父菜单不存在，作为顶级菜单
          menuTree.push(menuItem);
        }
      } else {
        // 没有父菜单，作为顶级菜单
        menuTree.push(menuItem);
      }
    });

    // 对顶级菜单进行排序，确保顺序正确
    menuTree.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    // 对每个菜单的子菜单也进行排序
    menuTree.forEach(menu => {
      if (menu.children && menu.children.length > 0) {
        menu.children.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
    });

    console.log('最终返回的菜单顺序:');
    menuTree.forEach(menu => {
      console.log(`  - ${menu.name} (sortOrder: ${menu.sortOrder})`);
    });
    res.json({
      code: 200,
      message: '获取成功',
      data: menuTree,
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
