<template>
  <el-container class="layout-container">
    <el-aside :width="isMobile ? 'auto' : (isCollapse ? '64px' : '200px')" :class="{ 'mobile-aside': isMobile }">
      <div class="logo" v-if="!isMobile" :class="{ 'collapsed': isCollapse }">
        <h3 v-if="!isCollapse">AI创作评审系统</h3>
        <h3 v-else>AI</h3>
      </div>
      <div class="mobile-logo" v-else>
        <el-button type="text" @click="toggleMenu" class="mobile-menu-button">
          <el-icon><Menu /></el-icon>
        </el-button>
        <h3>AI创作</h3>
      </div>
      <el-menu
        v-show="!isMobile || showMobileMenu"
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        :collapse="isCollapse && !isMobile"
      >
        <template v-for="menu in menuList" :key="menu.id">
          <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.path">
            <template #title>
              <div @click="handleParentMenuClick(menu)" class="parent-menu-title">
                <el-icon v-if="menu.icon">
                  <component :is="menu.icon" />
                </el-icon>
                <span v-if="!isCollapse || isMobile">{{ menu.name }}</span>
              </div>
            </template>
            <el-menu-item v-for="child in menu.children" :key="child.id" :index="child.path" @click="handleMenuClick(child)">
              <el-icon v-if="child.icon">
                <component :is="child.icon" />
              </el-icon>
              <span v-if="!isCollapse || isMobile">{{ child.name }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="menu.path" @click="handleMenuClick(menu)">
            <el-icon v-if="menu.icon">
              <component :is="menu.icon" />
            </el-icon>
            <span v-if="!isCollapse || isMobile">{{ menu.name }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="breadcrumb">
            <el-button 
              v-if="!isMobile"
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
                  <template v-for="(menu, index) in avatarMenuList" :key="menu.id">
                    <el-dropdown-item :command="menu.path" :divided="index > 0">
                      <el-icon v-if="menu.icon">
                        <component :is="menu.icon" />
                      </el-icon>
                      {{ menu.name }}
                    </el-dropdown-item>
                  </template>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { ArrowDown, Setting, SwitchButton, User, Menu, ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import { useUserStore } from '../stores/user';
import { getUserMenus } from '../api/auth';

interface Menu {
  id: string;
  name: string;
  path: string;
  component: string;
  icon: string;
  target?: string; // 显示方式：_self（主内容区）或_blank（新页签）
  children?: Menu[];
}

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const menuList = ref<Menu[]>([]);
const avatarMenuList = ref<Menu[]>([]);
const isMobile = ref(false);
const showMobileMenu = ref(false);
const isCollapse = ref(false);

const activeMenu = computed(() => route.path);

const currentTitle = computed(() => {
  const findTitle = (menus: Menu[]): string => {
    for (const menu of menus) {
      if (menu.path === route.path) {
        return menu.name;
      }
      if (menu.children) {
        const title = findTitle(menu.children);
        if (title) return title;
      }
    }
    return '';
  };
  return findTitle(menuList.value);
});

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
    showMobileMenu.value = false;
  }
};

const toggleMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

const fetchMenus = async () => {
  try {
    if (!userStore.isLoggedIn) {
      return;
    }
    // 用户端固定使用 'home' 客户端类型
    const clientType = 'home';
    // 获取左导航菜单
    const res = await getUserMenus(clientType, 'left');
    menuList.value = res;
    // 获取头像下拉菜单
    const avatarRes = await getUserMenus(clientType, 'avatar');
    avatarMenuList.value = avatarRes;
  } catch (error) {
    console.error('获取菜单列表失败:', error);
  }
};

const handleMenuClick = (menu: Menu) => {
  if (menu.target === '_blank') {
    // 在新页签中打开
    window.open(menu.path, '_blank');
  } else {
    // 在主内容区显示（默认）
    router.push(menu.path);
  }
};

const handleParentMenuClick = (menu: Menu) => {
  // 检查菜单是否有路径
  if (menu.path) {
    // 执行跳转逻辑
    if (menu.target === '_blank') {
      // 在新页签中打开
      window.open(menu.path, '_blank');
    } else {
      // 在主内容区显示（默认）
      router.push(menu.path);
    }
  }
  // 子菜单的折叠/展开由Element Plus自动处理
};

const handleCommand = async (command: string) => {
    if (command === '/admin' || command === 'admin') {
      const token = localStorage.getItem('token');
      const adminUrl = import.meta.env.VITE_ADMIN_BASE_URL || 'http://localhost:5174';
      window.open(`${adminUrl}?token=${token}`, '_blank');
    } else if (command === '/logout' || command === 'logout') {
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
  } else {
    // 处理菜单路径
    router.push(command);
  }
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  fetchMenus();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100%;
}

.el-aside {
  background-color: #304156;
  color: #fff;
  transition: all 0.3s ease;
}

.mobile-aside {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1000;
  width: 200px;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3a4a;
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

.parent-menu-title {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.mobile-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #2b3a4a;
  color: #fff;
  padding: 0 16px;
}

.mobile-menu-button {
  color: #fff;
  font-size: 20px;
}

.mobile-logo h3 {
  margin: 0;
  font-size: 18px;
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

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
  width: 100%;
  min-height: calc(100vh - 60px);
}

/* 响应式样式 */
@media (max-width: 768px) {
  .el-main {
    padding: 10px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .user-info {
    align-self: flex-end;
  }
  
  .username {
    display: none;
  }
  
  .breadcrumb {
    font-size: 12px;
  }
}
</style>