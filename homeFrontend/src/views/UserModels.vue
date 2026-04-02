<template>
  <div class="user-models-container">
    <el-card class="user-models-card">
      <template #header>
        <div class="card-header">
          <span>我的模型</span>
        </div>
      </template>
      
      <!-- 模型列表 -->
      <div class="model-list-section">
        <div class="list-header">
          <span style="font-weight: 600;">模型列表</span>
          <div class="search-box">
            <span>查询条件：</span>
            <el-input v-model="searchKeyword" placeholder="请输入模型名称或标识" style="width: 200px; margin-left: 10px;" />
            <el-button type="primary" plain @click="loadUserModels" style="margin-left: 10px;">搜索</el-button>
            <el-button type="primary" @click="handleAddModel" style="margin-left: 10px;" icon="Plus">添加模型</el-button>
          </div>
        </div>
        
        <el-table :data="filteredModelList" style="width: 100%" border>
          <el-table-column prop="name" label="模型名称" width="150" />
          <el-table-column prop="model" label="模型标识" width="200" />
          <el-table-column prop="api_url" label="API URL" show-overflow-tooltip />
          <el-table-column prop="api_key" label="API Key" width="120">
            <template #default="scope">
              <el-button size="small" type="primary" @click="showApiKey(scope.row.api_key)">查看</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" show-overflow-tooltip width="150" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'enabled' ? 'success' : 'danger'">
                {{ scope.row.status === 'enabled' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250" fixed="right">
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
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="可选模型">
          <el-button type="primary" plain @click="openModelSelector" style="width: 100%;">
            从模型提供商选择
          </el-button>
        </el-form-item>
        
        <el-form-item label="模型名称">
          <template #label>
            <span style="display: flex; align-items: center;">
              模型名称
              <span style="color: #f56c6c; margin-left: 4px;">*</span>
            </span>
          </template>
          <el-input v-model="formData.name" placeholder="模型提供商名称-模型标识" style="width: 600px;" />
        </el-form-item>
        
        <el-form-item label="模型标识">
          <template #label>
            <span style="display: flex; align-items: center;">
              模型标识
              <span style="color: #f56c6c; margin-left: 4px;">*</span>
            </span>
          </template>
          <el-input v-model="formData.model" placeholder="请输入模型标识" style="width: 600px;" />
        </el-form-item>
        
        <el-divider content-position="left">BaseURL</el-divider>
        
        <el-form-item label="Anthropic">
          <template #label>
            <span style="display: flex; align-items: center;">
              Anthropic
              <span style="color: #f56c6c; margin-left: 4px;">*</span>
            </span>
          </template>
          <el-input v-model="formData.anthropic_api_url" placeholder="请输入Anthropic BaseURL" style="width: 600px;" />
        </el-form-item>
        
        <el-form-item label="OpenAI">
          <template #label>
            <span style="display: flex; align-items: center;">
              OpenAI
            </span>
          </template>
          <el-input v-model="formData.openai_api_url" placeholder="请输入OpenAI BaseURL" style="width: 600px;" />
        </el-form-item>
        
        <el-form-item label="API Key">
          <template #label>
            <span style="display: flex; align-items: center;">
              API Key
              <span style="color: #f56c6c; margin-left: 4px;">*</span>
            </span>
          </template>
          <div style="display: flex; gap: 10px; width: 600px;">
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
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" @click="testModel">测试</el-button>
        </div>
        
        <!-- 测试结果 -->
        <el-form-item label="测试结果">
          <el-input v-model="testResult" placeholder="测试结果将显示在这里" type="textarea" :rows="3" readonly style="width: 600px; vertical-align: top;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
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
    
    <!-- 模型选择对话框 -->
    <el-dialog
      v-model="modelSelectorVisible"
      title="选择模型"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="model-selector-search" style="margin-bottom: 15px;">
        <el-input v-model="modelSearchKeyword" placeholder="按提供商或模型标识模糊搜索" style="width: 400px;" />
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
        <el-table-column prop="providerName" label="提供商" width="200" />
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
import { getUserModels, createUserModel, updateUserModel, deleteUserModel, getModelProviders, testModel as testModelApi, createModelProvider, updateModelProvider, getUserModelById as getUserModelByIdApi } from '../api/userModels';
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
  code: '',
  provider: '',
  model: '',
  api_url: '',
  api_key: '',
  description: '',
  status: 'enabled',
  openai_api_url: '',
  openai_api_key: '',
  anthropic_api_url: ''
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
      model.name.toLowerCase().includes(keyword) || 
      model.model.toLowerCase().includes(keyword)
    );
  }
  
  // 分页
  total.value = list.length;
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return list.slice(start, end);
});

