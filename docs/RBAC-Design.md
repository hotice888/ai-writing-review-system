# RBAC权限管理系统设计文档

## 1. 需求概述

### 1.1 功能需求
- **用户管理**：管理系统用户，包括增删改查、分配角色
- **角色管理**：定义系统角色，配置角色权限（菜单访问权限）
- **菜单管理**：管理系统菜单，支持多级菜单结构

### 1.2 业务规则
- 系统内置角色（super_admin, admin, user）不允许删除
- 管理员用户（admin）禁止删除且用户名禁止编辑
- 角色删除时，如被用户使用则不能删除；如绑定菜单则自动解除绑定后删除
- 菜单删除时，如有子菜单则不能删除；如被角色使用则不能删除

## 2. 数据库设计

### 2.1 数据表结构

#### users（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| username | VARCHAR | 用户名（唯一） |
| email | VARCHAR | 邮箱 |
| password | VARCHAR | 密码（加密存储） |
| status | VARCHAR | 状态：enabled/disabled |
| created_at | TIMESTAMP | 创建时间 |

#### roles（角色表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR | 角色名称 |
| code | VARCHAR | 角色代码（唯一） |
| description | TEXT | 描述 |
| status | VARCHAR | 状态 |
| created_at | TIMESTAMP | 创建时间 |

#### menus（菜单表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR | 菜单名称 |
| path | VARCHAR | 路由路径 |
| component | VARCHAR | 组件路径 |
| icon | VARCHAR | 图标 |
| parent_id | UUID | 父菜单ID（自关联） |
| sort_order | INTEGER | 排序 |
| client_type | VARCHAR | 客户端类型：admin/home |
| need_permission | BOOLEAN | 是否需要权限 |
| status | VARCHAR | 状态 |

#### user_roles（用户角色关联表）
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | UUID | 用户ID |
| role_id | UUID | 角色ID |

#### role_menus（角色菜单关联表）
| 字段 | 类型 | 说明 |
|------|------|------|
| role_id | UUID | 角色ID |
| menu_id | UUID | 菜单ID |

## 3. 核心功能设计

### 3.1 用户管理

#### 功能列表
1. **查询用户列表**
   - 支持分页
   - 支持按用户名/邮箱搜索
   - 显示用户基本信息和角色

2. **新增用户**
   - 填写用户名、邮箱、密码
   - 分配角色（多选）
   - 默认密码加密存储

3. **编辑用户**
   - 修改邮箱、密码（可选）
   - 修改角色分配
   - admin用户名禁止修改

4. **删除用户**
   - admin用户禁止删除
   - 删除前确认

#### 关键逻辑
```javascript
// 删除用户校验
if (user.username === 'admin') {
  return { code: 403, message: '管理员用户禁止删除' };
}
```

### 3.2 角色管理

#### 功能列表
1. **查询角色列表**
   - 支持分页
   - 支持按名称/代码搜索

2. **新增角色**
   - 填写名称、代码、描述
   - 配置菜单权限（树形选择）

3. **编辑角色**
   - 修改基本信息
   - 重新配置菜单权限

4. **删除角色**
   - 系统内置角色禁止删除
   - 被用户使用的角色禁止删除
   - 绑定菜单的角色自动解除绑定后删除

#### 关键逻辑
```javascript
// 删除角色校验
if (SYSTEM_ROLES.includes(role.code)) {
  return { code: 403, message: '系统内置角色不允许删除' };
}

// 检查是否被用户使用
const userCount = await query('SELECT COUNT(*) FROM user_roles WHERE role_id = $1', [id]);
if (userCount > 0) {
  return { code: 403, message: '角色已被用户分配使用' };
}

// 自动解除菜单绑定
await query('DELETE FROM role_menus WHERE role_id = $1', [id]);
await query('DELETE FROM roles WHERE id = $1', [id]);
```

### 3.3 菜单管理

#### 功能列表
1. **查询菜单列表**
   - 树形视图（层级结构）
   - 列表视图（扁平结构）
   - 支持按客户端类型筛选

