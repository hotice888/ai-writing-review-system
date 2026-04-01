module.exports = {
  version: '1.0.0',
  data: [
    {
      name: '用户管理',
      path: '/users',
      component: 'Users',
      icon: 'User',
      sort_order: 1,
      client_type: 'admin'
    },
    {
      name: '角色管理',
      path: '/roles',
      component: 'Roles',
      icon: 'Lock',
      sort_order: 2,
      client_type: 'admin'
    },
    {
      name: '菜单管理',
      path: '/menus',
      component: 'Menus',
      icon: 'Menu',
      sort_order: 3,
      client_type: 'admin'
    },
    {
      name: '模型配置',
      path: '/user-models',
      component: 'UserModels',
      icon: 'Settings',
      sort_order: 1,
      client_type: 'home'
    },
    {
      name: '智能体管理',
      path: '/user-agents',
      component: 'UserAgents',
      icon: 'Robot',
      sort_order: 2,
      client_type: 'home'
    }
  ]
};