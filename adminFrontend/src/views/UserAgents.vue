<template>
  <div class="app-container">
    <div class="app-header">
      <el-page-header @back="$router.back()" content="用户智能体管理" />
    </div>
    <el-card class="app-card">
      <template #header>
        <div class="card-header">
          <span>用户智能体列表</span>
        </div>
      </template>
      <el-table :data="userAgents" border stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="username" label="用户名称" width="150" />
        <el-table-column prop="user_id" label="用户ID" width="180" />
        <el-table-column prop="name" label="智能体名称" width="180" />
        <el-table-column prop="role" label="智能体角色" min-width="200">
          <template #default="scope">
            <el-tooltip :content="scope.row.role" placement="top">
              <span class="ellipsis">{{ scope.row.role }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
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
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <div style="display: flex; gap: 8px; align-items: center;">
              <el-button size="small" type="primary" @click="showDetails(scope.row)" icon="View">查看</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 智能体详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="智能体详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="智能体名称">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ detailData.user_id }}</el-descriptions-item>
        <el-descriptions-item label="智能体角色">{{ detailData.role }}</el-descriptions-item>
        <el-descriptions-item label="详细指令">{{ detailData.instructions || '无' }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ detailData.description || '无' }}</el-descriptions-item>
        <el-descriptions-item label="模型ID">{{ detailData.model_id || '无' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detailData.status === 'enabled' ? '启用' : '禁用' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(detailData.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDateTime(detailData.updated_at) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getUserAgents } from '@/api/admin';

// 状态管理
const userAgents = ref<any[]>([]);
const loading = ref(false);
const detailVisible = ref(false);

// 详情数据
const detailData = reactive({
  id: '',
  user_id: '',
  name: '',
  description: '',
  role: '',
  instructions: '',
  model_id: '',
  status: '',
  created_at: '',
  updated_at: ''
});

// 时间格式化函数
const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    // 尝试使用替代方法解析时间
    const altDate = new Date(dateString.replace(/-/g, '/'));
    if (isNaN(altDate.getTime())) return dateString;
    return altDate.toLocaleString();
  }
  return date.toLocaleString();
};

// 获取用户智能体列表
const fetchUserAgents = async () => {
  loading.value = true;
  try {
    const response = await getUserAgents();
    userAgents.value = response;
  } catch (error) {
    ElMessage.error('获取用户智能体列表失败');
    console.error('获取用户智能体列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 查看详情
const showDetails = (row: any) => {
  Object.assign(detailData, row);
  detailVisible.value = true;
};

// 生命周期
onMounted(() => {
  fetchUserAgents();
});
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.app-header {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  display: block;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>