// 加载模型提供商
const loadModelProviders = async () => {
  try {
    const response = await getModelProviders();
    const providers = response.data || response;
    modelProviders.value = providers;
    
    // 构建可选模型列表，只包含状态为enabled的提供商的模型
    allAvailableModels.value = [];
    providers.forEach(provider => {
      // 只处理状态为enabled的提供商
      if (provider.status === 'enabled' && provider.models && Array.isArray(provider.models)) {
        provider.models.forEach((model, index) => {
          allAvailableModels.value.push({
            id: `${provider.id}-${index}`, // 生成唯一ID
            providerId: provider.id,
            providerName: provider.name,
            brand: model.brand || model.name,
            modelId: model.modelId || model.model_id,
            capability: model.capability || model.memo,
            openaiBaseUrl: provider.openai_base_url || '',
            anthropicBaseUrl: provider.anthropic_base_url || '',
            protocolBaseUrl: provider.protocol_base_url || ''
          });
        });
      }
    });
  } catch (error) {
    console.error('加载模型提供商失败:', error);
  }
};

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

// 添加模型
const handleAddModel = () => {
  console.log('点击添加模型按钮');
  dialogTitle.value = '添加模型';
  currentModelId.value = '';
  apiKeyVisible.value = false;
  // 重置表单
  Object.assign(formData, {
    name: '',
    code: '',
    provider: '',
    model: '',
    api_url: '',
    api_key: '',
    description: '',
    status: 'enabled',
    openai_api_url: '',
    openai_api_key: '',
    anthropic_api_url: ''
  });
  apiKeyDisplay.value = '';
  testResult.value = '';
  console.log('打开添加模型对话框');
  dialogVisible.value = true;
};

// 编辑模型
const handleEdit = (model) => {
  dialogTitle.value = '编辑模型';
  currentModelId.value = model.id;
  apiKeyVisible.value = false;
  // 填充表单数据
  Object.assign(formData, {
    name: model.name,
    code: model.code,
    provider: model.provider,
    model: model.model,
    api_url: model.api_url || '',
    api_key: model.api_key || '',
    description: model.description || '',
    status: model.status,
    openai_api_url: model.api_url || '',
    openai_api_key: model.api_key || '',
    anthropic_api_url: model.api_url || ''  // 同时填充anthropic_api_url
  });
  apiKeyDisplay.value = maskApiKey(model.api_key || '');
  testResult.value = '';
  dialogVisible.value = true;
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
    
    // 验证表单数据 - 如果没有选择模型，则所有字段必填
    if (!formData.name) {
      ElMessage.error('请填写模型名称');
      return;
    }
    if (!formData.model) {
      ElMessage.error('请填写模型标识');
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
      code: formData.code || formData.name.toLowerCase().replace(/\s+/g, '-'),
      provider: formData.provider || 'custom',
      model: formData.model || 'custom',
      api_url: formData.openai_api_url || formData.anthropic_api_url || formData.api_url || '',
      api_key: formData.openai_api_key || formData.api_key || '',
      openai_api_url: formData.openai_api_url || '',
      anthropic_api_url: formData.anthropic_api_url || '',
      description: formData.description,
      status: formData.status
    };
    
    if (currentModelId.value) {
      // 更新模型
      console.log('更新模型:', currentModelId.value);
      await updateUserModel(currentModelId.value, modelData);
      ElMessage.success('更新成功');
    } else {
      // 创建模型
      console.log('创建模型');
      console.log('Token:', localStorage.getItem('token'));
      console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
      const result = await createUserModel(modelData);
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
  // computed属性会自动处理
  modelCurrentPage.value = 1; // 搜索后重置页码
};

// 确认模型选择
const confirmModelSelection = () => {
  if (!selectedModel.value) {
    ElMessage.warning('请选择一个模型');
    return;
  }
  
  const model = selectedModel.value;
  formData.name = model.providerName + '-' + model.modelId;
  formData.model = model.modelId;
  
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

// 测试模型
const testModel = async () => {
  try {
    testResult.value = '测试中...';
    
    if (currentModelId.value) {
      const result = await testModelApi({
        model_id: currentModelId.value,
        messages: [
          {
            role: 'user',
            content: '你好'
          }
        ],
        business_type: 'test',
        params: {
          max_tokens: 500
        }
      });
      
      if (result.response) {
        const content = result.response.choices?.[0]?.message?.content || result.response.content || result.response.text;
        if (content) {
          testResult.value = content;
        } else {
          testResult.value = `测试成功！响应数据：\n${JSON.stringify(result.response, null, 2)}`;
        }
      } else {
        testResult.value = `测试成功！响应数据：\n${JSON.stringify(result, null, 2)}`;
      }
      
      // 测试成功后，后台异步检查模型提供商和模型标识
      setTimeout(async () => {
        try {
          await checkAndUpdateModelProvider();
        } catch (error) {
          console.error('后台检查模型提供商失败:', error);
        }
      }, 0);
    } else {
      const baseUrl = formData.openai_api_url || formData.anthropic_api_url;
      const apiKey = formData.openai_api_key;
      const model = formData.model;
      
      if (!baseUrl) {
        testResult.value = '测试失败：请填写BaseURL';
        return;
      }
      if (!apiKey) {
        testResult.value = '测试失败：请填写API Key';
        return;
      }
      if (!model) {
        testResult.value = '测试失败：请填写模型标识';
        return;
      }
      
      let testUrl = baseUrl.endsWith('/') ? baseUrl + 'chat/completions' : baseUrl + '/chat/completions';
      
      if (testUrl.includes('coding.dashscope.aliyuncs.com')) {
        testUrl = testUrl.replace('https://coding.dashscope.aliyuncs.com', '/proxy');
      }
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: '你好'
            }
          ],
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        testResult.value = `测试失败：HTTP ${response.status} - ${errorText}`;
        return;
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.content || data.text;
      if (content) {
        testResult.value = content;
      } else {
        testResult.value = `测试成功！响应数据：\n${JSON.stringify(data, null, 2)}`;
      }
      
      // 测试成功后，后台异步检查模型提供商和模型标识
      setTimeout(async () => {
        try {
          await checkAndUpdateModelProvider();
        } catch (error) {
          console.error('后台检查模型提供商失败:', error);
        }
      }, 0);
    }
  } catch (error) {
    console.error('测试失败:', error);
    const errorInfo = error.response?.data || error;
    testResult.value = `测试失败：${error.message || '未知错误'}\n\n${JSON.stringify(errorInfo, null, 2)}`;
  }
};

