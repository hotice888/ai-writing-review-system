<template>
  <div class="user-models-container">
    <el-card class="user-models-card">
      <template #header>
        <div class="card-header">
          <span>我的模型</span>
          <el-button type="primary" @click="handleAddModel" icon="Plus">添加模型</el-button>
        </div>
      </template>
      
      <el-table :data="userModelList" style="width: 100%" border>
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
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <div style="display: flex; gap: 8px; align-items: center;">
              <el-button size="small" @click="handleEdit(scope.row)" icon="Edit">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row.id)" icon="Delete">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑模型对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="模型名称" required>
          <el-input v-model="formData.name" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="模型编码" required>
          <el-input v-model="formData.code" placeholder="请输入模型编码" />
        </el-form-item>
        <el-form-item label="提供商" required>
          <el-select v-model="formData.provider" placeholder="请选择提供商">
            <el-option label="OpenAI" value="openai" />
            <el-option label="Anthropic" value="anthropic" />
            <el-option label="GLM" value="glm" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型标识" required>
          <el-input v-model="formData.model" placeholder="请输入模型标识" />
        </el-form-item>
        <el-form-item label="API URL">
          <el-input v-model="formData.api_url" placeholder="请输入API URL" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="formData.api_key" type="password" placeholder="请输入API Key" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入描述" :rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 从平台模型选择对话框 -->
    <el-dialog
      v-model="platformModelDialogVisible"
      title="选择平台模型"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-table :data="platformModelList" style="width: 100%" border>
        <el-table-column prop="name" label="模型名称" width="180" />
        <el-table-column prop="code" label="模型编码" width="180" />
        <el-table-column prop="provider" label="提供商" width="120" />
        <el-table-column prop="model" label="模型标识" width="200" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="selectPlatformModel(scope.row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="platformModelDialogVisible = false">取消</el-button>
        </span>
      </template>
    </el-dialog>

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
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserModels, createUserModel, updateUserModel, deleteUserModel, getPlatformModels } from '../api/userModels';

// 响应式数据
const userModelList = ref([]);
const platformModelList = ref([]);
const dialogVisible = ref(false);
const platformModelDialogVisible = ref(false);
const apiKeyDialogVisible = ref(false);
const dialogTitle = ref('添加模型');
const currentModelId = ref('');

// 表单数据
const formData = reactive({
  name: '',
  code: '',
  provider: '',
  model: '',
  api_url: '',
  api_key: '',
  description: '',
  status: 'enabled'
});

// API Key查看表单
const apiKeyForm = reactive({
  key: ''
});

// 加载用户模型
const loadUserModels = async () => {
  try {
    console.log('开始加载用户模型...');
    console.log('Token:', localStorage.getItem('token'));
    const response = await getUserModels();
    console.log('加载用户模型成功:', response);
    userModelList.value = response;
  } catch (error) {
    ElMessage.error('加载用户模型失败');
    console.error('Error loading user models:', error);
  }
};

// 加载平台模型
const loadPlatformModels = async () => {
  try {
    const response = await getPlatformModels();
    platformModelList.value = response;
  } catch (error) {
    ElMessage.error('加载平台模型失败');
    console.error('Error loading platform models:', error);
  }
};

// 添加模型
const handleAddModel = () => {
  console.log('点击添加模型按钮');
  dialogTitle.value = '添加模型';
  currentModelId.value = '';
  // 重置表单
  Object.assign(formData, {
    name: '',
    code: '',
    provider: '',
    model: '',
    api_url: '',
    api_key: '',
    description: '',
    status: 'enabled'
  });
  console.log('打开添加模型对话框');
  dialogVisible.value = true;
};

// 编辑模型
const handleEdit = (model) => {
  dialogTitle.value = '编辑模型';
  currentModelId.value = model.id;
  // 填充表单数据
  Object.assign(formData, {
    name: model.name,
    code: model.code,
    provider: model.provider,
    model: model.model,
    api_url: model.api_url || '',
    api_key: model.api_key || '',
    description: model.description || '',
    status: model.status
  });
  dialogVisible.value = true;
};

// 删除模型
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个模型吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await deleteUserModel(id);
    ElMessage.success('删除成功');
    loadUserModels();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
      console.error('Error deleting user model:', error);
    }
  }
};

// 提交表单
const submitForm = async () => {
  try {
    console.log('开始提交表单...');
    console.log('Form data:', formData);
    // 验证表单数据
    if (!formData.name || !formData.code || !formData.provider || !formData.model) {
      ElMessage.error('请填写必填字段');
      return;
    }
    if (currentModelId.value) {
      // 更新模型
      console.log('更新模型:', currentModelId.value);
      await updateUserModel(currentModelId.value, formData);
      ElMessage.success('更新成功');
    } else {
      // 创建模型
      console.log('创建模型');
      console.log('Token:', localStorage.getItem('token'));
      console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
      const result = await createUserModel(formData);
      console.log('创建模型成功:', result);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadUserModels();
  } catch (error) {
    ElMessage.error('操作失败');
    console.error('Error submitting form:', error);
    console.error('Error details:', error.response?.data);
  }
};

// 显示API Key
const showApiKey = (key) => {
  apiKeyForm.key = key || '';
  apiKeyDialogVisible.value = true;
};

// 打开平台模型选择对话框
const openPlatformModelDialog = () => {
  loadPlatformModels();
  platformModelDialogVisible.value = true;
};

// 选择平台模型
const selectPlatformModel = (model) => {
  // 填充表单数据
  Object.assign(formData, {
    name: model.name,
    code: model.code,
    provider: model.provider,
    model: model.model,
    description: model.description || '',
    status: 'enabled'
  });
  platformModelDialogVisible.value = false;
  dialogVisible.value = true;
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