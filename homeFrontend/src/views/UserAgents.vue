<template>
  <div class="app-container">
    <div class="app-header">
      <el-page-header @back="$router.back()" content="我的智能体" />
    </div>
    <el-card class="app-card">
      <template #header>
        <div class="card-header">
          <span>智能体列表</span>
          <el-button type="primary" @click="handleCreate" icon="Plus">新建智能体</el-button>
        </div>
      </template>
      <el-table :data="userAgents" border stripe style="width: 100%" v-loading="loading">
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

    <!-- 智能体编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="智能体名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入智能体名称" />
        </el-form-item>
        <el-form-item label="智能体角色" prop="role">
          <el-input
            v-model="form.role"
            type="textarea"
            :rows="3"
            placeholder="请输入智能体角色描述"
          />
        </el-form-item>
        <el-form-item label="详细指令" prop="instructions">
          <el-input
            v-model="form.instructions"
            type="textarea"
            :rows="4"
            placeholder="请输入详细指令"
          />
        </el-form-item>
        <el-form-item label="选择模型">
          <el-select v-model="form.model_id" placeholder="请选择模型" style="width: 100%">
            <el-option
              v-for="model in userModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入智能体描述"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="enabled">启用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserAgents, createUserAgent, updateUserAgent, deleteUserAgent } from '@/api/userAgents';
import { getUserModels } from '@/api/userModels';

// 状态管理
const userAgents = ref<any[]>([]);
const userModels = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新建智能体');
const formRef = ref();

// 表单数据
const form = reactive({
  id: '',
  name: '',
  description: '',
  role: '',
  instructions: '',
  model_id: '',
  status: 'enabled'
});

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入智能体名称', trigger: 'blur' }],
  role: [{ required: true, message: '请输入智能体角色描述', trigger: 'blur' }]
};

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
    ElMessage.error('获取智能体列表失败');
    console.error('获取智能体列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 获取用户模型列表
const fetchUserModels = async () => {
  try {
    const response = await getUserModels();
    userModels.value = response;
  } catch (error) {
    ElMessage.error('获取模型列表失败');
    console.error('获取模型列表失败:', error);
  }
};

// 新建智能体
const handleCreate = () => {
  dialogTitle.value = '新建智能体';
  Object.assign(form, {
    id: '',
    name: '',
    description: '',
    role: '',
    instructions: '',
    model_id: '',
    status: 'enabled'
  });
  dialogVisible.value = true;
};

// 编辑智能体
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑智能体';
  Object.assign(form, row);
  dialogVisible.value = true;
};

// 删除智能体
const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个智能体吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await deleteUserAgent(id);
    ElMessage.success('删除成功');
    fetchUserAgents();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (form.id) {
          await updateUserAgent(form.id, form);
          ElMessage.success('更新成功');
        } else {
          await createUserAgent(form);
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        fetchUserAgents();
      } catch (error) {
        ElMessage.error('操作失败');
        console.error('操作失败:', error);
      }
    }
  });
};

// 生命周期
onMounted(() => {
  fetchUserAgents();
  fetchUserModels();
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