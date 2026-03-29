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
        INSERT INTO roles (name, code, description, status) VALUES
        ('超级管理员', 'super_admin', '系统超级管理员，拥有所有权限', 'enabled'),
        ('管理员', 'admin', '系统管理员', 'enabled'),
        ('平台开发人员', 'developer', '平台开发人员，可查看实现中的功能', 'enabled'),
        ('普通用户', 'user', '普通用户角色', 'enabled')
      `);
      console.log('Default roles initialized');
    }

    // 检查是否已有菜单数据
    const menusResult = await pool.query('SELECT COUNT(*) FROM menus');
    if (parseInt(menusResult.rows[0].count) === 0) {
      // 初始化管理端菜单
      const adminMenus = [
        { name: '仪表盘', path: '/', component: 'Dashboard', icon: 'DataLine', sort_order: 1, type: 'menu', client_type: 'admin', need_permission: true, status: 'enabled' },
        { name: '用户管理', path: '/users', component: 'Users', icon: 'User', sort_order: 2, type: 'menu', client_type: 'admin', need_permission: true, status: 'enabled' },
        { name: '评审管理', path: '/reviews', component: 'Reviews', icon: 'Document', sort_order: 3, type: 'menu', client_type: 'admin', need_permission: true, status: 'enabled' },
        { name: '角色管理', path: '/roles', component: 'Roles', icon: 'UserFilled', sort_order: 4, type: 'menu', client_type: 'admin', need_permission: true, status: 'enabled' },
        { name: '菜单管理', path: '/menus', component: 'Menus', icon: 'Menu', sort_order: 5, type: 'menu', client_type: 'admin', need_permission: true, status: 'enabled' },
      ];

      for (const menu of adminMenus) {
        await pool.query(
          `INSERT INTO menus (name, path, component, icon, sort_order, type, client_type, need_permission, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [menu.name, menu.path, menu.component, menu.icon, menu.sort_order, menu.type, menu.client_type, menu.need_permission, menu.status]
        );
      }

      // 初始化用户端菜单
      const homeMenus = [
        { name: '首页', path: '/', component: 'Home', icon: 'House', sort_order: 1, type: 'menu', client_type: 'home', need_permission: true, status: 'enabled' },
        { name: '用户信息', path: '/profile', component: 'Profile', icon: 'User', sort_order: 2, type: 'menu', client_type: 'home', need_permission: true, status: 'enabled' },
      ];

      for (const menu of homeMenus) {
        await pool.query(
          `INSERT INTO menus (name, path, component, icon, sort_order, type, client_type, need_permission, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [menu.name, menu.path, menu.component, menu.icon, menu.sort_order, menu.type, menu.client_type, menu.need_permission, menu.status]
        );
      }

      console.log('Default menus initialized');
    }

    // 为超级管理员角色关联所有菜单
    const superAdminResult = await pool.query("SELECT id FROM roles WHERE code = 'super_admin'");
    if (superAdminResult.rows.length > 0) {
      const superAdminId = superAdminResult.rows[0].id;
      const allMenus = await pool.query('SELECT id FROM menus');
      
      for (const menu of allMenus.rows) {
        await pool.query(
          `INSERT INTO role_menus (role_id, menu_id) 
           VALUES ($1, $2) 
           ON CONFLICT (role_id, menu_id) DO NOTHING`,
          [superAdminId, menu.id]
        );
      }
      console.log('Super admin menus assigned');
    }

    // 为普通用户角色关联用户端菜单
    const userRoleResult = await pool.query("SELECT id FROM roles WHERE code = 'user'");
    if (userRoleResult.rows.length > 0) {
      const userRoleId = userRoleResult.rows[0].id;
      const homeMenus = await pool.query("SELECT id FROM menus WHERE client_type = 'home'");
      
      for (const menu of homeMenus.rows) {
        await pool.query(
          `INSERT INTO role_menus (role_id, menu_id) 
           VALUES ($1, $2) 
           ON CONFLICT (role_id, menu_id) DO NOTHING`,
          [userRoleId, menu.id]
        );
      }
      console.log('User role menus assigned');
    }

    // 为管理员角色关联管理端菜单
    const adminRoleResult = await pool.query("SELECT id FROM roles WHERE code = 'admin'");
    if (adminRoleResult.rows.length > 0) {
      const adminRoleId = adminRoleResult.rows[0].id;
      const adminMenus = await pool.query("SELECT id FROM menus WHERE client_type = 'admin'");
      
      for (const menu of adminMenus.rows) {
        await pool.query(
          `INSERT INTO role_menus (role_id, menu_id) 
           VALUES ($1, $2) 
           ON CONFLICT (role_id, menu_id) DO NOTHING`,
          [adminRoleId, menu.id]
        );
      }
      console.log('Admin role menus assigned');
    }

  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};

module.exports = initDatabase;
