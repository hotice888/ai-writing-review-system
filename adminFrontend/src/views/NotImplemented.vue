<template>
  <div class="not-implemented">
    <el-result
      icon="warning"
      title="功能尚未实现"
      sub-title="该功能正在开发中，敬请期待！"
    >
      <template #extra>
        <el-button type="primary" @click="goBack">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  router.push('/');
};
</script>

<style scoped>
.not-implemented {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