2. **新增菜单**
   - 填写名称、路径、组件
   - 选择图标
   - 设置父菜单（支持多级）
   - 设置排序
   - 配置是否需要权限

3. **编辑菜单**
   - 修改所有字段
   - 注意：修改父菜单可能影响层级结构

4. **删除菜单**
   - 有子菜单的不能删除
   - 被角色使用的不能删除

#### 关键逻辑
```javascript
// 删除菜单校验
const children = await query('SELECT id FROM menus WHERE parent_id = $1', [id]);
if (children.length > 0) {
  return { code: 400, message: '该菜单下存在子菜单' };
}

const roleMenusCount = await query('SELECT COUNT(*) FROM role_menus WHERE menu_id = $1', [id]);
if (roleMenusCount > 0) {
  return { code: 403, message: '菜单已被角色使用' };
}

await query('DELETE FROM menus WHERE id = $1', [id]);
```

## 4. 权限控制流程

### 4.1 登录授权流程
1. 用户登录验证用户名密码
2. 生成JWT Token，包含用户ID和角色信息
3. 前端存储Token，后续请求携带

### 4.2 菜单权限校验
1. 后端根据用户角色查询可访问菜单
2. 构建菜单树返回前端
3. 前端根据菜单结构渲染导航

#### 菜单加载权限逻辑说明
菜单加载权限逻辑基于两步查询合并的方式实现，具体规则如下：

1. **第一步：获取无需权限的菜单**
   - 条件：
     - 菜单状态不能为 `disabled`（禁用的菜单不加载）
     - 菜单的 `need_permission` 为 `false`（无需权限）
     - 同时满足以下任一状态条件：
       - 菜单状态为 `enabled`（已启用）
       - 菜单状态为 `not_implemented`（未实现）
       - 菜单状态为 `in_progress`（开发中）且用户拥有 `developer` 角色

2. **第二步：获取需要权限的菜单**
   - 条件：
     - 菜单状态不能为 `disabled`（禁用的菜单不加载）
     - 菜单的 `need_permission` 为 `true`（需要权限）
     - 用户角色通过 `role_menus` 关联表绑定该菜单
     - 同时满足以下任一状态条件：
       - 菜单状态为 `enabled`（已启用）
       - 菜单状态为 `not_implemented`（未实现）
       - 菜单状态为 `in_progress`（开发中）且用户拥有 `developer` 角色

3. **第三步：合并与去重**
   - 将两步查询的结果合并
   - 按菜单 ID 去重
   - 按 `sort_order` 升序排列

4. **客户端类型筛选**
   - 在上述两步查询中都可根据请求参数 `clientType` 筛选对应的菜单（可选）

```javascript
// 核心SQL查询逻辑

// 1. 获取无需权限的菜单
const noPermissionQuery = `
  SELECT DISTINCT m.* FROM menus m
  WHERE m.status != 'disabled'
  AND m.need_permission = false
  AND (
    m.status = 'enabled'
    OR (m.status = 'not_implemented')
    OR (m.status = 'in_progress' AND $1)
  )
  ${clientType ? 'AND m.client_type = $2' : ''}
`;

// 2. 获取需要权限的菜单
const permissionQuery = `
  SELECT DISTINCT m.* FROM menus m
  INNER JOIN role_menus rm ON m.id = rm.menu_id
  INNER JOIN roles r ON rm.role_id = r.id
  WHERE m.status != 'disabled'
  AND m.need_permission = true
  AND r.code = ANY($${paramIndex})
  AND (
    m.status = 'enabled'
    OR (m.status = 'not_implemented')
    OR (m.status = 'in_progress' AND $1)
  )
  ${clientType ? 'AND m.client_type = $2' : ''}
`;

// 3. 合并结果并去重排序
const allMenus = Array.from(menuMap.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
```

#### 角色继承获取菜单逻辑
角色继承功能允许一个角色继承其他角色的菜单权限，实现权限的层级管理。具体逻辑如下：

1. **数据结构**
   - 角色表 (`roles`) 添加 `parent_ids` 字段（JSONB 类型），存储父角色 ID 数组
   - 支持多角色继承，一个角色可以继承多个父角色的权限

