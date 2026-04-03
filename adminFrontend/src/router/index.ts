import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
      },
      {
        path: '/users',
        name: 'Users',
        component: () => import('../views/Users.vue'),
      },
      {
        path: '/reviews',
        name: 'Reviews',
        component: () => import('../views/Reviews.vue'),
      },
      {
        path: '/roles',
        name: 'Roles',
        component: () => import('../views/Roles.vue'),
      },
      {
        path: '/menus',
        name: 'Menus',
        component: () => import('../views/Menus.vue'),
      },
      {
        path: '/models',
        name: 'Models',
        component: () => import('../views/Models.vue'),
      },
      {
        path: '/model-providers',
        name: 'ModelProviders',
        component: () => import('../views/ModelProviders.vue'),
      },
      {
        path: '/token-logs',
        name: 'TokenLogs',
        component: () => import('../views/TokenLogs.vue'),
      },
      {
        path: '/statistics',
        name: 'Statistics',
        component: () => import('../views/StatisticsDashboard.vue'),
      },
      {
        path: '/user-models',
        name: 'UserModels',
        component: () => import('../views/UserModels.vue'),
      },
  {
    path: '/agents',
    name: 'Agents',
    component: () => import('../views/Agents.vue'),
  },
  {
    path: '/user-agents',
    name: 'UserAgents',
    component: () => import('../views/UserAgents.vue'),
  },
      {
        path: '/not-implemented',
        name: 'NotImplemented',
        component: () => import('../views/NotImplemented.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token');
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  
  // 如果URL中有token参数，先验证token
  if (urlToken && !token) {
    try {
      const response = await fetch('http://localhost:3000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: urlToken }),
      });
      
      const result = await response.json();
      
      if (result.code === 200) {
        // 设置token和用户信息到localStorage
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        
        // 清除URL中的token参数
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // 继续导航
        next();
        return;
      } else {
        // 验证失败，清除URL中的token参数
        window.history.replaceState({}, document.title, window.location.pathname);
        if (to.meta.requiresAuth) {
          next('/login');
          return;
        }
      }
    } catch (error) {
      console.error('Token verification error:', error);
      // 验证失败，清除URL中的token参数
      window.history.replaceState({}, document.title, window.location.pathname);
      if (to.meta.requiresAuth) {
        next('/login');
        return;
      }
    }
  }
  
  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else {
    next();
  }
});

export default router;
