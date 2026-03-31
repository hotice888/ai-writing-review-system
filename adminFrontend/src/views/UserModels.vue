<template>
  <div class="user-models-container">
    <el-card class="user-models-card">
      <template #header>
        <div class="card-header">
          <span>用户模型管理</span>
        </div>
      </template>
      
      <el-table :data="userModelList" style="width: 100%" border>
        <el-table-column prop="username" label="用户名称" width="150" />
        <el-table-column prop="user_id" label="用户ID" width="180" />
        <el-table-column prop="name" label="模型名称" width="180" />
        <el-table-column prop="code" label="模型编码" width="180" />
        <el-table-column prop="provider" label="提供商" width="120" />
        <el-table-column prop="model" label="模型标识" width="200" />
        <el-table-column prop="api_url" label="API URL" show-overflow-tooltip />
        <el-table-column prop="api_key" label="API Key" width="200">
          <template #default="scope">
            <el-button size="small" type="primary" @click="showApiKey(scope.row.api_key)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'enabled' ? 'success' : 'danger'">
              {{ scope.row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="200">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="200">
          <template #default="scope">
            {{ formatDateTime(scope.row.updated_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- API Key查看对话框 -->
    <el-dialog
      v-model="apiKeyDialogVisible"
      title="API Key"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="apiKeyForm" label-width="80px">
        <el-form-item label="API Key">
          <el-input v-model="apiKeyForm.key" readonly />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="apiKeyDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getUserModels } from '../api/admin';

// 响应式数据
const userModelList = ref([]);
const apiKeyDialogVisible = ref(false);

// API Key查看表单
const apiKeyForm = reactive({
  key: ''
});

// 加载用户模型
const loadUserModels = async () => {
  try {
    console.log('开始加载所有用户模型...');
    const response = await getUserModels();
    console.log('加载用户模型成功:', response);
    userModelList.value = response;
  } catch (error) {
    ElMessage.error('加载用户模型失败');
    console.error('Error loading user models:', error);
  }
};

// 显示API Key
const showApiKey = (key) => {
  apiKeyForm.key = key || '';
  apiKeyDialogVisible.value = true;
};

// 格式化时间
const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 生命周期钩子
onMounted(() => {
  loadUserModels();
});
</script>

<style scoped>
.user-models-container {
  padding: 20px;
}

.user-models-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-footer {
  text-align: right;
}
</style>