<template>
  <div class="profile">
    <el-card>
      <template #header>
        <h3>用户信息</h3>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">
          {{ userStore.user?.username }}
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          {{ userStore.user?.email }}
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag :type="userStore.isAdmin ? 'danger' : 'primary'">
            {{ userStore.isAdmin ? '管理员' : '普通用户' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用户ID">
          {{ userStore.user?.id }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
</script>

<style scoped>
.profile {
  max-width: 800px;
  margin: 0 auto;
}

.profile h3 {
  margin: 0;
  color: #333;
}
</style>
