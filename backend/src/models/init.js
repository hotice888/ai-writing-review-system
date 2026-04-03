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

    // 模型平台表
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
    
    // 模型平台模型表
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
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// 调用初始化函数
initDatabase().then(() => {
  console.log('Database initialization completed');
}).catch(error => {
  console.error('Error during initialization:', error);
});

module.exports = initDatabase;
