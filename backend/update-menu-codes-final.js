const pool = require('./src/config/database');

// 菜单名称到代码的映射
const nameToCodeMap = {
  '仪表盘': 'dashboard',
  '用户管理': 'users',
  '评审管理': 'reviews',
  '角色管理': 'roles',
  '菜单管理': 'menus',
  '模型管理': 'models',
  '模型提供商': 'model-providers',
  '智能体管理': 'agents',
  '用户模型': 'user-models',
  '用户智能体': 'user-agents',
  '首页': 'home',
  '用户信息': 'user-profile',
  '后台管理': 'admin-dashboard',
  '退出登录': 'user-logout',
  '我的模型': 'user-models',
  '我的智能体': 'user-agents'
};

async function updateMenuCodes() {
  try {
    console.log('开始更新菜单编码...');
    
    // 获取所有菜单
    const result = await pool.query('SELECT id, name, client_type, position FROM menus');
    const menus = result.rows;
    
    for (const menu of menus) {
      // 获取名称代码
      const nameCode = nameToCodeMap[menu.name] || menu.name.toLowerCase().replace(/\s+/g, '-');
      
      // 获取位置代码
      const positionCode = menu.position || 'left';
      
      // 获取客户端代码
      const clientCode = menu.client_type;
      
      // 构建新的编码
      const newCode = `${nameCode}-${positionCode}-${clientCode}`;
      
      console.log(`更新菜单 "${menu.name}" 的编码为 "${newCode}"`);
      
      try {
        await pool.query(
          'UPDATE menus SET code = $1 WHERE id = $2',
          [newCode, menu.id]
        );
      } catch (error) {
        console.error(`更新菜单 "${menu.name}" 编码时出错:`, error.message);
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
