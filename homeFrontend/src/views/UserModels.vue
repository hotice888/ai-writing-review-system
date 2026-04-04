<template>
  <div class="user-models-container">
    <el-card class="user-models-card">      
      <!-- 模型列表 -->
      <div class="model-list-section">
        <div class="list-header">
          <span style="font-weight: 600;">我的模型</span>
          <div class="search-box">
            <el-input v-model="searchKeyword" placeholder="请输入模型平台" style="width: 200px; margin-left: 10px;" />
            <!-- <el-button type="primary" plain @click="loadUserModels" style="margin-left: 10px;">搜索</el-button> -->
            <el-button type="primary" @click="handleAddModel" style="margin-left: 10px;" icon="Plus">添加模型</el-button>
          </div>
        </div>
        
        <el-table :data="filteredModelList" style="width: 100%" border>
          <el-table-column prop="name" label="模型平台" width="250" />
          <el-table-column prop="anthropic_api_url" label="Anthropic URL" show-overflow-tooltip />
          <el-table-column prop="openai_api_url" label="OpenAI URL" show-overflow-tooltip />
          <el-table-column prop="api_key" label="API Key" width="120">
            <template #default="scope">
              <el-button size="small" type="primary" @click="showApiKey(scope.row.api_key)">查看</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" show-overflow-tooltip width="120" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'enabled' ? 'success' : 'danger'">
                {{ scope.row.status === 'enabled' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="handleEdit(scope.row)" icon="Edit">编辑</el-button>
              <el-button size="small" @click="toggleStatus(scope.row)" :type="scope.row.status === 'enabled' ? 'warning' : 'success'" style="margin-left: 5px;">
                {{ scope.row.status === 'enabled' ? '禁用' : '启用' }}
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row.id)" style="margin-left: 5px;">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination" v-if="total > 0">
          <el-pagination
            background
            layout="prev, pager, next, jumper"
            :total="total"
            :page-size="pageSize"
            :current-page="currentPage"
            @current-change="handlePageChange"
            style="margin-top: 20px; text-align: right;"
          />
        </div>
      </div>
    </el-card>

    <!-- 添加/编辑模型对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1000px"
      :close-on-click-modal="false"
    >
      <div class="dialog-content" >
        <!-- 左侧表单 -->
        <div class="form-section">
          <el-form :model="formData" label-width="80px">
            <el-form-item label="模型平台">
              <el-select 
                v-model="formData.model_provider_id" 
                placeholder="请选择模型平台（可选）" 
                style="width: 100%;" 
                clearable
                :disabled="isModelProviderDisabled"
                @change="handleModelProviderChange"
              >
                <el-option 
                  v-for="provider in enabledModelProviders" 
                  :key="provider.id" 
                  :label="provider.name" 
                  :value="provider.id" 
                />
              </el-select>
              
            </el-form-item>
            
            <el-form-item label="模型名称">
              <template #label>
                <span style="display: flex; align-items: center;">
                  模型名称
                  <span style="color: #f56c6c; margin-left: 4px;">*</span>
                </span>
              </template>
              <el-input v-model="formData.name" placeholder="请输入模型名称" style="width: 100%;" />
            </el-form-item>
            
            <el-form-item label="模型标识">
              <template #label>
                <span style="display: flex; align-items: center;">
                  模型标识
                  </span>
              </template>
              <div class="model-identifier-row">
                <el-input v-model="tempModelIdentifier" placeholder="请输入模型标识" style="flex: 1;" />
                <el-button type="primary" @click="handleAddModelIdentifier" :disabled="!tempModelIdentifier">添加</el-button>
                <el-button type="primary" @click="testCurrentModel" :disabled="!tempModelIdentifier">测试</el-button>
              </div>
            </el-form-item>
           
            <el-form-item label="Anthropic">
              <template #label>
                <span style="display: flex; align-items: center;">
                  BaseURL
                  <span style="color: #f56c6c; margin-left: 4px;">*</span>
                </span>
              </template>
              <el-input 
                v-model="formData.anthropic_api_url" 
                placeholder="请输入BaseURL[优先AnthropicAPI]" 
                style="width: 100%;" 
                :disabled="formData.anthropic_api_flag && formData.anthropic_api_url"
              />
            </el-form-item>
            
            <el-form-item label="OpenAI">
              <template #label>
                <span style="display: flex; align-items: center;">
                  OpenAI
                </span>
              </template>
              <el-input 
                v-model="formData.openai_api_url" 
                placeholder="OpenAI API URL与Anthropic的不同时填写" 
                style="width: 100%;" 
                :disabled="formData.openai_api_flag && formData.openai_api_url"
              />
            </el-form-item>
            
            <el-form-item label="API Key">
              <template #label>
                <span style="display: flex; align-items: center;">
                  API Key
                  <span style="color: #f56c6c; margin-left: 4px;">*</span>
                </span>
              </template>
              <div style="display: flex; gap: 10px; width: 100%;">
                <el-input 
                  v-model="apiKeyDisplay" 
                  placeholder="请输入API Key" 
                  style="flex: 1;"
                  @input="handleApiKeyInput"
                />
                <el-button @click="toggleApiKeyVisibility">
                  {{ apiKeyVisible ? '隐藏' : '查看' }}
                </el-button>
              </div>
            </el-form-item>
            
            <!-- 测试结果 -->
            <el-form-item label="测试结果">
              <el-input v-model="testResult" placeholder="测试结果将显示在这里" type="textarea" :rows="4" readonly style="width: 100%; vertical-align: top;" />
            </el-form-item>
          </el-form>
        </div>
        
        <!-- 右侧模型列表 -->
        <div class="model-list-side">
          <div class="side-header">
            <span style="font-weight: 600;">模型列表</span>
          </div>
          <div class="model-table-container">
            <el-table :key="tableKey" :data="validModelConfigs" style="width: 100%" border max-height="400">
              <el-table-column prop="model_identifier" label="模型标识" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'connected' ? 'success' : 'warning'" size="small">
                    {{ scope.row.status === 'connected' ? '已连通' : '未测试' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140">
                <template #default="scope">
                  <el-button size="small" type="primary" @click="testModelConfig(scope.row)">测试</el-button>
                  <el-button size="small" type="danger" @click="deleteModelConfig(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
      
      <template #footer >
        <span class="dialog-footer" >
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
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
    
    <!-- 模型平台选择对话框 -->
    <el-dialog
      v-model="modelSelectorVisible"
      title="选择模型平台"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="model-selector-search" style="margin-bottom: 15px;">
        <el-input v-model="modelSearchKeyword" placeholder="按模型平台或模型标识模糊搜索" style="width: 400px;" />
        <el-button type="primary" plain @click="filterAvailableModels" style="margin-left: 10px;">搜索</el-button>
      </div>
      <el-table 
        :data="paginatedModels" 
        style="width: 100%" 
        border 
        @row-click="handleRowClick"
        @row-dblclick="handleRowDblClick"
      >
        <el-table-column width="55" align="center">
          <template #default="scope">
            <el-radio 
              v-model="selectedModelId" 
              :label="scope.row.id" 
              @change="handleRadioChange(scope.row)"
              class="radio-only"
            >
              <span style="display: none;"></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column prop="providerName" label="模型平台" width="200" />
        <el-table-column prop="modelId" label="模型标识" min-width="250" />
        <el-table-column prop="capability" label="模型说明" min-width="300" />
      </el-table>
      <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="modelCurrentPage"
          v-model:page-size="modelPageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredAvailableModels.length"
          @size-change="handleModelSizeChange"
          @current-change="handleModelCurrentChange"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="modelSelectorVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmModelSelection" :disabled="selectedModel === null">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserModels, createUserModel, updateUserModel, deleteUserModel, getModelProviders, testModel as testModelApi, createModelProvider, updateModelProvider, getUserModelById as getUserModelByIdApi, getModelConfigs, createModelConfig, updateModelConfig, deleteModelConfig as deleteModelConfigApi } from '../api/userModels';
import request from '../utils/request';

// 响应式数据
const userModelList = ref([]);
const dialogVisible = ref(false);
const platformModelDialogVisible = ref(false);
const apiKeyDialogVisible = ref(false);
const modelSelectorVisible = ref(false);
const dialogTitle = ref('添加模型');
const currentModelId = ref('');
const searchKeyword = ref('');
const testResult = ref('');
const modelProviders = ref([]);
const modelSearchKeyword = ref('');
const selectedModel = ref(null);
const selectedModelId = ref('');
const allAvailableModels = ref([]);
const apiKeyVisible = ref(false);
const apiKeyDisplay = ref('');
const tempModelIdentifier = ref('');
const modelConfigs = ref([]);
const tableKey = ref(0);

// 分页数据
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 模型选择对话框分页
const modelCurrentPage = ref(1);
const modelPageSize = ref(10);

// 表单数据
const formData = reactive({
  name: '',
  model_provider_id: '',
  api_key: '',
  description: '',
  status: 'enabled',
  openai_api_url: '',
  openai_api_key: '',
  anthropic_api_url: '',
  anthropic_api_flag: false,
  openai_api_flag: false
});

// API Key查看表单
const apiKeyForm = reactive({
  key: ''
});

// 过滤后的可选模型列表
const filteredAvailableModels = computed(() => {
  if (!modelSearchKeyword.value) {
    return allAvailableModels.value;
  }
  const keyword = modelSearchKeyword.value.toLowerCase();
  return allAvailableModels.value.filter(model => 
    model.providerName.toLowerCase().includes(keyword) || 
    model.modelId.toLowerCase().includes(keyword)
  );
});

// 分页后的模型列表
const paginatedModels = computed(() => {
  const start = (modelCurrentPage.value - 1) * modelPageSize.value;
  const end = start + modelPageSize.value;
  return filteredAvailableModels.value.slice(start, end);
});

// 过滤后的模型列表
const filteredModelList = computed(() => {
  let list = userModelList.value;
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    list = list.filter(model => 
      model.name.toLowerCase().includes(keyword)
    );
  }
  
  // 分页
  total.value = list.length;
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return list.slice(start, end);
});

// 模型平台下拉框是否禁用
const isModelProviderDisabled = computed(() => {
  // 只有在编辑模式（currentModelId 存在）且已选择模型平台时才禁用
  return !!currentModelId.value && !!formData.model_provider_id;
});

// 过滤后的模型平台列表（只显示启用的）
const enabledModelProviders = computed(() => {
  return modelProviders.value.filter(provider => provider.status === 'enabled');
});

// 有效的模型配置列表
const validModelConfigs = computed(() => {
  return modelConfigs.value.filter(c => c && c.model_identifier);
});

// 选择模型平台后的处理
const handleModelProviderChange = (providerId) => {
  if (!providerId) {
    return;
  }
  
  const selectedProvider = modelProviders.value.find(p => p.id === providerId);
  if (selectedProvider) {
    // 填充 Anthropic URL
    formData.anthropic_api_url = selectedProvider.anthropic_base_url || '';
    formData.anthropic_api_flag = !!selectedProvider.anthropic_base_url;
    
    // 填充 OpenAI URL
    formData.openai_api_url = selectedProvider.openai_base_url || '';
    formData.openai_api_flag = !!selectedProvider.openai_base_url;
  }
};

// 加载模型平台
const loadModelProviders = async () => {
  try {
    const response = await getModelProviders();
    const providers = response.data || response;
    modelProviders.value = providers;
    
    // 构建可选模型列表，只包含状态为enabled的模型平台的模型
    allAvailableModels.value = [];
    providers.forEach(provider => {
      // 只处理状态为enabled的模型平台
      if (provider.status === 'enabled' && provider.models && Array.isArray(provider.models)) {
        provider.models.forEach((model, index) => {
          allAvailableModels.value.push({
            id: `${provider.id}-${index}`,
            providerId: provider.id,
            providerName: provider.name,
            modelId: model.modelId || model.model_id,
            capability: model.capability || model.memo,
            openaiBaseUrl: provider.openai_base_url || '',
            anthropicBaseUrl: provider.anthropic_base_url || ''
          });
        });
      }
    });
  } catch (error) {
    console.error('加载模型平台失败:', error);
  }
};

// 加载用户模型
const loadUserModels = async () => {
  try {
    console.log('开始加载用户模型...');
    const response = await getUserModels();
    console.log('加载用户模型成功:', response);
    userModelList.value = response.data || response;
  } catch (error) {
    ElMessage.error('加载用户模型失败');
    console.error('Error loading user models:', error);
  }
};

// 添加模型
const handleAddModel = () => {
  dialogTitle.value = '添加模型';
  currentModelId.value = '';
  apiKeyVisible.value = false;
  tempModelIdentifier.value = '';
  modelConfigs.value = [];
  // 重置表单
  Object.assign(formData, {
    name: '',
    model_provider_id: '',
    api_key: '',
    description: '',
    status: 'enabled',
    openai_api_url: '',
    openai_api_key: '',
    anthropic_api_url: '',
    anthropic_api_flag: false,
    openai_api_flag: false
  });
  apiKeyDisplay.value = '';
  testResult.value = '';
  dialogVisible.value = true;
};

// 编辑模型
const handleEdit = async (model) => {
  dialogTitle.value = '编辑模型';
  currentModelId.value = model.id;
  apiKeyVisible.value = false;
  tempModelIdentifier.value = '';
  
  // 填充表单数据
  Object.assign(formData, {
    name: model.name,
    model_provider_id: model.model_provider_id || '',
    api_key: model.api_key || '',
    description: model.description || '',
    status: model.status,
    openai_api_url: model.openai_api_url || '',
    openai_api_key: model.api_key || '',
    anthropic_api_url: model.anthropic_api_url || '',
    anthropic_api_flag: model.anthropic_api_flag || false,
    openai_api_flag: model.openai_api_flag || false
  });
  
  // 加载模型配置
  try {
    let configs;
    if (model.configs) {
      configs = model.configs;
    } else {
      const response = await getModelConfigs(model.id);
      configs = response.data || response;
    }
    // 过滤掉 undefined 元素，并确保每个配置项都是有效的
    modelConfigs.value = Array.isArray(configs) ? configs.filter(c => c && c.model_identifier) : [];
    // 更新 tableKey 强制刷新表格
    tableKey.value++;
  } catch (error) {
    console.error('加载模型配置失败:', error);
    modelConfigs.value = [];
    // 更新 tableKey 强制刷新表格
    tableKey.value++;
  }
  
  apiKeyDisplay.value = maskApiKey(model.api_key || '');
  testResult.value = '';
  dialogVisible.value = true;
};

// 添加模型标识
const handleAddModelIdentifier = async () => {
  console.log('点击添加按钮');
  console.log('tempModelIdentifier:', tempModelIdentifier.value);
  console.log('modelConfigs before:', modelConfigs.value);
  
  if (!tempModelIdentifier.value.trim()) {
    ElMessage.warning('请输入模型标识');
    return;
  }
  
  // 检查是否已存在
  const exists = modelConfigs.value.some(c => c && c.model_identifier === tempModelIdentifier.value);
  if (exists) {
    ElMessage.warning('该模型标识已存在');
    return;
  }
  
  if (currentModelId.value) {
    // 已有模型ID，直接调用API
    try {
      const response = await createModelConfig(currentModelId.value, {
        model_identifier: tempModelIdentifier.value
      });
      console.log('API 响应:', response);
      const newConfig = response.data || response;
      console.log('添加的新配置:', newConfig);
      // 使用展开运算符创建新数组，确保响应式更新
      modelConfigs.value = [...modelConfigs.value, newConfig];
      console.log('更新后的 modelConfigs:', modelConfigs.value);
      // 更新 tableKey 强制刷新表格
      tableKey.value++;
      ElMessage.success('添加成功');
      tempModelIdentifier.value = '';
    } catch (error) {
      console.error('添加失败:', error);
      ElMessage.error(error.response?.data?.message || '添加失败');
    }
  } else {
    // 新模型，先添加到临时列表
    const newConfig = {
      id: `temp-${Date.now()}`,
      model_identifier: tempModelIdentifier.value,
      status: 'untested'
    };
    console.log('Adding new config:', newConfig);
    // 使用展开运算符创建新数组，确保响应式更新
    modelConfigs.value = [...modelConfigs.value, newConfig];
    console.log('modelConfigs after:', modelConfigs.value);
    // 更新 tableKey 强制刷新表格
    tableKey.value++;
    ElMessage.success('添加成功');
    tempModelIdentifier.value = '';
  }
};

// 删除模型配置
const deleteModelConfig = async (configId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个模型标识吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    if (currentModelId.value && !configId.startsWith('temp-')) {
      await deleteModelConfigApi(currentModelId.value, configId);
    }
    
    modelConfigs.value = modelConfigs.value.filter(c => c && c.id !== configId);
    // 更新 tableKey 强制刷新表格
    tableKey.value++;
    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 测试当前输入的模型标识（同时测试URL连通性）
const testCurrentModel = async () => {
  if (!tempModelIdentifier.value.trim()) {
    ElMessage.warning('请输入模型标识');
    return;
  }
  
  if (!formData.anthropic_api_url) {
    ElMessage.error('请填写Anthropic BaseURL');
    return;
  }
  
  if (formData.openai_api_url && formData.openai_api_url === formData.anthropic_api_url) {
    ElMessage.error('OpenAI URL不能与Anthropic URL相同');
    return;
  }
  
  if (!formData.openai_api_key) {
    ElMessage.error('请填写API Key');
    return;
  }
  
  const model = tempModelIdentifier.value;
  let testResults = [];
  let anySuccess = false;
  
  testResult.value = '正在测试...';
  
  // 测试Anthropic URL（必填）
  if (formData.anthropic_api_url) {
    try {
      testResult.value = `正在测试 ${model} (Anthropic)...`;
      const result = await testModelApi({
        model_id: currentModelId.value,
        openai_api_url: '',
        anthropic_api_url: formData.anthropic_api_url,
        api_key: formData.openai_api_key,
        model: model,
        messages: [
          {
            role: 'user',
            content: '你好'
          }
        ],
        business_type: '连通测试',
        params: {
          max_tokens: 10
        }
      });
      formData.anthropic_api_flag = true;
      testResults.push('✓ BaseURL[Anthropic]测试通过');
      anySuccess = true;
    } catch (error) {
      formData.anthropic_api_flag = false;
      testResults.push('✗ [Anthropic]测试失败: ' + (error.message || '未知错误'));
    }
  }
  
  // 测试OpenAI URL（只有在非空且与Anthropic不同时才测试）
  if (formData.openai_api_url && formData.openai_api_url !== formData.anthropic_api_url) {
    try {
      testResult.value = `正在测试 ${model} (OpenAI)...`;
      const result = await testModelApi({
        model_id: currentModelId.value,
        openai_api_url: formData.openai_api_url,
        anthropic_api_url: '',
        api_key: formData.openai_api_key,
        model: model,
        messages: [
          {
            role: 'user',
            content: '你好'
          }
        ],
        business_type: '连通测试',
        params: {
          max_tokens: 10
        }
      });
      formData.openai_api_flag = true;
      testResults.push('✓ OpenAI URL测试通过');
      anySuccess = true;
    } catch (error) {
      formData.openai_api_flag = false;
      testResults.push('✗ OpenAI URL测试失败: ' + (error.message || '未知错误'));
    }
  }
  
  testResult.value = testResults.join('\n');
  
  if (anySuccess) {
    ElMessage.success('测试完成');
  } else {
    ElMessage.warning('所有URL测试都失败');
  }
};

// 测试模型配置（同时测试URL连通性）
const testModelConfig = async (config) => {
  if (!formData.anthropic_api_url) {
    ElMessage.error('请填写Anthropic BaseURL');
    return;
  }
  
  if (formData.openai_api_url && formData.openai_api_url === formData.anthropic_api_url) {
    ElMessage.error('OpenAI URL不能与Anthropic URL相同');
    return;
  }
  
  if (!formData.openai_api_key) {
    ElMessage.error('请先填写API Key');
    return;
  }
  
  const apiKey = formData.openai_api_key;
  const model = config.model_identifier;
  let testResults = [];
  let anySuccess = false;
  
  testResult.value = `正在测试 ${model}...`;
  
  // 测试Anthropic URL（必填）
  if (formData.anthropic_api_url) {
    try {
      testResult.value = `正在测试 ${model} (Anthropic)...`;
      const result = await testModelApi({
        model_id: currentModelId.value,
        openai_api_url: '',
        anthropic_api_url: formData.anthropic_api_url,
        api_key: apiKey,
        model: model,
        messages: [
          {
            role: 'user',
            content: '你好'
          }
        ],
        business_type: '连通测试',
        params: {
          max_tokens: 50
        }
      });
      formData.anthropic_api_flag = true;
      testResults.push('✓ Anthropic URL测试通过');
      anySuccess = true;
    } catch (error) {
      formData.anthropic_api_flag = false;
      testResults.push('✗ Anthropic URL测试失败: ' + (error.message || '未知错误'));
    }
  }
  
  // 测试OpenAI URL（只有在非空且与Anthropic不同时才测试）
  if (formData.openai_api_url && formData.openai_api_url !== formData.anthropic_api_url) {
    try {
      testResult.value = `正在测试 ${model} (OpenAI)...`;
      const result = await testModelApi({
        model_id: currentModelId.value,
        openai_api_url: formData.openai_api_url,
        anthropic_api_url: '',
        api_key: apiKey,
        model: model,
        messages: [
          {
            role: 'user',
            content: '你好'
          }
        ],
        business_type: '连通测试',
        params: {
          max_tokens: 50
        }
      });
      formData.openai_api_flag = true;
      testResults.push('✓ OpenAI URL测试通过');
      anySuccess = true;
    } catch (error) {
      formData.openai_api_flag = false;
      testResults.push('✗ OpenAI URL测试失败: ' + (error.message || '未知错误'));
    }
  }
  
  // 更新状态（只要有一个URL测试通过就算成功）
  if (anySuccess) {
    config.status = 'connected';
    if (currentModelId.value && !config.id.startsWith('temp-')) {
      await updateModelConfig(currentModelId.value, config.id, { status: 'connected' });
    }
    ElMessage.success('测试成功，状态已更新为已连通');
  } else {
    config.status = 'untested';
    ElMessage.warning('所有URL测试都失败');
  }
  
  testResult.value = testResults.join('\n');
};

// 掩码API Key
const maskApiKey = (key) => {
  if (!key) return '';
  if (key.length <= 8) return key;
  return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
};

// 处理API Key输入
const handleApiKeyInput = (value) => {
  if (apiKeyVisible.value) {
    formData.openai_api_key = value;
    apiKeyDisplay.value = value;
  } else {
    formData.openai_api_key = value;
    apiKeyDisplay.value = maskApiKey(value);
  }
};

// 切换API Key可见性
const toggleApiKeyVisibility = () => {
  apiKeyVisible.value = !apiKeyVisible.value;
  if (apiKeyVisible.value) {
    apiKeyDisplay.value = formData.openai_api_key;
  } else {
    apiKeyDisplay.value = maskApiKey(formData.openai_api_key);
  }
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
    console.log('Model configs:', modelConfigs.value);
    
    // 验证表单数据
    if (!formData.name) {
      ElMessage.error('请填写模型名称');
      return;
    }
    if (!formData.anthropic_api_url) {
      ElMessage.error('请填写Anthropic BaseURL');
      return;
    }
    if (!formData.openai_api_key) {
      ElMessage.error('请填写API Key');
      return;
    }
    
    const modelData = {
      name: formData.name,
      model_provider_id: formData.model_provider_id || null,
      api_key: formData.openai_api_key || formData.api_key || '',
      openai_api_url: formData.openai_api_url || '',
      anthropic_api_url: formData.anthropic_api_url || '',
      anthropic_api_flag: formData.anthropic_api_flag,
      openai_api_flag: formData.openai_api_flag,
      description: formData.description,
      status: formData.status,
      configs: modelConfigs.value
        .filter(c => c && c.model_identifier)
        .map(c => ({
          model_identifier: c.model_identifier,
          status: c.status
        }))
    };
    
    if (currentModelId.value) {
      // 更新模型
      console.log('更新模型:', currentModelId.value);
      await updateUserModel(currentModelId.value, modelData);
      ElMessage.success('更新成功');
    } else {
      // 创建模型
      console.log('创建模型');
      await createUserModel(modelData);
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

// 打开模型选择器
const openModelSelector = async () => {
  modelSearchKeyword.value = '';
  selectedModel.value = null;
  selectedModelId.value = '';
  modelCurrentPage.value = 1;
  modelPageSize.value = 10;
  
  // 重新加载模型数据，确保获取最新的模型列表
  await loadModelProviders();
  
  modelSelectorVisible.value = true;
};

// 处理行点击
const handleRowClick = (row) => {
  selectedModelId.value = row.id;
  selectedModel.value = row;
};

// 处理单选框变化
const handleRadioChange = (row) => {
  selectedModel.value = row;
};

// 处理行双击 - 确认选择
const handleRowDblClick = (row) => {
  selectedModelId.value = row.id;
  selectedModel.value = row;
  confirmModelSelection();
};

// 处理模型选择对话框分页大小变化
const handleModelSizeChange = (size) => {
  modelPageSize.value = size;
  modelCurrentPage.value = 1;
};

// 处理模型选择对话框当前页码变化
const handleModelCurrentChange = (current) => {
  modelCurrentPage.value = current;
};

// 过滤可选模型
const filterAvailableModels = () => {
  modelCurrentPage.value = 1;
};

// 确认模型选择
const confirmModelSelection = () => {
  if (!selectedModel.value) {
    ElMessage.warning('请选择一个模型');
    return;
  }
  
  const model = selectedModel.value;
  formData.name = model.providerName;
  tempModelIdentifier.value = model.modelId;
  
  // 获取BaseURL，优先使用OpenAI或Anthropic，没有则使用兼容模式
  if (model.openaiBaseUrl) {
    formData.openai_api_url = model.openaiBaseUrl;
  }
  if (model.anthropicBaseUrl) {
    formData.anthropic_api_url = model.anthropicBaseUrl;
  }
  if (!model.openaiBaseUrl && !model.anthropicBaseUrl && model.protocolBaseUrl) {
    formData.openai_api_url = model.protocolBaseUrl;
    formData.anthropic_api_url = model.protocolBaseUrl;
  }
  
  // 更新API Key显示
  if (apiKeyVisible.value) {
    apiKeyDisplay.value = formData.openai_api_key;
  } else {
    apiKeyDisplay.value = maskApiKey(formData.openai_api_key);
  }
  
  modelSelectorVisible.value = false;
};

// 切换模型状态
const toggleStatus = async (model) => {
  try {
    const newStatus = model.status === 'enabled' ? 'disabled' : 'enabled';
    await updateUserModel(model.id, { ...model, status: newStatus });
    ElMessage.success(`模型已${newStatus === 'enabled' ? '启用' : '禁用'}`);
    model.status = newStatus;
  } catch (error) {
    ElMessage.error('更新状态失败');
    console.error('Error toggling status:', error);
  }
};

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page;
};

// 生命周期钩子
onMounted(() => {
  loadUserModels();
  loadModelProviders();
});
</script>

<style scoped>
:deep(.el-textarea__inner) {
  vertical-align: top;
  resize: vertical;
}

.user-models-container {
  padding: 10px;
}

.radio-only :deep(.el-radio__label) {
  display: none;
}

.user-models-card {
  margin-bottom: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-list-section {
  margin-top: 10px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.search-box {
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}
:deep(.el-dialog__header) {
  padding: 10px;
}
:deep(.el-dialog__body) {
  padding: 5px;
}

:deep(.el-dialog__footer) {
  padding-top: 5px;
}

.dialog-content {
  display: flex;
  gap: 30px;
  width: 100%;
}

.form-section {
  flex: 0 0 50%;
  min-width: 0;
}

.model-list-side {
  flex: 0 0 calc(50% - 10px);
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e4e7ed;
  padding-left: 10px;
  min-width: 0;
}

.side-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.model-table-container {
  flex: 1;
  overflow-y: auto;
  min-height: 300px;
}

.model-identifier-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: nowrap;
}

.model-identifier-row .el-input {
  min-width: 200px;
}

.model-table-container :deep(.el-table__body-wrapper) {
  max-height: 400px;
  overflow-y: auto;
}
</style>
