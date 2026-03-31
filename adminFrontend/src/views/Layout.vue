<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="aside-container">
      <div class="logo" :class="{ 'collapsed': isCollapse }">
        <h3 v-if="!isCollapse">管理端</h3>
        <h3 v-else>管</h3>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#1a1a2e"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        @select="handleMenuSelect"
        :collapse="isCollapse"
      >
        <template v-for="menu in menuList" :key="menu?.id">
          <template v-if="menu && menu.id && menu.path">
            <el-sub-menu v-if="menu.children && Array.isArray(menu.children) && menu.children.length > 0" :index="menu.path">
              <template #title>
                <el-icon v-if="menu.icon">
                  <component :is="menu.icon" />
                </el-icon>
                <span v-if="!isCollapse">{{ menu.name }}</span>
              </template>
              <el-menu-item v-for="child in menu.children" :key="child?.id" :index="child?.path">
                <el-icon v-if="child && child.icon">
                  <component :is="child.icon" />
                </el-icon>
                <span v-if="!isCollapse && child && child.name">{{ child.name }}</span>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="menu.path">
              <el-icon v-if="menu.icon">
                <component :is="menu.icon" />
              </el-icon>
              <span v-if="!isCollapse">{{ menu.name }}</span>
            </el-menu-item>
          </template>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="breadcrumb">
            <el-button 
              type="text" 
              @click="toggleCollapse" 
              class="collapse-btn"
            >
              <el-icon v-if="!isCollapse"><ArrowLeft /></el-icon>
              <el-icon v-else><ArrowRight /></el-icon>
            </el-button>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-if="currentTitle">
                {{ currentTitle }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="user-dropdown">
            <el-dropdown @command="handleCommand">
              <div class="user-info">
                <el-avatar :size="32" :src="userStore.user?.avatar">
                  {{ userStore.user?.username?.charAt(0).toUpperCase() }}
                </el-avatar>
                <span class="username">{{ userStore.user?.username }}</span>
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { ArrowDown, SwitchButton, ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import { useUserStore } from '../stores/user';
import { getUserMenus } from '../api/admin';

interface Menu {
  id: string;
  name: string;
  path: string;
  component: string;
  icon: string;
  status: string;
  type: string;
  parentId?: string | null;
  clientType: string;
  needPermission: boolean;
  position: string;
  children?: Menu[];
}

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const menuList = ref<Menu[]>([]);
const avatarMenuList = ref<Menu[]>([]);
const isCollapse = ref(false);

const activeMenu = computed(() => route.path);

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

const currentTitle = computed(() => {
  const findTitle = (menus: Menu[]): string => {
    for (const menu of menus) {
      if (menu && menu.path === route.path) {
        return menu.name;
      }
      if (menu && menu.children) {
        const title = findTitle(menu.children);
        if (title) return title;
      }
    }
    return '';
  };
  return findTitle(menuList.value);
});

const fetchMenus = async () => {
  try {
    if (!userStore.isLoggedIn) {
      return;
    }
    // 管理端固定使用 'admin' 客户端类型
    const clientType = 'admin';
    // 获取左导航菜单
    const res = await getUserMenus(clientType, 'left');
    // 转换为树状结构
    menuList.value = buildMenuTree(res);
    // 获取头像下拉菜单
    const avatarRes = await getUserMenus(clientType, 'avatar');
    avatarMenuList.value = avatarRes;
  } catch (error) {
    console.error('获取菜单列表失败:', error);
  }
};

// 构建菜单树
const buildMenuTree = (menus: Menu[]): Menu[] => {
  // 确保menus是数组
  if (!Array.isArray(menus)) {
    return [];
  }
  
  const menuMap = new Map<string, Menu>();
  const rootMenus: Menu[] = [];
  
  // 先创建所有菜单项的映射
  for (const menu of menus) {
    if (menu && menu.id) {
      menuMap.set(menu.id, { 
        ...menu, 
        children: [],
        type: menu.type || 'menu' // 确保type属性存在
      });
    }
  }
  
  // 构建树状结构
  for (const menu of menus) {
    if (menu && menu.id) {
      if (!menu.parentId) {
        // 根菜单
        const menuItem = menuMap.get(menu.id);
        if (menuItem) {
          rootMenus.push(menuItem);
        }
      } else {
        // 子菜单
        const parent = menuMap.get(menu.parentId);
        const menuItem = menuMap.get(menu.id);
        if (parent && menuItem) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(menuItem);
        }
      }
    }
  }
  
  return rootMenus;
};

const findMenuByPath = (menus: Menu[], path: string): Menu | null => {
  for (const menu of menus) {
    if (menu && menu.path === path) {
      return menu;
    }
    if (menu && menu.children) {
      const found = findMenuByPath(menu.children, path);
      if (found) return found;
    }
  }
  return null;
};

const handleMenuSelect = (path: string) => {
  try {
    const menu = findMenuByPath(menuList.value, path);
    if (menu) {
      if (menu.status === 'not_implemented') {
        router.push('/not-implemented');
      } else {
        router.push(path);
      }
    }
  } catch (error) {
    console.error('处理菜单选择错误:', error);
    // 即使出错也要确保路由跳转
    router.push(path);
  }
};

const handleCommand = async (command: string) => {
  switch (command) {
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
        userStore.logout();
        router.push('/login');
      } catch {
        // 用户取消
      }
      break;
  }
};

onMounted(() => {
  fetchMenus();
});
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100%;
}

.el-aside {
  background-color: #1a1a2e;
  color: #fff;
  transition: width 0.3s ease;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #16162a;
  color: #fff;
  transition: all 0.3s ease;
}

.logo.collapsed {
  justify-content: center;
}

.logo h3 {
  margin: 0;
  font-size: 18px;
  transition: all 0.3s ease;
}

.logo.collapsed h3 {
  font-size: 16px;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breadcrumb {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.collapse-btn {
  color: #606266;
  font-size: 16px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  color: #409eff;
  background-color: #ecf5ff;
}

.user-dropdown {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-size: 14px;
  color: #333;
}

.el-main {
  background-color: #f5f7fa;
  padding: 20px;
  width: 100%;
}
</style>
