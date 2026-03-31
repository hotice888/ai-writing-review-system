const pool = require('./src/config/database');

// 菜单编码映射，按照新的命名规则：名称代码-菜单位置代码-客户端代码
const menuCodeMap = {
  // 管理端左侧菜单
  'dashboard': 'dashboard-left-admin',
  'users': 'users-left-admin',
  'reviews': 'reviews-left-admin',
  'roles': 'roles-left-admin',
  'menus': 'menus-left-admin',
  'models': 'models-left-admin',
  'model-providers': 'model-providers-left-admin',
  'agents': 'agents-left-admin',
  'user-models': 'user-models-left-admin',
  'user-agents': 'user-agents-left-admin',
  
  // 用户端左侧菜单
  'home': 'home-left-home',
  'profile': 'profile-left-home',
  'user-models': 'user-models-left-home',
  'user-agents': 'user-agents-left-home',
  
  // 管理端头像菜单
  'user-profile': 'user-profile-avatar-admin',
  'admin-dashboard-entry': 'admin-dashboard-avatar-admin',
  'user-logout': 'user-logout-avatar-admin',
  
  // 用户端头像菜单
  'user-profile-home': 'user-profile-avatar-home',
  'user-logout-home': 'user-logout-avatar-home'
};

async function updateMenuCodes() {
  try {
    console.log('开始更新菜单编码...');
    
    // 获取所有菜单
    const result = await pool.query('SELECT id, name, code, client_type, position FROM menus');
    const menus = result.rows;
    
    for (const menu of menus) {
      let newCode;
      
      // 构建新的编码
      if (menu.code) {
        // 如果已有编码，根据位置和客户端类型构建新编码
        const nameCode = menu.code.split('-')[0];
        const positionCode = menu.position || 'left';
        const clientCode = menu.client_type;
        newCode = `${nameCode}-${positionCode}-${clientCode}`;
      } else {
        // 如果没有编码，根据名称生成
        const nameCode = menu.name.toLowerCase().replace(/\s+/g, '-');
        const positionCode = menu.position || 'left';
        const clientCode = menu.client_type;
        newCode = `${nameCode}-${positionCode}-${clientCode}`;
      }
      
      console.log(`更新菜单 "${menu.name}" 的编码为 "${newCode}"`);
      
      try {
        await pool.query(
          'UPDATE menus SET code = $1 WHERE id = $2',
          [newCode, menu.id]
        );
      } catch (error) {
        console.error(`更新菜单编码时出错:`, error);
      }
    }
    
    console.log('菜单编码更新完成！');
  } catch (error) {
    console.error('更新菜单编码失败:', error);
  } finally {
    pool.end();
  }
}

updateMenuCodes();