// 根据模型ID获取模型详情
const getUserModelById = async (modelId) => {
  try {
    const model = await getUserModelByIdApi(modelId);
    return model;
  } catch (error) {
    console.error('获取模型详情失败:', error);
    return null;
  }
};

// 检查并更新模型提供商
const checkAndUpdateModelProvider = async () => {
  try {
    let modelData = null;
    
    if (currentModelId.value) {
      // 从已保存的模型获取信息
      modelData = await getUserModelById(currentModelId.value);
    } else {
      // 从表单获取信息
      modelData = {
        name: formData.name,
        model: formData.model,
        anthropic_api_url: formData.anthropic_api_url,
        openai_api_url: formData.openai_api_url
      };
    }
    
    if (!modelData) {
      return;
    }
    
    const baseUrl = modelData.anthropic_api_url || modelData.openai_api_url;
    const model = modelData.model;
    const name = modelData.name;
    
    if (!baseUrl || !model) {
      return;
    }
    
    // 获取所有模型提供商
    const response = await getModelProviders();
    const providers = response.data || response;
    
    // 查找匹配的提供商（基于baseUrl）
    let matchedProvider = null;
    for (const provider of providers) {
      if (provider.anthropic_base_url === baseUrl || provider.openai_base_url === baseUrl) {
        matchedProvider = provider;
        break;
      }
    }
    
    if (!matchedProvider) {
      // 创建新的模型提供商
      const providerData = {
        name: name,
        code: `custom_${Date.now()}`,
        url: baseUrl,
        openai_base_url: modelData.openai_api_url || '',
        anthropic_base_url: modelData.anthropic_api_url || '',
        protocol_base_url: baseUrl,
        description: `自定义模型提供商 - ${name}`,
        status: 'pending', // 待审批
        models: [{
          brand: name,
          modelId: model,
          capability: '自定义模型'
        }]
      };
      
      const createResult = await createModelProvider(providerData);
      if (createResult.code === 200) {
        ElMessage.success('模型提供商创建成功，已添加模型标识');
      }
    } else {
      // 检查模型标识是否存在
      const modelExists = matchedProvider.models.some(m => m.modelId === model);
      if (!modelExists) {
        // 添加模型标识到现有提供商
        const updateData = {
          ...matchedProvider,
          models: [...matchedProvider.models, {
            brand: matchedProvider.name,
            modelId: model,
            capability: '自定义模型'
          }]
        };
        
        const updateResult = await updateModelProvider(matchedProvider.id, updateData);
        if (updateResult.code === 200) {
          ElMessage.success('模型标识添加成功');
        }
      }
    }
  } catch (error) {
    console.error('检查模型提供商失败:', error);
  }
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
  loadModelProviders();
});
</script>

<style scoped>
:deep(.el-textarea__inner) {
  vertical-align: top;
  resize: vertical;
}

.user-models-container {
  padding: 20px;
}

.radio-only :deep(.el-radio__label) {
  display: none;
}

.user-models-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-config-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.config-row {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
}

.config-column {
  flex: 1;
}

.action-buttons {
  margin: 20px 0;
}

.model-list-section {
  margin-top: 30px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
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
</style>