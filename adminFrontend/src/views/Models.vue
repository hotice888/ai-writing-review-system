<template>
  <div class="model-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>模型管理</span>
          <el-button type="primary" @click="handleAdd" icon="Plus">添加模型</el-button>
        </div>
      </template>
      
      <el-table :data="modelList" style="width: 100%" border>
        <el-table-column prop="name" label="模型名称" width="180" />
        <el-table-column prop="code" label="模型编码" width="180" />
        <el-table-column prop="provider" label="提供商" width="120" />
        <el-table-column prop="model" label="模型标识" width="200" />
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

    <!-- 添加/编辑模型对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="formData"
        :rules="rules"
        ref="formRef"
        label-width="100px"
      >
        <el-form-item label="模型名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="模型编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入模型编码" />
        </el-form-item>
        <el-form-item label="提供商" prop="provider">
          <el-select v-model="formData.provider" placeholder="请选择提供商">
            <el-option label="OpenAI" value="openai" />
            <el-option label="Anthropic" value="anthropic" />
            <el-option label="智谱" value="glm" />
            <el-option label="百度" value="baidu" />
            <el-option label="阿里" value="ali" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型标识" prop="model">
          <el-input v-model="formData.model" placeholder="请输入模型标识" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入模型描述"
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
import { getModels, createModel, updateModel, deleteModel } from '../api/admin';

const modelList = ref<any[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('添加模型');
const formRef = ref();

const formData = reactive({
  name: '',
  code: '',
  provider: '',
  model: '',
  description: '',
  status: 'enabled'
});

const rules = {
  name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入模型编码', trigger: 'blur' }],
  provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
  model: [{ required: true, message: '请输入模型标识', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const currentModelId = ref('');

// 获取模型列表
const loadModels = async () => {
  try {
    const response = await getModels();
    modelList.value = response;
  } catch (error) {
    ElMessage.error('获取模型列表失败');
    console.error('Error loading models:', error);
  }
};

// 添加模型
const handleAdd = () => {
  dialogTitle.value = '添加模型';
  currentModelId.value = '';
  Object.assign(formData, {
    name: '',
    code: '',
    provider: '',
    model: '',
    description: '',
    status: 'enabled'
  });
  dialogVisible.value = true;
};

// 编辑模型
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑模型';
  currentModelId.value = row.id;
  Object.assign(formData, {
    name: row.name,
    code: row.code,
    provider: row.provider,
    model: row.model,
    description: row.description,
    status: row.status
  });
  dialogVisible.value = true;
};

// 删除模型
const handleDelete = async (id: string) => {
  try {
    await deleteModel(id);
    ElMessage.success('模型删除成功');
    loadModels();
  } catch (error) {
    ElMessage.error('删除模型失败');
    console.error('Error deleting model:', error);
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    if (currentModelId.value) {
      // 更新模型
      await updateModel(currentModelId.value, formData);
      ElMessage.success('模型更新成功');
    } else {
      // 创建模型
      await createModel(formData);
      ElMessage.success('模型创建成功');
    }
    
    dialogVisible.value = false;
    loadModels();
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
  loadModels();
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