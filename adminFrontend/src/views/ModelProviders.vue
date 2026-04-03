<template>
  <div class="model-provider-management">
    <el-card>
      <div style="display: flex; align-items: flex-start; gap: 20px; margin-bottom: 10px; padding-top: 0;">
        <el-tabs v-model="activeTab" type="card" style="flex: 1;">
          <el-tab-pane label="模型平台" name="providers" />
          <el-tab-pane label="可选模型" name="models" />
        </el-tabs>
        
        <div style="display: flex; gap: 12px; align-items: center; flex: 1;">
          <el-input v-if="activeTab === 'providers'" v-model="searchKeyword" placeholder="平台名称/标识" clearable style="width: 220px;" />
          <el-input v-if="activeTab === 'models'" v-model="searchModelId" placeholder="模型标识" clearable style="width: 220px;" />
        </div>
        
        <el-button type="primary" @click="handleAdd" icon="Plus">添加模型平台</el-button>
      </div>
      
      <div v-show="activeTab === 'providers'">
        <el-table :data="filteredProviderList" style="width: 100%" border>
            <el-table-column prop="name" label="平台名称" width="180">
              <template #default="scope">
                <span style="cursor: pointer; color: #409eff;" @click="handleEdit(scope.row)">{{ scope.row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="code" label="平台标识" width="180">
              <template #default="scope">
                <span 
                  :style="{ cursor: scope.row.url ? 'pointer' : 'default', color: scope.row.url ? '#409eff' : 'inherit' }" 
                  @click="scope.row.url && openLink(scope.row.url)"
                >
                  {{ scope.row.code }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="Base URL" width="150">
              <template #default="scope">
                <div v-if="scope.row.openai_base_url || scope.row.anthropic_base_url || scope.row.protocol_base_url">
                  <div v-if="scope.row.openai_base_url" style="margin-bottom: 4px;">
                    <span style="font-weight: 500;">OpenAI</span>
                  </div>
                  <div v-if="scope.row.anthropic_base_url" style="margin-bottom: 4px;">
                    <span style="font-weight: 500;">Anthropic</span>
                  </div>
                  <div v-if="scope.row.protocol_base_url">
                    <span style="font-weight: 500;">兼容模式</span>
                  </div>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'enabled' ? 'success' : 'danger'">
                  {{ scope.row.status === 'enabled' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <el-button size="small" @click="handleEdit(scope.row)" :icon="Edit">编辑</el-button>
                  <el-button size="small" type="danger" @click="handleDelete(scope.row.id)" :icon="Delete">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
      </div>
      
      <div v-show="activeTab === 'models'">
        <el-table :data="filteredAllModels" style="width: 100%" border>
          <el-table-column prop="providerName" label="模型平台" width="180" />
          <el-table-column prop="modelId" label="模型标识" min-width="180" />
          <el-table-column prop="capability" label="模型说明" min-width="250" />
        </el-table>
      </div>
    </el-card>

    <!-- 添加/编辑模型提供商对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="formData"
        :rules="rules"
        ref="formRef"
        label-width="120px"
        class="model-provider-form"
      >
        <el-tabs v-model="dialogActiveTab" type="card" style="margin-bottom: 20px">
          <el-tab-pane label="基础信息" name="basic">
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
              <el-form-item label="平台名称" prop="name" required style="flex: 1;">
                <el-input v-model="formData.name" placeholder="请输入平台名称" />
              </el-form-item>
              <el-form-item label="平台标识" prop="code" required style="flex: 1;">
                <el-input v-model="formData.code" placeholder="请输入平台标识" />
              </el-form-item>
            </div>
            <el-form-item label="备注说明" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                placeholder="请输入备注说明"
                :rows="3"
              />
            </el-form-item>
            <el-form-item label="状态" prop="status" required>
              <el-select v-model="formData.status" placeholder="请选择状态">
                <el-option label="启用" value="enabled" />
                <el-option label="禁用" value="disabled" />
              </el-select>
            </el-form-item>

            <el-divider content-position="left">配置信息</el-divider>

            <el-form-item label="使用入口" prop="url">
              <div style="display: flex; align-items: center; gap: 10px; width: 100%">
                <el-input v-model="formData.url" placeholder="请输入使用入口" style="flex: 1;">
                  <template #append>
                    <el-button size="small" @click="copyToClipboard('url')" v-if="formData.url">
                      <el-icon><DocumentCopy /></el-icon>
                    </el-button>
                  </template>
                </el-input>
                <el-button 
                  size="small" 
                  type="primary" 
                  @click="openLink(formData.url)" 
                  v-if="formData.url"
                  plain
                >
                  打开链接
                </el-button>
              </div>
            </el-form-item>

            <el-divider content-position="left">Base URL</el-divider>

            <el-form-item label="OpenAI" prop="openai_base_url">
              <el-input v-model="formData.openai_base_url" placeholder="请输入OpenAI格式的Base URL">
                <template #append>
                  <el-button size="small" @click="copyToClipboard('openai_base_url')" v-if="formData.openai_base_url">
                    <el-icon><DocumentCopy /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="Anthropic" prop="anthropic_base_url">
              <el-input v-model="formData.anthropic_base_url" placeholder="请输入Anthropic格式的Base URL">
                <template #append>
                  <el-button size="small" @click="copyToClipboard('anthropic_base_url')" v-if="formData.anthropic_base_url">
                    <el-icon><DocumentCopy /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="兼容模式" prop="protocol_base_url">
              <el-input v-model="formData.protocol_base_url" placeholder="请输入兼容模式的Base URL">
                <template #append>
                  <el-button size="small" @click="copyToClipboard('protocol_base_url')" v-if="formData.protocol_base_url">
                    <el-icon><DocumentCopy /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>

            <el-divider content-position="left">常用链接</el-divider>

            <el-form-item label="常用链接" prop="common_links">
              <el-input
                v-model="formData.common_links"
                type="textarea"
                placeholder="请输入常用链接，每行一个"
                :rows="4"
                style="width: 100%"
              />
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="可选模型" name="models">
            <div style="display: flex; justify-content: space-between; align-items: left; margin-bottom: 20px; padding: 10px; background-color: #f5f7fa; border-radius: 4px;">
              <el-button type="primary" plain @click="addModel" size="small">
                <el-icon><Plus /></el-icon> 添加模型
              </el-button>
            </div>
            <el-form-item >
              <el-table :data="formData.models"  border style="width: 100%; margin-bottom: 20px; text-align: left;" stripe>
                <el-table-column label="模型标识" min-width="180" align="left">
                  <template #default="scope">
                    <el-input 
                      v-model="scope.row.modelId" 
                      placeholder="例如：gpt-4" 
                      :required="true"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="模型说明" min-width="250" align="left">
                  <template #default="scope">
                    <el-input v-model="scope.row.capability" placeholder="例如：通用对话" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100" align="center">
                  <template #default="scope">
                    <el-button size="small" type="danger" @click="removeModel(scope.$index)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
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
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Delete, DocumentCopy, Edit, Plus } from '@element-plus/icons-vue';
import { getModelProviders, createModelProvider, updateModelProvider, deleteModelProvider } from '../api/admin';

interface Model {
  modelId: string;
  capability: string;
}

interface ModelProvider {
  id: string;
  name: string;
  code: string;
  url: string;
  openai_base_url: string;
  anthropic_base_url: string;
  protocol_base_url: string;
  description: string;
  status: string;
  models: Model[];
  common_links?: string;
  created_at: string;
  updated_at: string;
}

const providerList = ref<ModelProvider[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('添加模型平台');
const formRef = ref();
const activeTab = ref('providers');
const dialogActiveTab = ref('basic');
const searchKeyword = ref('');
const searchModelId = ref('');

const filteredProviderList = computed(() => {
  let list = providerList.value;
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    list = list.filter(p => 
      p.name.toLowerCase().includes(keyword) || 
      p.code.toLowerCase().includes(keyword)
    );
  }
  
  return list;
});

const filteredAllModels = computed(() => {
  let list = allModels.value;
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    list = list.filter(m => 
      m.providerName.toLowerCase().includes(keyword)
    );
  }
  
  if (searchModelId.value) {
    const keyword = searchModelId.value.toLowerCase();
    list = list.filter(m => m.modelId.toLowerCase().includes(keyword));
  }
  
  return list;
});



// 收集所有平台的可选模型
const allModels = computed(() => {
  const models: any[] = [];
  providerList.value.forEach(provider => {
    if (provider.models && provider.models.length > 0) {
      provider.models.forEach((model: any) => {
        models.push({
          providerName: provider.name,
          modelId: model.modelId,
          capability: model.capability
        });
      });
    }
  });
  return models;
});

const formData = ref({
  name: '',
  code: '',
  url: '',
  openai_base_url: '',
  anthropic_base_url: '',
  protocol_base_url: '',
  description: '',
  status: 'enabled',
  common_links: '',
  models: [] as Model[]
});

const rules = {
  name: [{ required: true, message: '请输入平台名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入平台标识', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const currentProviderId = ref('');

// 获取模型提供商列表
const loadProviders = async () => {
  try {
    const response = await getModelProviders();
    providerList.value = response;
  } catch (error) {
    ElMessage.error('获取模型平台列表失败');
    console.error('Error loading providers:', error);
  }
};

// 添加模型提供商
const handleAdd = () => {
  dialogTitle.value = '添加模型平台';
  currentProviderId.value = '';
  Object.assign(formData.value, {
    name: '',
    code: '',
    url: '',
    openai_base_url: '',
    anthropic_base_url: '',
    protocol_base_url: '',
    description: '',
    status: 'enabled',
    common_links: '',
    models: []
  });
  dialogVisible.value = true;
};

// 编辑模型平台
const handleEdit = (row: ModelProvider) => {
  dialogTitle.value = '编辑模型平台';
  currentProviderId.value = row.id;
  Object.assign(formData.value, {
    name: row.name,
    code: row.code,
    url: row.url,
    openai_base_url: row.openai_base_url,
    anthropic_base_url: row.anthropic_base_url || '',
    protocol_base_url: row.protocol_base_url,
    description: row.description,
    status: row.status,
    common_links: row.common_links || '',
    models: row.models || []
  });
  dialogVisible.value = true;
};

// 删除模型平台
const handleDelete = async (id: string) => {
  try {
    await deleteModelProvider(id);
    ElMessage.success('模型平台删除成功');
    loadProviders();
  } catch (error) {
    ElMessage.error('删除模型平台失败');
    console.error('Error deleting provider:', error);
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    const emptyModelIds = formData.value.models.filter((model: Model) => !model.modelId.trim());
    if (emptyModelIds.length > 0) {
      ElMessage.error('请填写所有模型的模型标识');
      return;
    }
    
    // 检查重复的模型标识
    const duplicateModelIds = formData.value.models.filter((model: Model, index: number) => 
      formData.value.models.findIndex((m: Model) => m.modelId.trim() === model.modelId.trim()) !== index
    );
    if (duplicateModelIds.length > 0) {
      ElMessage.error('存在重复的模型标识');
      return;
    }
    
    if (currentProviderId.value) {
      await updateModelProvider(currentProviderId.value, formData.value);
      ElMessage.success('模型平台更新成功');
    } else {
      await createModelProvider(formData.value);
      ElMessage.success('模型平台创建成功');
    }
    
    dialogVisible.value = false;
    loadProviders();
  } catch (error) {
    ElMessage.error('操作失败');
    console.error('Error submitting form:', error);
  }
};

// 添加模型
const addModel = () => {
  formData.value.models.push({ modelId: '', capability: '' });
};

// 删除模型
const removeModel = (index: number) => {
  formData.value.models.splice(index, 1);
};

// 复制到剪贴板
const copyToClipboard = (field: string) => {
  const value = formData.value[field as keyof typeof formData.value];
  if (value) {
    navigator.clipboard.writeText(value.toString())
      .then(() => {
        ElMessage.success('复制成功');
      })
      .catch(() => {
        ElMessage.error('复制失败');
      });
  }
};

// 打开链接
const openLink = (url: string) => {
  if (url) {
    window.open(url, '_blank');
  }
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

.model-provider-form {
  max-height: 600px;
  overflow-y: auto;
}



/* 自定义滚动条 */
.model-provider-form::-webkit-scrollbar {
  width: 6px;
}

.model-provider-form::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.model-provider-form::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.model-provider-form::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>