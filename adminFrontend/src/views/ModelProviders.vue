<template>
  <div class="model-provider-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>模型提供商管理</span>
          <el-button type="primary" @click="handleAdd" icon="Plus">添加提供商</el-button>
        </div>
      </template>
      
      <el-table :data="providerList" style="width: 100%" border>
        <el-table-column prop="name" label="提供商名称" width="180" />
        <el-table-column prop="code" label="提供商编码" width="180" />
        <el-table-column prop="url" label="网址" min-width="200">
          <template #default="scope">
            <el-link :href="scope.row.url" target="_blank" v-if="scope.row.url">{{ scope.row.url }}</el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="openai_base_url" label="Base URL[OpenAI]" min-width="200" />
        <el-table-column prop="protocol_base_url" label="Base URL[协议]" min-width="200" />
        <el-table-column prop="description" label="描述" />
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

    <!-- 添加/编辑模型提供商对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="formData"
        :rules="rules"
        ref="formRef"
        label-width="120px"
      >
        <el-form-item label="提供商名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入提供商名称" />
        </el-form-item>
        <el-form-item label="提供商编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入提供商编码" />
        </el-form-item>
        <el-form-item label="网址" prop="url">
          <el-input v-model="formData.url" placeholder="请输入提供商网址" />
        </el-form-item>
        <el-form-item label="Base URL[OpenAI]" prop="openai_base_url">
          <el-input v-model="formData.openai_base_url" placeholder="请输入OpenAI格式的Base URL" />
        </el-form-item>
        <el-form-item label="Base URL[协议]" prop="protocol_base_url">
          <el-input v-model="formData.protocol_base_url" placeholder="请输入协议格式的Base URL" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入提供商描述"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getModelProviders, createModelProvider, updateModelProvider, deleteModelProvider } from '../api/admin';

const providerList = ref<any[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('添加提供商');
const formRef = ref();

const formData = reactive({
  name: '',
  code: '',
  url: '',
  openai_base_url: '',
  protocol_base_url: '',
  description: '',
  status: 'enabled'
});

const rules = {
  name: [{ required: true, message: '请输入提供商名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入提供商编码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const currentProviderId = ref('');

// 获取模型提供商列表
const loadProviders = async () => {
  try {
    const response = await getModelProviders();
    providerList.value = response;
  } catch (error) {
    ElMessage.error('获取模型提供商列表失败');
    console.error('Error loading providers:', error);
  }
};

// 添加模型提供商
const handleAdd = () => {
  dialogTitle.value = '添加提供商';
  currentProviderId.value = '';
  Object.assign(formData, {
    name: '',
    code: '',
    url: '',
    openai_base_url: '',
    protocol_base_url: '',
    description: '',
    status: 'enabled'
  });
  dialogVisible.value = true;
};

// 编辑模型提供商
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑提供商';
  currentProviderId.value = row.id;
  Object.assign(formData, {
    name: row.name,
    code: row.code,
    url: row.url,
    openai_base_url: row.openai_base_url,
    protocol_base_url: row.protocol_base_url,
    description: row.description,
    status: row.status
  });
  dialogVisible.value = true;
};

// 删除模型提供商
const handleDelete = async (id: string) => {
  try {
    await deleteModelProvider(id);
    ElMessage.success('模型提供商删除成功');
    loadProviders();
  } catch (error) {
    ElMessage.error('删除模型提供商失败');
    console.error('Error deleting provider:', error);
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    if (currentProviderId.value) {
      // 更新模型提供商
      await updateModelProvider(currentProviderId.value, formData);
      ElMessage.success('模型提供商更新成功');
    } else {
      // 创建模型提供商
      await createModelProvider(formData);
      ElMessage.success('模型提供商创建成功');
    }
    
    dialogVisible.value = false;
    loadProviders();
  } catch (error) {
    ElMessage.error('操作失败');
    console.error('Error submitting form:', error);
  }
};

// 格式化时间
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 初始化
onMounted(() => {
  loadProviders();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}
</style>