const pool = require('../config/database');

const initDatabase = async () => {
  try {
    // 用户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 评审表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 角色表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) UNIQUE NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'enabled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 检查并添加parent_ids字段
    try {
      await pool.query(`ALTER TABLE roles ADD COLUMN IF NOT EXISTS parent_ids JSONB DEFAULT '[]'`);
      console.log('Added parent_ids column to roles table');
    } catch (error) {
      console.error('Error adding parent_ids column to roles table:', error);
    }

    // 菜单表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menus (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        path VARCHAR(255),
        component VARCHAR(255),
        icon VARCHAR(50),
        parent_id UUID REFERENCES menus(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0,
        type VARCHAR(20) DEFAULT 'menu',
        status VARCHAR(20) DEFAULT 'enabled',
        client_type VARCHAR(20) DEFAULT 'admin',
        need_permission BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 检查并添加code字段
    try {
      await pool.query(`ALTER TABLE menus ADD COLUMN IF NOT EXISTS code VARCHAR(100) UNIQUE`);
      console.log('Added code column to menus table');
      
      // 更新现有记录的code值，避免NULL值
      await pool.query(`UPDATE menus SET code = name WHERE code IS NULL`);
      console.log('Updated existing menus with code values');
      
      // 添加NOT NULL约束
      await pool.query(`ALTER TABLE menus ALTER COLUMN code SET NOT NULL`);
      console.log('Added NOT NULL constraint to code column');
    } catch (error) {
      console.error('Error adding code column to menus table:', error);
    }

    // 检查并添加position字段（用于区别菜单位置：left-左导航，avatar-头像下拉菜单）
    try {
      await pool.query(`ALTER TABLE menus ADD COLUMN IF NOT EXISTS position VARCHAR(20) DEFAULT 'left'`);
      console.log('Added position column to menus table');
      
      // 更新现有记录的position值
      await pool.query(`UPDATE menus SET position = 'left' WHERE position IS NULL`);
      console.log('Updated existing menus with position values');
    } catch (error) {
      console.error('Error adding position column to menus table:', error);
    }

    // 检查并添加anthropic_base_url字段到model_providers表
    try {
      await pool.query(`ALTER TABLE model_providers ADD COLUMN IF NOT EXISTS anthropic_base_url VARCHAR(255)`);
      console.log('Added anthropic_base_url column to model_providers table');
    } catch (error) {
      console.error('Error adding column to model_providers table:', error);
    }

    // 检查并添加common_links字段到model_providers表
    try {
      await pool.query(`ALTER TABLE model_providers ADD COLUMN IF NOT EXISTS common_links TEXT`);
      console.log('Added common_links column to model_providers table');
    } catch (error) {
      console.error('Error adding common_links column to model_providers table:', error);
    }

    // 用户角色关联表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, role_id)
      )
    `);

    // 角色菜单关联表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_menus (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, menu_id)
      )
    `);

    // 模型管理表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        provider VARCHAR(50) NOT NULL, -- openai, anthropic, glm, etc.
        model VARCHAR(100) NOT NULL, -- gpt-4, claude-3-sonnet-20240229, etc.
        description TEXT,
        status VARCHAR(20) DEFAULT 'enabled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 模型提供商表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS model_providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        url VARCHAR(255),
        openai_base_url VARCHAR(255),
        anthropic_base_url VARCHAR(255),
        protocol_base_url VARCHAR(255),
        description TEXT,
        common_links TEXT,
        status VARCHAR(20) DEFAULT 'enabled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 模型提供商模型表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS model_provider_models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_id UUID NOT NULL REFERENCES model_providers(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        model_code VARCHAR(100) NOT NULL,
        memo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 用户模型表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(100) NOT NULL,
        provider VARCHAR(50) NOT NULL, -- openai, anthropic, glm, custom, etc.
        model VARCHAR(100) NOT NULL, -- gpt-4, claude-3-sonnet-20240229, etc.
        api_url VARCHAR(255),
        api_key VARCHAR(255),
        openai_api_url VARCHAR(255),
        anthropic_api_url VARCHAR(255),
        description TEXT,
        status VARCHAR(20) DEFAULT 'enabled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 智能体表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        role TEXT NOT NULL, -- 智能体角色描述
        instructions TEXT, -- 详细指令
        status VARCHAR(20) DEFAULT 'enabled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 用户智能体表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        role TEXT NOT NULL,
        instructions TEXT,
        model_id UUID REFERENCES user_models(id) ON DELETE SET NULL, -- 关联用户模型
        status VARCHAR(20) DEFAULT 'enabled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
    
    // 初始化默认数据
    await initDefaultData();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

const initDefaultData = async () => {
  try {
    // 检查是否已有角色数据
    const rolesResult = await pool.query('SELECT COUNT(*) FROM roles');
    if (parseInt(rolesResult.rows[0].count) === 0) {
      // 初始化默认角色
      await pool.query(`
        INSERT INTO roles (name, code, description, status, parent_ids) VALUES
        ('超级管理员', 'super_admin', '系统超级管理员，拥有所有权限', 'enabled', '[]'),
        ('管理员', 'admin', '系统管理员', 'enabled', '[]'),
        ('平台开发人员', 'developer', '平台开发人员，可查看实现中的功能', 'enabled', '[]'),
        ('普通用户', 'user', '普通用户角色', 'enabled', '[]')
      `);
      console.log('Default roles initialized');
    }
    
    // 更新角色的parent_ids，实现权限继承
    // 超级管理员和开发人员继承admin角色的权限
    try {
      // 获取admin角色的ID
      const adminRoleResult = await pool.query('SELECT id FROM roles WHERE code = $1', ['admin']);
      if (adminRoleResult.rows.length > 0) {
        const adminRoleId = adminRoleResult.rows[0].id;
        
        // 更新super_admin和developer角色的parent_ids
        await pool.query(
          'UPDATE roles SET parent_ids = $1::jsonb WHERE code = $2',
          [JSON.stringify([adminRoleId]), 'super_admin']
        );
        await pool.query(
          'UPDATE roles SET parent_ids = $1::jsonb WHERE code = $2',
          [JSON.stringify([adminRoleId]), 'developer']
        );
        console.log('Updated role parent_ids for permission inheritance');
      }
    } catch (error) {
      console.error('Error updating role parent_ids:', error);
    }

    // 初始化管理端菜单
    const adminMenus = [
      { name: '仪表盘', code: 'dashboard-left-admin', path: '/', component: 'Dashboard', icon: 'DataLine', sort_order: 1, type: 'menu', client_type: 'admin', need_permission: true, position: 'left', target: '_self', status: 'enabled' },
      { name: '用户管理', code: 'users-left-admin', path: '/users', component: 'Users', icon: 'User', sort_order: 2, type: 'menu', client_type: 'admin', need_permission: true, position: 'left', target: '_self', status: 'enabled' },
      { name: '评审管理', code: 'reviews-left-admin', path: '/reviews', component: 'Reviews', icon: 'Document', sort_order: 3, type: 'menu', client_type: 'admin', need_permission: true, position: 'left', target: '_self', status: 'enabled' },
      { name: '角色管理', code: 'roles-left-admin', path: '/roles', component: 'Roles', icon: 'UserFilled', sort_order: 4, type: 'menu', client_type: 'admin', need_permission: true, position: 'left', target: '_self', status: 'enabled' },
      { name: '菜单管理', code: 'menus-left-admin', path: '/menus', component: 'Menus', icon: 'Menu', sort_order: 5, type: 'menu', client_type: 'admin', need_permission: true, position: 'left', target: '_self', status: 'enabled' },
      { name: '模型管理', code: 'models-left-admin', path: '/models', component: 'Models', icon: 'Cpu', sort_order: 6, type: 'menu', client_type: 'admin', need_permission: true, position: 'left', target: '_self', status: 'enabled' },
      { name: '模型提供商', code: 'model-providers-left-admin', path: '/model-providers', component: 'ModelProviders', icon: 'Company', sort_order: 7, type: 'menu', client_type: 'admin', need_permission: true, position: 'left', target: '_self', status: 'enabled' },
      { name: '智能体管理', code: 'agents-left-admin', path: '/agents', component: 'Agents', icon: 'ChatLineRound', sort_order: 8, type: 'menu', client_type: 'admin', need_permission: true, position: 'left', target: '_self', status: 'enabled' },
      { name: '用户模型', code: 'user-models-left-admin', path: '/user-models', component: 'UserModels', icon: 'User', sort_order: 9, type: 'menu', client_type: 'admin', need_permission: true, position: 'left', target: '_self', status: 'enabled' },
      { name: '用户智能体', code: 'user-agents-left-admin', path: '/user-agents', component: 'UserAgents', icon: 'UserFilled', sort_order: 10, type: 'menu', client_type: 'admin', need_permission: true, position: 'left', target: '_self', status: 'enabled' },
    ];

    // 检查并添加管理端菜单
    for (const menu of adminMenus) {
      try {
        // 先尝试通过code查找
        let existingMenu = await pool.query('SELECT id, code FROM menus WHERE code = $1', [menu.code]);
        
        // 如果没有找到，尝试通过path和client_type查找
        if (existingMenu.rows.length === 0) {
          existingMenu = await pool.query('SELECT id, code FROM menus WHERE path = $1 AND client_type = $2', [menu.path, menu.client_type]);
        }
        
        console.log(`Checking menu: ${menu.name} (${menu.code}) - existing: ${existingMenu.rows.length > 0}`);
        
        if (existingMenu.rows.length === 0) {
          // 不存在，创建新菜单
          const result = await pool.query(
            `INSERT INTO menus (name, code, path, component, icon, sort_order, type, client_type, need_permission, position, target, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
            [menu.name, menu.code, menu.path, menu.component, menu.icon, menu.sort_order, menu.type, menu.client_type, menu.need_permission, menu.position, menu.target, menu.status]
          );
          console.log(`Added menu: ${menu.name} (ID: ${result.rows[0].id})`);
        } else {
          // 存在，检查code是否为空，并更新target字段
          if (!existingMenu.rows[0].code || existingMenu.rows[0].code === '') {
            // 更新code值
            await pool.query(
              'UPDATE menus SET code = $1, target = $2 WHERE id = $3',
              [menu.code, menu.target, existingMenu.rows[0].id]
            );
            console.log(`Updated menu code and target: ${menu.name} (ID: ${existingMenu.rows[0].id})`);
          } else {
            // 检查target是否需要更新
            const menuCheck = await pool.query('SELECT target FROM menus WHERE id = $1', [existingMenu.rows[0].id]);
            if (menuCheck.rows[0]?.target !== menu.target) {
              await pool.query('UPDATE menus SET target = $1 WHERE id = $2', [menu.target, existingMenu.rows[0].id]);
              console.log(`Updated menu target: ${menu.name} (ID: ${existingMenu.rows[0].id})`);
            }
            console.log(`Menu already exists: ${menu.name} (ID: ${existingMenu.rows[0].id})`);
          }
        }
      } catch (error) {
        console.error(`Error processing menu ${menu.name}:`, error);
      }
    }

    // 初始化用户端菜单
    const homeMenus = [
      { name: '首页', code: 'home-left-home', path: '/', component: 'Home', icon: 'House', sort_order: 1, type: 'menu', client_type: 'home', need_permission: false, position: 'left', target: '_self', status: 'enabled' },
      { name: '用户信息', code: 'profile-left-home', path: '/profile', component: 'Profile', icon: 'User', sort_order: 2, type: 'menu', client_type: 'home', need_permission: false, position: 'left', target: '_self', status: 'enabled' },
      { name: '我的模型', code: 'user-models-left-home', path: '/user-models', component: 'UserModels', icon: 'Cpu', sort_order: 3, type: 'menu', client_type: 'home', need_permission: false, position: 'left', target: '_self', status: 'enabled' },
      { name: '我的智能体', code: 'user-agents-left-home', path: '/user-agents', component: 'UserAgents', icon: 'ChatLineRound', sort_order: 4, type: 'menu', client_type: 'home', need_permission: false, position: 'left', target: '_self', status: 'enabled' },
    ];

    // 初始化头像下拉菜单
    const avatarMenus = [
      // 管理端头像菜单
      { name: '用户信息', code: 'user-profile-avatar-admin', path: '/profile', component: 'Profile', icon: 'User', sort_order: 1, type: 'menu', client_type: 'admin', need_permission: false, position: 'avatar', target: '_self', status: 'enabled' },
      { name: '退出登录', code: 'user-logout-avatar-admin', path: '/logout', component: 'Logout', icon: 'SwitchButton', sort_order: 3, type: 'menu', client_type: 'admin', need_permission: false, position: 'avatar', target: '_self', status: 'enabled' },
      // 用户端头像菜单
      { name: '用户信息', code: 'user-profile-avatar-home', path: '/profile', component: 'Profile', icon: 'User', sort_order: 1, type: 'menu', client_type: 'home', need_permission: false, position: 'avatar', target: '_self', status: 'enabled' },
      { name: '后台管理', code: 'admin-dashboard-avatar-home', path: '/admin', component: 'AdminDashboard', icon: 'Setting', sort_order: 2, type: 'menu', client_type: 'home', need_permission: true, position: 'avatar', target: '_blank', status: 'enabled' },
      { name: '退出登录', code: 'user-logout-avatar-home', path: '/logout', component: 'Logout', icon: 'SwitchButton', sort_order: 3, type: 'menu', client_type: 'home', need_permission: false, position: 'avatar', target: '_self', status: 'enabled' },
    ];

    // 检查并添加头像下拉菜单
    for (const menu of avatarMenus) {
      try {
        // 先尝试通过code查找
        let existingMenu = await pool.query('SELECT id, code FROM menus WHERE code = $1', [menu.code]);
        
        // 如果没有找到，尝试通过path和client_type和position查找
        if (existingMenu.rows.length === 0) {
          existingMenu = await pool.query('SELECT id, code FROM menus WHERE path = $1 AND client_type = $2 AND position = $3', [menu.path, menu.client_type, menu.position]);
        }
        
        console.log(`Checking menu: ${menu.name} (${menu.code}) - existing: ${existingMenu.rows.length > 0}`);
        
        if (existingMenu.rows.length === 0) {
          // 不存在，创建新菜单
          const result = await pool.query(
            `INSERT INTO menus (name, code, path, component, icon, sort_order, type, client_type, need_permission, position, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
            [menu.name, menu.code, menu.path, menu.component, menu.icon, menu.sort_order, menu.type, menu.client_type, menu.need_permission, menu.position, menu.status]
          );
          console.log(`Added menu: ${menu.name} (ID: ${result.rows[0].id})`);
        } else {
          // 存在，检查code是否为空，并更新target字段
          if (!existingMenu.rows[0].code || existingMenu.rows[0].code === '') {
            // 更新code值和target
            await pool.query(
              'UPDATE menus SET code = $1, target = $2 WHERE id = $3',
              [menu.code, menu.target, existingMenu.rows[0].id]
            );
            console.log(`Updated menu code and target: ${menu.name} (ID: ${existingMenu.rows[0].id})`);
          } else {
            // 检查target是否需要更新
            const menuCheck = await pool.query('SELECT target FROM menus WHERE id = $1', [existingMenu.rows[0].id]);
            if (menuCheck.rows[0]?.target !== menu.target) {
              await pool.query('UPDATE menus SET target = $1 WHERE id = $2', [menu.target, existingMenu.rows[0].id]);
              console.log(`Updated menu target: ${menu.name} (ID: ${existingMenu.rows[0].id})`);
            }
            console.log(`Menu already exists: ${menu.name} (ID: ${existingMenu.rows[0].id})`);
          }
        }
      } catch (error) {
        console.error(`Error processing menu ${menu.name}:`, error);
      }
    }

    // 检查并添加用户端菜单
    for (const menu of homeMenus) {
      try {
        // 先尝试通过code查找
        let existingMenu = await pool.query('SELECT id, code FROM menus WHERE code = $1', [menu.code]);
        
        // 如果没有找到，尝试通过path和client_type查找
        if (existingMenu.rows.length === 0) {
          existingMenu = await pool.query('SELECT id, code FROM menus WHERE path = $1 AND client_type = $2', [menu.path, menu.client_type]);
        }
        
        console.log(`Checking menu: ${menu.name} (${menu.code}) - existing: ${existingMenu.rows.length > 0}`);
        
        if (existingMenu.rows.length === 0) {
          // 不存在，创建新菜单
          const result = await pool.query(
            `INSERT INTO menus (name, code, path, component, icon, sort_order, type, client_type, need_permission, position, target, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
            [menu.name, menu.code, menu.path, menu.component, menu.icon, menu.sort_order, menu.type, menu.client_type, menu.need_permission, menu.position, menu.target, menu.status]
          );
          console.log(`Added menu: ${menu.name} (ID: ${result.rows[0].id})`);
        } else {
          // 存在，检查code是否为空，并更新target字段
          if (!existingMenu.rows[0].code || existingMenu.rows[0].code === '') {
            // 更新code值和target
            await pool.query(
              'UPDATE menus SET code = $1, target = $2 WHERE id = $3',
              [menu.code, menu.target, existingMenu.rows[0].id]
            );
            console.log(`Updated menu code and target: ${menu.name} (ID: ${existingMenu.rows[0].id})`);
          } else {
            // 检查target是否需要更新
            const menuCheck = await pool.query('SELECT target FROM menus WHERE id = $1', [existingMenu.rows[0].id]);
            if (menuCheck.rows[0]?.target !== menu.target) {
              await pool.query('UPDATE menus SET target = $1 WHERE id = $2', [menu.target, existingMenu.rows[0].id]);
              console.log(`Updated menu target: ${menu.name} (ID: ${existingMenu.rows[0].id})`);
            }
            console.log(`Menu already exists: ${menu.name} (ID: ${existingMenu.rows[0].id})`);
          }
        }
      } catch (error) {
        console.error(`Error processing menu ${menu.name}:`, error);
      }
    }
    console.log('Menus initialized');

    // 定义角色菜单关联配置
    const roleMenuAssignments = [
      {
        roleCode: 'super_admin',
        menus: []
      },
      {
        roleCode: 'admin',
        menus: [
          // 管理端菜单
          { code: 'dashboard-left-admin' },
          { code: 'users-left-admin' },
          { code: 'reviews-left-admin' },
          { code: 'roles-left-admin' },
          { code: 'menus-left-admin' },
          { code: 'models-left-admin' },
          { code: 'model-providers-left-admin' },
          { code: 'agents-left-admin' },
          { code: 'user-models-left-admin' },
          { code: 'user-agents-left-admin' },
          // 用户端头像菜单
          { code: 'admin-dashboard-avatar-home' }
        ]
      },
      {
        roleCode: 'developer',
        menus: []
      },
      {
        roleCode: 'user',
        menus: []
      }
    ];

    // 为角色分配菜单
    for (const assignment of roleMenuAssignments) {
      const roleResult = await pool.query("SELECT id FROM roles WHERE code = $1", [assignment.roleCode]);
      if (roleResult.rows.length > 0) {
        const roleId = roleResult.rows[0].id;
        
        for (const menuConfig of assignment.menus) {
          const menuResult = await pool.query(
            "SELECT id FROM menus WHERE code = $1",
            [menuConfig.code]
          );
          
          if (menuResult.rows.length > 0) {
            const menuId = menuResult.rows[0].id;
            await pool.query(
              `INSERT INTO role_menus (role_id, menu_id) 
               VALUES ($1, $2) 
               ON CONFLICT (role_id, menu_id) DO NOTHING`,
              [roleId, menuId]
            );
          }
        }
        console.log(`${assignment.roleCode} menus assigned`);
      }
    }

    // 检查是否已有模型数据
    const modelsResult = await pool.query('SELECT COUNT(*) FROM models');
    if (parseInt(modelsResult.rows[0].count) === 0) {
      // 初始化默认模型
      await pool.query(`
        INSERT INTO models (name, code, provider, model, description, status) VALUES
        ('OpenAI GPT-3.5 Turbo', 'openai_gpt35', 'openai', 'gpt-3.5-turbo', 'OpenAI的GPT-3.5 Turbo模型，适用于一般任务', 'enabled'),
        ('OpenAI GPT-4', 'openai_gpt4', 'openai', 'gpt-4', 'OpenAI的GPT-4模型，适用于复杂任务', 'enabled'),
        ('Anthropic Claude 3 Sonnet', 'anthropic_claude3_sonnet', 'anthropic', 'claude-3-sonnet-20240229', 'Anthropic的Claude 3 Sonnet模型，适用于写作任务', 'enabled'),
        ('智谱GLM-4', 'glm_glm4', 'glm', 'glm-4', '智谱的GLM-4模型，适用于中文任务', 'enabled'),
        -- 阿里云百炼CodingPlan模型
        ('千问 qwen3.5-plus', 'aliyun_qwen35_plus', 'aliyun_bailian', 'qwen3.5-plus', '阿里云百炼CodingPlan的千问qwen3.5-plus模型，支持文本生成、深度思考、视觉理解', 'enabled'),
        ('千问 qwen3-max-2026-01-23', 'aliyun_qwen3_max_20260123', 'aliyun_bailian', 'qwen3-max-2026-01-23', '阿里云百炼CodingPlan的千问qwen3-max-2026-01-23模型，支持文本生成、深度思考', 'enabled'),
        ('千问 qwen3-coder-next', 'aliyun_qwen3_coder_next', 'aliyun_bailian', 'qwen3-coder-next', '阿里云百炼CodingPlan的千问qwen3-coder-next模型，支持文本生成', 'enabled'),
        ('千问 qwen3-coder-plus', 'aliyun_qwen3_coder_plus', 'aliyun_bailian', 'qwen3-coder-plus', '阿里云百炼CodingPlan的千问qwen3-coder-plus模型，支持文本生成', 'enabled'),
        ('智谱 glm-5', 'aliyun_glm5', 'aliyun_bailian', 'glm-5', '阿里云百炼CodingPlan的智谱glm-5模型，支持文本生成、深度思考', 'enabled'),
        ('智谱 glm-4.7', 'aliyun_glm47', 'aliyun_bailian', 'glm-4.7', '阿里云百炼CodingPlan的智谱glm-4.7模型，支持文本生成、深度思考', 'enabled'),
        ('Kimi kimi-k2.5', 'aliyun_kimi_k25', 'aliyun_bailian', 'kimi-k2.5', '阿里云百炼CodingPlan的Kimi kimi-k2.5模型，支持文本生成、深度思考、视觉理解', 'enabled'),
        ('MiniMax MiniMax-M2.5', 'aliyun_minimax_m25', 'aliyun_bailian', 'MiniMax-M2.5', '阿里云百炼CodingPlan的MiniMax MiniMax-M2.5模型，支持文本生成、深度思考', 'enabled')
      `);
      console.log('Default models initialized');
    }

    // 检查是否已有模型提供商数据
    const providersResult = await pool.query('SELECT COUNT(*) FROM model_providers');
    if (parseInt(providersResult.rows[0].count) === 0) {
      // 初始化默认模型提供商
      const providersData = [
        {
          name: 'OpenAI',
          code: 'openai',
          url: 'https://platform.openai.com',
          openai_base_url: 'https://api.openai.com/v1',
          anthropic_base_url: '',
          protocol_base_url: 'https://api.openai.com/v1',
          description: 'OpenAI模型提供商',
          status: 'enabled',
          models: [
            { brand: 'OpenAI', modelId: 'gpt-3.5-turbo', capability: '通用对话' },
            { brand: 'OpenAI', modelId: 'gpt-4', capability: '复杂任务' }
          ]
        },
        {
          name: 'Anthropic',
          code: 'anthropic',
          url: 'https://www.anthropic.com',
          openai_base_url: '',
          anthropic_base_url: 'https://api.anthropic.com/v1',
          protocol_base_url: 'https://api.anthropic.com/v1',
          description: 'Anthropic模型提供商',
          status: 'enabled',
          models: [
            { brand: 'Anthropic', modelId: 'claude-3-sonnet-20240229', capability: '写作任务' }
          ]
        },
        {
          name: '阿里云百炼CodingPlan',
          code: 'aliyun_bailian',
          url: 'https://bailian.console.aliyun.com/cn-beijing/?tab=coding-plan#/efm/coding-plan-index',
          openai_base_url: 'https://coding.dashscope.aliyuncs.com/v1',
          anthropic_base_url: 'https://coding.dashscope.aliyuncs.com/apps/anthropic',
          protocol_base_url: 'https://coding.dashscope.aliyuncs.com/v1',
          description: '阿里云百炼CodingPlan模型提供商',
          status: 'enabled',
          models: [
            { brand: '千问', modelId: 'qwen3.5-plus', capability: '文本生成、深度思考、视觉理解' },
            { brand: '千问', modelId: 'qwen3-max-2026-01-23', capability: '文本生成、深度思考' },
            { brand: '千问', modelId: 'qwen3-coder-next', capability: '文本生成' },
            { brand: '千问', modelId: 'qwen3-coder-plus', capability: '文本生成' },
            { brand: '智谱', modelId: 'glm-5', capability: '文本生成、深度思考' },
            { brand: '智谱', modelId: 'glm-4.7', capability: '文本生成、深度思考' },
            { brand: 'Kimi', modelId: 'kimi-k2.5', capability: '文本生成、深度思考、视觉理解' },
            { brand: 'MiniMax', modelId: 'MiniMax-M2.5', capability: '文本生成、深度思考' }
          ]
        }
      ];
      
      for (const providerData of providersData) {
        const { models, ...providerFields } = providerData;
        
        // 插入提供商
        const providerResult = await pool.query(
          `INSERT INTO model_providers (name, code, url, openai_base_url, anthropic_base_url, protocol_base_url, description, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
           RETURNING id`,
          [providerFields.name, providerFields.code, providerFields.url, providerFields.openai_base_url, 
           providerFields.anthropic_base_url, providerFields.protocol_base_url, providerFields.description, providerFields.status]
        );
        
        const providerId = providerResult.rows[0].id;
        
        // 插入模型数据
        for (const model of models) {
          await pool.query(
            `INSERT INTO model_provider_models (provider_id, name, model_code, memo) 
             VALUES ($1, $2, $3, $4)`,
            [providerId, model.brand, model.modelId, model.capability]
          );
        }
      }
      
      console.log('Default model providers initialized');
    }

  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};

// 调用初始化函数
initDatabase().then(() => {
  console.log('Database initialization completed');
}).catch(error => {
  console.error('Error during initialization:', error);
});

module.exports = initDatabase;
