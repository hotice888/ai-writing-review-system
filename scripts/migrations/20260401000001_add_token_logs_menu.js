const pool = require('../../backend/src/config/database');

module.exports = {
  up: async (pool) => {
    const result = await pool.query(
      `INSERT INTO menus (name, path, component, icon, sort_order, client_type, code, position, need_permission)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (code) DO NOTHING
       RETURNING id`,
      ['Token日志管理', '/token-logs', 'TokenLogs', 'Document', 8, 'admin', 'token-logs-left-admin', 'left', true]
    );
    
    if (result.rows.length > 0) {
      const menuId = result.rows[0].id;
      console.log(`✓ Created menu: Token日志管理 (ID: ${menuId})`);
      
      const superAdminRole = await pool.query("SELECT id FROM roles WHERE code = 'super_admin'");
      const adminRole = await pool.query("SELECT id FROM roles WHERE code = 'admin'");
      
      if (superAdminRole.rows.length > 0) {
        await pool.query(
          `INSERT INTO role_menus (role_id, menu_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [superAdminRole.rows[0].id, menuId]
        );
        console.log('✓ Assigned Token日志管理 menu to super_admin role');
      }
      
      if (adminRole.rows.length > 0) {
        await pool.query(
          `INSERT INTO role_menus (role_id, menu_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [adminRole.rows[0].id, menuId]
        );
        console.log('✓ Assigned Token日志管理 menu to admin role');
      }
    } else {
      console.log('Menu Token日志管理 already exists');
    }
    
    console.log('✓ Migration 20260401000001_add_token_logs_menu completed');
  },
  
  down: async (pool) => {
    await pool.query(`DELETE FROM role_menus WHERE menu_id IN (SELECT id FROM menus WHERE code = 'token-logs-left-admin')`);
    await pool.query(`DELETE FROM menus WHERE code = 'token-logs-left-admin'`);
    console.log('✓ Rollback 20260401000001_add_token_logs_menu completed');
  }
};
