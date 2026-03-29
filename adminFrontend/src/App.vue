<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from './stores/user';
import { verifyToken } from './api/admin';

const router = useRouter();
const userStore = useUserStore();

onMounted(async () => {
  // 检查URL参数中是否有token（从用户端跳转过来）
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  console.log('URL token:', token);
  
  if (token) {
    console.log('Verifying token:', token.substring(0, 20) + '...');
    
    try {
      // 使用verifyToken接口验证token
      const response = await verifyToken(token);
      console.log('Token verified successfully:', response.data);
      
      if (response.data.code === 200) {
        // 设置token和用户信息
        userStore.setToken(response.data.data.token);
        userStore.setUser(response.data.data.user);
        console.log('User info set successfully:', userStore.user);
        
        // 清除URL中的token参数
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log('URL token cleared');
      } else {
        console.error('Token verification failed:', response.data.message);
        // 清除URL中的token参数，让路由守卫处理
        window.history.replaceState({}, document.title, window.location.pathname);
        // 触发路由跳转，让路由守卫重新检查
        router.go(0);
      }
    } catch (error) {
      console.error('Token verification error:', error);
      // 清除URL中的token参数，让路由守卫处理
      window.history.replaceState({}, document.title, window.location.pathname);
      // 触发路由跳转，让路由守卫重新检查
      router.go(0);
    }
  } else {
    console.log('No token in URL');
  }
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