2. **权限计算逻辑**
   - 直接权限：角色通过 `role_menus` 关联表直接绑定的菜单权限
   - 继承权限：从父角色及其祖先角色继承的菜单权限
   - 递归计算：通过递归遍历父角色链，收集所有继承的权限

3. **循环依赖检测**
   - 在设置角色的父角色时，检测是否会形成循环依赖
   - 使用深度优先搜索（DFS）算法遍历角色继承链，确保无环

4. **权限来源标记**
   - 在返回角色权限时，标记权限的来源（直接权限或继承权限）
   - 对于继承权限，显示继承自哪个角色

5. **初始化配置**
   - 通过常量定义角色的继承关系
   - 例如：超级管理员和开发人员继承管理员角色的权限

```javascript
// 角色继承权限计算逻辑
const getRolePermissions = async (roleId) => {
  // 获取角色直接权限
  const directPermissions = await pool.query(
    `SELECT m.* FROM menus m
     INNER JOIN role_menus rm ON m.id = rm.menu_id
     WHERE rm.role_id = $1`,
    [roleId]
  );

  // 获取角色信息，包括父角色ID
  const roleResult = await pool.query('SELECT parent_ids FROM roles WHERE id = $1', [roleId]);
  const parentIds = roleResult.rows[0]?.parent_ids || [];

  // 递归获取父角色权限
  let inheritedPermissions = [];
  for (const parentId of parentIds) {
    const parentPermissions = await getRolePermissions(parentId);
    inheritedPermissions = [...inheritedPermissions, ...parentPermissions];
  }

  // 合并直接权限和继承权限
  return [...directPermissions.rows, ...inheritedPermissions];
};

// 循环依赖检测
const detectCycleDependency = async (roleId, parentIds, visited = new Set()) => {
  if (visited.has(roleId)) { return true; }
  visited.add(roleId);
  for (const parentId of parentIds) {
    const parentRoleResult = await pool.query('SELECT parent_ids FROM roles WHERE id = $1', [parentId]);
    if (parentRoleResult.rows.length > 0) {
      const parentParentIds = parentRoleResult.rows[0].parent_ids || [];
      if (await detectCycleDependency(parentId, parentParentIds, new Set(visited))) {
        return true;
      }
    }
  }
  return false;
};
```

### 4.3 API权限校验
1. 请求携带Token
2. 中间件验证Token有效性
3. 根据用户角色判断是否有权限访问

## 5. 前端设计

### 5.1 页面布局
- 左侧导航栏（根据权限动态生成）
- 顶部头部（用户信息、退出）
- 主内容区（列表、表单等）

### 5.2 列表页面规范
- 序号列、复选框列居中
- 操作按钮使用链接样式，水平排列
- 表格宽度占满主内容区
- 分页右对齐

### 5.3 表单设计
- 使用弹窗模态框
- 表单验证实时反馈
- 提交 loading 状态

## 6. 接口设计

### 6.1 用户接口
- GET /api/admin/users - 获取用户列表
- POST /api/admin/users - 创建用户
- PUT /api/admin/users/:id - 更新用户
- DELETE /api/admin/users/:id - 删除用户

### 6.2 角色接口
- GET /api/roles - 获取角色列表
- POST /api/roles - 创建角色
- PUT /api/roles/:id - 更新角色
- DELETE /api/roles/:id - 删除角色

### 6.3 菜单接口
- GET /api/menus - 获取菜单列表
- POST /api/menus - 创建菜单
- PUT /api/menus/:id - 更新菜单
- DELETE /api/menus/:id - 删除菜单

## 7. 错误处理

### 7.1 后端错误码
- 200: 成功
- 400: 请求参数错误
- 401: 未授权
- 403: 禁止访问（权限不足或业务限制）
- 404: 资源不存在
- 500: 服务器内部错误

### 7.2 前端错误处理
- 请求拦截器统一处理错误消息
- 业务错误显示具体提示
- 网络错误统一提示
