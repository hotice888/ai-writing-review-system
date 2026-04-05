<template>
  <div class="field-option-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>字段选项管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleAddField" icon="Plus">添加字段</el-button>
          </div>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="字段列表" name="fields">
          <div class="table-toolbar">
            <el-input v-model="fieldSearchKeyword" placeholder="搜索字段名称或标识" clearable style="width: 250px;" @blur="handleFieldSearchBlur" />
            <el-select v-model="fieldStatusFilter" placeholder="状态筛选" clearable style="width: 120px; margin-left: 10px;" @change="loadFieldList">
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
            </el-select>
            <el-button style="margin-left: 10px;" @click="loadFieldList" icon="Refresh">刷新</el-button>
          </div>
          
          <el-table :data="fieldList" style="width: 100%; margin-top: 10px;" border v-loading="fieldLoading">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="field_name" label="字段名称" width="150">
              <template #default="scope">
                <span style="cursor: pointer; color: #409eff;" @click="handleEditField(scope.row)">{{ scope.row.field_name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="field_code" label="字段标识" width="150" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'enabled' ? 'success' : 'danger'">
                  {{ scope.row.status === 'enabled' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column prop="field_level" label="字段层级" width="100" />
            <el-table-column prop="parent_field_name" label="上级字段" width="150">
              <template #default="scope">
                {{ scope.row.parent_field_name || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="scope">
                <div style="display: flex; gap: 8px;">
                                    <el-button size="small" type="primary" @click="handleEditField(scope.row)">编辑</el-button>
                  <el-button size="small" :type="scope.row.status === 'enabled' ? 'warning' : 'success'" @click="handleToggleFieldStatus(scope.row)">
                    {{ scope.row.status === 'enabled' ? '禁用' : '启用' }}
                  </el-button>

                  <el-button size="small" type="danger" @click="handleDeleteField(scope.row.id)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          
          <el-pagination
            v-model:current-page="fieldPage"
            v-model:page-size="fieldPageSize"
            :total="fieldTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadFieldList"
            @current-change="loadFieldList"
            style="margin-top: 15px; justify-content: flex-end;"
          />
        </el-tab-pane>
        
        <el-tab-pane label="选项列表" name="options">
          <div class="table-toolbar">
            <el-input v-model="optionSearchKeyword" placeholder="字段名称/标识、选项名称/Value" clearable style="width: 250px;" />
            <el-input v-model="optionFieldKeyword" placeholder="字段名称/标识" clearable style="width: 150px; margin-left: 10px;" />
            <el-select v-model="optionStatusFilter" placeholder="选项状态" clearable style="width: 120px; margin-left: 10px;">
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
              <el-option label="封存" value="archived" />
            </el-select>
            <el-button style="margin-left: 10px;" @click="loadOptionList" icon="Refresh">刷新</el-button>
          </div>
          
          <el-table :data="optionList" style="width: 100%; margin-top: 10px;" border v-loading="optionLoading">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="field_name" label="字段名称" min-width="120" />
            <el-table-column prop="field_code" label="字段标识" min-width="120" />
            <el-table-column prop="field_status" label="字段状态" width="100">
              <template #default="scope">
                <el-tag :type="getOptionStatusType(scope.row.field_status)">
                  {{ getOptionStatusText(scope.row.field_status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="field_level" label="字段层级" width="90" />
            <el-table-column prop="option_text" label="选项名称" min-width="120" />
            <el-table-column prop="option_value" label="选项Value" min-width="120" />
            <el-table-column prop="status" label="选项状态" width="100">
              <template #default="scope">
                <el-tag :type="getOptionStatusType(scope.row.status)">
                  {{ getOptionStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="display_order" label="显示序号" width="90" />
            <el-table-column prop="parent_option_text" label="上级选项" min-width="120">
              <template #default="scope">
                {{ scope.row.parent_option_text || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="parent_field_name" label="上级字段" min-width="120">
              <template #default="scope">
                {{ scope.row.parent_field_name || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button size="small" type="primary" @click="handleEditFieldById(scope.row.field_id)">编辑</el-button>
                <el-button size="small" type="warning" @click="handleToggleOptionStatus(scope.row)">切换</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <el-pagination
            v-model:current-page="optionPage"
            v-model:page-size="optionPageSize"
            :total="optionTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadOptionList"
            @current-change="loadOptionList"
            style="margin-top: 15px; justify-content: flex-end;"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog
      v-model="fieldDetailVisible"
      :title="fieldDialogTitle"
      width="1200px"
      :close-on-click-modal="false"
      class="field-detail-dialog"
    >
      <div class="field-detail-layout">
        <div class="field-basic-info">
          <el-form
            :model="fieldFormData"
            :rules="fieldFormRules"
            ref="fieldFormRef"
            label-width="100px"
          >
            <div class="form-row">
              <el-form-item label="字段名称" prop="field_name" required>
                <el-input v-model="fieldFormData.field_name" placeholder="请输入字段名称" />
              </el-form-item>
              <el-form-item label="字段标识" prop="field_code" required>
                <el-input v-model="fieldFormData.field_code" placeholder="请输入字段标识" :disabled="!!fieldFormData.id" />
              </el-form-item>
              <el-form-item label="状态" prop="status">
                <el-select v-model="fieldFormData.status" style="width: 100%;">
                  <el-option label="启用" value="enabled" />
                  <el-option label="禁用" value="disabled" />
                </el-select>
              </el-form-item>
            </div>
            <el-form-item label="描述" prop="description">
              <el-input v-model="fieldFormData.description" type="textarea" :rows="3" placeholder="请输入描述" />
            </el-form-item>
          </el-form>
        </div>
        
        <div class="field-options-setting">
          <div class="options-setting-area">
            <div class="options-tabs-wrapper">
              <div class="add-child-field-btn" v-if="fieldFormData.id">
                <el-button type="primary" @click="handleAddChildField" icon="Plus" circle />
              </div>
              <el-tabs v-model="optionActiveTab" type="card" class="options-tabs">
                <el-tab-pane 
                  v-for="tab in optionTabs" 
                  :key="tab.id" 
                  :label="getTabLabel(tab)"
                  :name="tab.id"
                >
                  <div class="tab-content">
                    <div class="tab-toolbar">
                      <el-button type="primary" size="small" @click="handleAddOption(tab)" icon="Plus">添加选项</el-button>
                      <el-button type="warning" size="small" @click="handleRefreshOrder(tab)" icon="Refresh">刷新序号</el-button>
                      <el-button type="danger" size="small" @click="handleBatchDeleteOptions(tab)" icon="Delete" :disabled="!getSelectedOptions(tab).length">批量删除</el-button>
                      <div class="parent-field-wrapper">
                        <span class="parent-field-label">上级字段：</span>
                        <el-select v-model="fieldFormData.parent_field_id" placeholder="请选择上级字段" clearable class="parent-field-select" @change="handleParentFieldChange">
                          <el-option v-for="field in parentFieldOptions" :key="field.id" :label="field.field_name" :value="field.id" />
                        </el-select>
                      </div>
                    </div>
                    
                    <el-table 
                      :data="getTabOptions(tab)" 
                      style="width: 100%; margin-top: 10px;" 
                      border 
                      v-loading="tab.loading"
                      @selection-change="(val) => handleOptionSelectionChange(tab, val)"
                    >
                      <el-table-column type="selection" width="55" />
                      <el-table-column type="index" label="序号" width="60" />
                      <el-table-column prop="option_text" label="选项名称" min-width="150">
                        <template #default="scope">
                          <el-input
                            v-if="scope.row.editing"
                            v-model="scope.row.option_text"
                            size="small"
                            class="option-text-input"
                            @blur="handleSaveOptionEdit(scope.row, tab)"
                            @keyup.enter="handleSaveOptionEdit(scope.row, tab)"
                          />
                          <span v-else @click="handleStartEdit(scope.row)" style="cursor: pointer; width: 100%; display: block;">
                            {{ scope.row.option_text || '<点击编辑>' }}
                          </span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="option_value" label="选项Value" min-width="150">
                        <template #default="scope">
                          <el-input
                            v-if="scope.row.editing"
                            v-model="scope.row.option_value"
                            size="small"
                            @blur="handleSaveOptionEdit(scope.row, tab)"
                            @keyup.enter="handleSaveOptionEdit(scope.row, tab)"
                          />
                          <span v-else @click="handleStartEdit(scope.row)" style="cursor: pointer; width: 100%; display: block;">
                            {{ scope.row.option_value }}
                          </span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="display_order" label="显示序号" width="100" />
                      <el-table-column prop="status" label="状态" width="120">
                        <template #default="scope">
                          <el-select 
                            v-model="scope.row.status" 
                            size="small" 
                            style="width: 100%;"
                            @change="handleOptionStatusChange(scope.row, tab)"
                          >
                            <el-option label="启用" value="enabled" />
                            <el-option label="禁用" value="disabled" />
                            <el-option label="封存" value="archived" />
                          </el-select>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="100" fixed="right">
                        <template #default="scope">
                          <el-button size="small" type="danger" link @click="handleDeleteOption(scope.row, tab)">删除</el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="fieldDetailVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveField">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Refresh } from '@element-plus/icons-vue';
import {
  getFieldOptions,
  getFieldOptionById,
  createFieldOption,
  updateFieldOption,
  deleteFieldOption,
  updateFieldOptionStatus,
  getAllOptionItems,
  updateOptionItemStatus,
  getFieldOptionItems,
  createFieldOptionItem,
  updateFieldOptionItem,
  deleteFieldOptionItem,
  batchDeleteOptionItems,
  refreshOptionOrder
} from '../api/admin';

const activeTab = ref('fields');
const optionActiveTab = ref('');
const needRefreshOptionList = ref(false);

const fieldList = ref([]);
const fieldLoading = ref(false);
const fieldPage = ref(1);
const fieldPageSize = ref(20);
const fieldTotal = ref(0);
const fieldSearchKeyword = ref('');
const fieldStatusFilter = ref('');

const optionList = ref([]);
const optionLoading = ref(false);
const optionPage = ref(1);
const optionPageSize = ref(20);
const optionTotal = ref(0);
const optionSearchKeyword = ref('');
const optionStatusFilter = ref('');
const optionFieldKeyword = ref('');
const allFields = ref([]);

const fieldDetailVisible = ref(false);
const fieldDialogTitle = ref('添加字段');
const fieldFormRef = ref(null);
const fieldFormData = reactive({
  id: '',
  field_name: '',
  field_code: '',
  status: 'enabled',
  parent_field_id: null,
  field_level: 1,
  description: ''
});

const fieldFormRules = {
  field_name: [{ required: true, message: '请输入字段名称', trigger: 'blur' }],
  field_code: [{ required: true, message: '请输入字段标识', trigger: 'blur' }]
};

const optionTabs = ref([]);
const currentOptionTab = ref(null);

const parentFieldOptions = computed(() => {
  return allFields.value.filter(f => !fieldFormData.id || f.id !== fieldFormData.id);
});

const getTabLabel = (tab) => {
  const levelNames = ['', '一级', '二级', '三级', '四级', '五级'];
  return levelNames[tab.field_level] || `${tab.field_level}级`;
};

const getTabOptions = (tab) => {
  return tab.options || [];
};

const getSelectedOptions = (tab) => {
  return tab.selectedOptions || [];
};

const loadFieldList = async () => {
  try {
    fieldLoading.value = true;
    const params = {
      page: fieldPage.value,
      pageSize: fieldPageSize.value
    };
    if (fieldSearchKeyword.value) {
      params.keyword = fieldSearchKeyword.value;
    }
    if (fieldStatusFilter.value) {
      params.status = fieldStatusFilter.value;
    }
    const result = await getFieldOptions(params);
    if (result) {
      if (Array.isArray(result)) {
        fieldList.value = result;
        fieldTotal.value = result.length;
        if (allFields.value.length === 0) {
          allFields.value = result;
        }
      } else if (result.list) {
        fieldList.value = result.list;
        fieldTotal.value = result.total;
        if (allFields.value.length === 0) {
          allFields.value = result.list;
        }
      }
    }
  } catch (error) {
    console.error('加载字段列表失败:', error);
    ElMessage.error('加载字段列表失败');
  } finally {
    fieldLoading.value = false;
  }
};

const loadOptionList = async () => {
  try {
    optionLoading.value = true;
    const params = {
      page: optionPage.value,
      pageSize: optionPageSize.value
    };
    if (optionSearchKeyword.value) {
      params.keyword = optionSearchKeyword.value;
    }
    if (optionFieldKeyword.value) {
      params.field_keyword = optionFieldKeyword.value;
    }
    if (optionStatusFilter.value) {
      params.status = optionStatusFilter.value;
    }
    const result = await getAllOptionItems(params);
    if (result) {
      if (Array.isArray(result)) {
        optionList.value = result;
        optionTotal.value = result.length;
      } else if (result.list) {
        optionList.value = result.list;
        optionTotal.value = result.total;
      }
    }
  } catch (error) {
    console.error('加载选项列表失败:', error);
    ElMessage.error('加载选项列表失败');
  } finally {
    optionLoading.value = false;
  }
};

const loadAllFields = async () => {
  try {
    const result = await getFieldOptions({ page: 1, pageSize: 1000 });
    if (result) {
      if (Array.isArray(result)) {
        allFields.value = result;
      } else if (result.list) {
        allFields.value = result.list;
      }
    }
  } catch (error) {
    console.error('加载所有字段失败:', error);
  }
};

watch([optionSearchKeyword, optionFieldKeyword, optionStatusFilter], () => {
  optionPage.value = 1;
  loadOptionList();
});

watch(activeTab, (newTab) => {
  if (newTab === 'options' && needRefreshOptionList.value) {
    loadOptionList();
    needRefreshOptionList.value = false;
  }
});

const loadTabOptions = async (tab) => {
  try {
    tab.loading = true;
    const result = await getFieldOptionItems(tab.field_id);
    if (result) {
      if (Array.isArray(result)) {
        tab.options = result;
      } else if (result.list) {
        tab.options = result.list;
      } else {
        tab.options = [];
      }
    }
  } catch (error) {
    console.error('加载选项失败:', error);
    ElMessage.error('加载选项失败');
  } finally {
    tab.loading = false;
  }
};

const handleAddField = () => {
  fieldDialogTitle.value = '添加字段';
  Object.assign(fieldFormData, {
    id: '',
    field_name: '',
    field_code: '',
    status: 'enabled',
    parent_field_id: null,
    field_level: 1,
    description: ''
  });
  
  optionTabs.value = [{
    id: 'tab-temp',
    field_id: null,
    field_level: 1,
    options: [],
    selectedOptions: [],
    loading: false,
    isTemp: true
  }];
  optionActiveTab.value = optionTabs.value[0].id;
  
  fieldDetailVisible.value = true;
};

const handleEditField = async (row) => {
  try {
    const result = await getFieldOptionById(row.id);
    if (result) {
      fieldDialogTitle.value = '编辑字段';
      Object.assign(fieldFormData, result);
      
      optionTabs.value = [{
        id: `tab-${result.id}`,
        field_id: result.id,
        field_level: result.field_level,
        options: [],
        selectedOptions: [],
        loading: false
      }];
      optionActiveTab.value = optionTabs.value[0].id;
      
      loadTabOptions(optionTabs.value[0]);
      
      fieldDetailVisible.value = true;
    }
  } catch (error) {
    console.error('获取字段详情失败:', error);
    ElMessage.error('获取字段详情失败');
  }
};

const handleEditFieldById = async (fieldId) => {
  try {
    const result = await getFieldOptionById(fieldId);
    if (result) {
      fieldDialogTitle.value = '编辑字段';
      Object.assign(fieldFormData, result);
      
      optionTabs.value = [{
        id: `tab-${result.id}`,
        field_id: result.id,
        field_level: result.field_level,
        options: [],
        selectedOptions: [],
        loading: false
      }];
      optionActiveTab.value = optionTabs.value[0].id;
      
      loadTabOptions(optionTabs.value[0]);
      
      activeTab.value = 'fields';
      fieldDetailVisible.value = true;
    }
  } catch (error) {
    console.error('获取字段详情失败:', error);
    ElMessage.error('获取字段详情失败');
  }
};

const handleSaveField = async () => {
  try {
    await fieldFormRef.value?.validate();
    
    let result;
    const isEdit = !!fieldFormData.id;
    const tempTab = optionTabs.value.find(tab => tab.isTemp);
    const tempOptions = tempTab ? tempTab.options.filter(opt => !opt.id) : [];
    
    if (isEdit) {
      result = await updateFieldOption(fieldFormData.id, fieldFormData);
    } else {
      result = await createFieldOption(fieldFormData);
    }
    
    if (result) {
      ElMessage.success(isEdit ? '更新成功' : '创建成功');
      
      if (!isEdit) {
        Object.assign(fieldFormData, result);
        
        optionTabs.value = [{
          id: `tab-${result.id}`,
          field_id: result.id,
          field_level: result.field_level,
          options: [],
          selectedOptions: [],
          loading: false
        }];
        optionActiveTab.value = optionTabs.value[0].id;
        
        if (tempOptions.length > 0) {
          for (const opt of tempOptions) {
            await createFieldOptionItem(result.id, {
              option_text: opt.option_text,
              option_value: opt.option_value,
              status: opt.status,
              display_order: opt.display_order
            });
          }
          ElMessage.success(`成功保存 ${tempOptions.length} 个选项`);
        }
        
        loadTabOptions(optionTabs.value[0]);
      } else {
        fieldDetailVisible.value = false;
      }
      
      await loadFieldList();
      await loadAllFields();
      needRefreshOptionList.value = true;
    }
  } catch (error) {
    if (error !== false && typeof error !== 'boolean') {
      console.error('保存字段失败:', error);
      ElMessage.error('保存字段失败');
    }
  }
};

const handleDeleteField = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该字段吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await deleteFieldOption(id);
    ElMessage.success('删除成功');
    await loadFieldList();
    await loadAllFields();
    needRefreshOptionList.value = true;
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除字段失败:', error);
      ElMessage.error('删除字段失败');
    }
  }
};

const handleFieldSearchBlur = () => {
  fieldPage.value = 1;
  loadFieldList();
};

const handleToggleFieldStatus = async (row) => {
  try {
    const newStatus = row.status === 'enabled' ? 'disabled' : 'enabled';
    await updateFieldOptionStatus(row.id, newStatus);
    ElMessage.success('状态更新成功');
    loadFieldList();
  } catch (error) {
    console.error('更新字段状态失败:', error);
    ElMessage.error('更新字段状态失败');
  }
};

const handleToggleOptionStatus = async (row) => {
  try {
    const statuses = ['enabled', 'disabled', 'archived'];
    const currentIndex = statuses.indexOf(row.status);
    const newStatus = statuses[(currentIndex + 1) % statuses.length];
    
    await updateOptionItemStatus(row.id, newStatus);
    ElMessage.success('状态更新成功');
    loadOptionList();
  } catch (error) {
    console.error('更新选项状态失败:', error);
    ElMessage.error('更新选项状态失败');
  }
};

const handleParentFieldChange = (parentId) => {
  if (parentId) {
    const parentField = allFields.value.find(f => f.id === parentId);
    if (parentField) {
      fieldFormData.field_level = parentField.field_level + 1;
    }
  }
};

const handleAddOption = (tab) => {
  const newOption = {
    id: null,
    option_text: '',
    option_value: '',
    status: 'enabled',
    display_order: tab.options.length + 1,
    editing: true
  };
  tab.options.push(newOption);
  
  nextTick(() => {
    const textInput = document.querySelector('.option-text-input:last-child input');
    if (textInput) {
      textInput.focus();
    }
  });
};

const handleStartEdit = (row) => {
  row.editing = true;
};

const handleSaveOptionEdit = async (row, tab) => {
  try {
    if (!row.option_text || !row.option_value) {
      ElMessage.warning('选项名称和选项Value必填');
      row.editing = true;
      return;
    }
    
    if (row.id) {
      const { editing, ...updateData } = row;
      await updateFieldOptionItem(row.id, updateData);
    } else {
      if (tab.field_id) {
        const result = await createFieldOptionItem(tab.field_id, {
          option_text: row.option_text,
          option_value: row.option_value,
          status: row.status,
          display_order: row.display_order
        });
        if (result) {
          row.id = result.id;
        }
      }
    }
    row.editing = false;
    ElMessage.success('保存成功');
    needRefreshOptionList.value = true;
  } catch (error) {
    console.error('保存选项失败:', error);
    ElMessage.error('保存选项失败');
  }
};

const handleOptionStatusChange = async (row, tab) => {
  try {
    if (row.id) {
      await updateFieldOptionItem(row.id, { status: row.status });
    }
    ElMessage.success('状态更新成功');
  } catch (error) {
    console.error('更新选项状态失败:', error);
    ElMessage.error('更新选项状态失败');
  }
};

const handleDeleteOption = async (row, tab) => {
  try {
    await ElMessageBox.confirm('确定要删除该选项吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    if (row.id) {
      await deleteFieldOptionItem(row.id);
      loadTabOptions(tab);
    } else {
      const index = tab.options.findIndex(o => o === row);
      if (index > -1) {
        tab.options.splice(index, 1);
        tab.options.forEach((opt, idx) => {
          opt.display_order = idx + 1;
        });
      }
    }
    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除选项失败:', error);
      ElMessage.error('删除选项失败');
    }
  }
};

const handleOptionSelectionChange = (tab, val) => {
  tab.selectedOptions = val;
};

const handleBatchDeleteOptions = async (tab) => {
  try {
    if (tab.selectedOptions.length === 0) {
      ElMessage.warning('请先选择要删除的选项');
      return;
    }
    
    await ElMessageBox.confirm(`确定要删除选中的 ${tab.selectedOptions.length} 个选项吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const hasIds = tab.selectedOptions.some(o => o.id);
    if (hasIds) {
      const selectedIds = tab.selectedOptions.filter(o => o.id).map(o => o.id);
      await batchDeleteOptionItems({ ids: selectedIds });
    }
    
    if (tab.field_id) {
      loadTabOptions(tab);
    } else {
      const selectedSet = new Set(tab.selectedOptions);
      tab.options = tab.options.filter(o => !selectedSet.has(o));
      tab.options.forEach((opt, idx) => {
        opt.display_order = idx + 1;
      });
      tab.selectedOptions = [];
    }
    
    ElMessage.success('批量删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除选项失败:', error);
      ElMessage.error('批量删除选项失败');
    }
  }
};

const handleRefreshOrder = async (tab) => {
  try {
    if (tab.field_id) {
      const orders = tab.options.map((opt, index) => ({
        id: opt.id,
        display_order: index + 1
      }));
      
      await refreshOptionOrder(tab.field_id, { orders });
      ElMessage.success('刷新序号成功');
      loadTabOptions(tab);
    } else {
      tab.options.forEach((opt, index) => {
        opt.display_order = index + 1;
      });
      ElMessage.success('刷新序号成功');
    }
  } catch (error) {
    console.error('刷新序号失败:', error);
    ElMessage.error('刷新序号失败');
  }
};

const handleAddChildField = () => {
  ElMessage.info('添加子字段功能待实现');
};

const getOptionStatusType = (status) => {
  switch (status) {
    case 'enabled': return 'success';
    case 'disabled': return 'danger';
    case 'archived': return 'info';
    case 'deleted': return 'info';
    default: return 'info';
  }
};

const getOptionStatusText = (status) => {
  switch (status) {
    case 'enabled': return '启用';
    case 'disabled': return '禁用';
    case 'archived': return '封存';
    case 'deleted': return '已删除';
    default: return status;
  }
};

onMounted(() => {
  loadFieldList();
  loadAllFields();
  loadOptionList();
});
</script>

<style scoped>
.field-option-management {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.field-detail-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.field-detail-layout {
  display: flex;
  flex-direction: column;

  padding: 5px;
}

.field-basic-info {
  width: 100%;

}

.form-row {
  display: flex;
  padding: 10px 0;
}

.form-row .el-form-item {
  flex: 1;
  margin-bottom: 0;
}

.field-options-setting {
  flex: 1;
  min-width: 0;
}

.options-setting-area {
  padding: 0;
}

.options-tabs-wrapper {
  position: relative;
}

.options-tabs {
  width: 100%;
}

.add-child-field-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.tab-content {
  min-height: 300px;
}

.tab-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.parent-field-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.parent-field-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.parent-field-select {
  width: 200px;
}
</style>
