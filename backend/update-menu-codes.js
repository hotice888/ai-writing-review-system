const pool = require('./src/config/database');

// 定义正确的菜单编码映射
const menuCodeMap = {
  // 管理端菜单
  '仪表盘': 'dashboard-left-admin',
  '用户管理': 'users-left-admin',
  '评审管理': 'reviews-left-admin',
  '角色管理': 'roles-left-admin',
  '菜单管理': 'menus-left-admin',
  '模型管理': 'models-left-admin',
  '模型提供商': 'model-providers-left-admin',
  '智能体管理': 'agents-left-admin',
  '用户模型': 'user-models-left-admin',
  '用户智能体': 'user-agents-left-admin',
  // 用户端菜单
  '首页': 'home-left-home',
  '用户信息': 'profile-left-home',
  '我的模型': 'user-models-left-home',
  '我的智能体': 'user-agents-left-home'
};

async function updateMenuCodes() {
  try {
    console.log('开始更新菜单编码...');
    
    // 遍历菜单编码映射，更新数据库中的code字段
    for (const [name, code] of Object.entries(menuCodeMap)) {
      const result = await pool.query(
        'UPDATE menus SET code = $1 WHERE name = $2 RETURNING id, name, code',
        [code, name]
      );
      
      if (result.rows.length > 0) {
        console.log(`更新菜单 "${name}" 的编码为 "${code}"`);
      }
    }
    
    console.log('菜单编码更新完成！');
    
    // 验证更新结果
    const verificationResult = await pool.query('SELECT id, name, code FROM menus');
    console.log('\n更新后的菜单编码:');
    verificationResult.rows.forEach(menu => {
      console.log(`${menu.name}: ${menu.code}`);
    });
    
  } catch (error) {
    console.error('更新菜单编码时出错:', error);
  } finally {
    await pool.end();
  }
}

updateMenuCodes();