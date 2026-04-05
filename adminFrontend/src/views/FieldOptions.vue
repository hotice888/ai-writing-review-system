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
            <el-button type="success" style="margin-left: 10px;" @click="handleExport" icon="Download">导出</el-button>
            <el-button type="warning" style="margin-left: 10px;" @click="importDialogVisible = true" icon="Upload">导入</el-button>
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
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="scope">
                <el-button size="small" type="primary" @click="handleEditFieldById(scope.row.field_id)">编辑</el-button>
                <el-button size="small" type="warning" @click="handleToggleOptionStatus(scope.row)">切换</el-button>
                <el-button size="small" type="danger" @click="handleDeleteOptionFromList(scope.row)">删除</el-button>
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
        
        <el-tab-pane label="字段树" name="tree">
          <div class="field-tree-layout">
            <div class="field-tree-left">
              <div class="tree-toolbar">
                <el-button type="primary" size="small" @click="loadAllFields" icon="Refresh">刷新</el-button>
              </div>
              <el-tree
                ref="fieldTreeRef"
                :data="fieldTreeData"
                :props="fieldTreeProps"
                node-key="id"
                :highlight-current="true"
                :expand-on-click-node="false"
                :default-expand-all="true"
                @node-click="handleTreeNodeClick"
              >
                <template #default="{ node, data }">
                  <span class="tree-node-content">
                    <span class="tree-node-label">{{ node.label }}</span>
                    <span class="tree-node-code">({{ data.field_code }})</span>
                    <span class="tree-node-level">
                      <el-tag size="small" type="info">{{ getFieldLevelText(data.field_level) }}</el-tag>
                    </span>
                  </span>
                </template>
              </el-tree>
            </div>
          </div>
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
                    <!-- 子字段信息显示区域 -->
                    <div v-if="tab.isChildField" class="child-field-info">
                      <div class="child-field-form">
                        <div class="form-row">
                          <el-form-item label="子字段名称" required>
                            <el-input v-model="tab.field_name" placeholder="请输入子字段名称" :disabled="tab.isExistingChildField" />
                          </el-form-item>
                          <el-form-item label="子字段标识" required>
                            <el-input v-model="tab.field_code" placeholder="请输入子字段标识" :disabled="!!tab.field_id || tab.isExistingChildField" />
                          </el-form-item>
                          <el-form-item label="状态">
                            <el-select v-model="tab.status" style="width: 100%;" :disabled="tab.isExistingChildField">
                              <el-option label="启用" value="enabled" />
                              <el-option label="禁用" value="disabled" />
                            </el-select>
                          </el-form-item>
                        </div>
                      </div>
                    </div>
                    <div class="tab-toolbar">
                      <el-button type="primary" size="small" @click="handleAddOption(tab)" icon="Plus">添加选项</el-button>
                      <el-button type="warning" size="small" @click="handleRefreshOrder(tab)" icon="Refresh">刷新序号</el-button>
                      <el-button type="danger" size="small" @click="handleBatchDeleteOptions(tab)" icon="Delete" :disabled="!getSelectedOptions(tab).length">批量删除</el-button>
                      <div class="parent-field-wrapper">
                        <span class="parent-field-label">上级字段：</span>
                        <el-select 
                          v-if="!tab.isChildField" 
                          v-model="fieldFormData.parent_field_id" 
                          placeholder="请选择上级字段" 
                          clearable 
                          class="parent-field-select" 
                          @change="handleParentFieldChange"
                        >
                          <el-option v-for="field in parentFieldOptions" :key="field.id" :label="field.field_name" :value="field.id" />
                        </el-select>
                        <el-input 
                          v-else 
                          :value="getParentFieldName(tab.parent_field_id)" 
                          disabled 
                          class="parent-field-select"
                        />
                      </div>
                    </div>
                    
                    <el-table 
                      :data="tab.options" 
                      style="width: 100%; margin-top: 10px;" 
                      border 
                      v-loading="tab.loading"
                      @selection-change="(val) => handleOptionSelectionChange(tab, val)"
                      row-key="id"
                      :row-class-name="(row) => row._deleted ? 'hidden-row' : ''"
                    >
                      <el-table-column type="selection" width="55" align="center" />
                      
                      <el-table-column label="序号" width="80" align="center">
                        <template #default="scope">
                          <div 
                            class="drag-handle"
                            draggable="true"
                            @dragstart="handleDragStart($event, scope.$index, tab)"
                            @dragover.prevent="handleDragOver($event, scope.$index, tab)"
                            @drop="handleDrop($event, scope.$index, tab)"
                            @dragend="handleDragEnd(tab)"
                          >
                            {{ getTabOptions(tab).findIndex(o => o.id === scope.row.id) + 1 }}
                          </div>
                        </template>
                      </el-table-column>
                      <el-table-column prop="option_text" label="选项名称" min-width="150">
                        <template #default="scope">
                          <el-input
                            v-model="scope.row.option_text"
                            size="small"
                            class="option-text-input"
                            placeholder="请输入选项名称"
                          />
                        </template>
                      </el-table-column>
                      <el-table-column prop="option_value" label="选项Value" min-width="150">
                        <template #default="scope">
                          <el-input
                            v-model="scope.row.option_value"
                            size="small"
                            placeholder="请输入选项Value"
                          />
                        </template>
                      </el-table-column>
                                            <el-table-column v-if="fieldFormData.parent_field_id" label="上级选项" min-width="150">
                        <template #default="scope">
                          <el-select 
                            v-model="scope.row.parent_option_id" 
                            size="small" 
                            style="width: 100%;"
                            clearable
                            placeholder="请选择上级选项"
                          >
                            <el-option 
                              v-for="opt in parentFieldOptionsList" 
                              :key="opt.id" 
                              :label="opt.option_text" 
                              :value="opt.id" 
                            />
                          </el-select>
                        </template>
                      </el-table-column>
                      <el-table-column prop="display_order" label="显示序号" width="100">
                        <template #default="scope">
                          <el-input-number
                            v-model="scope.row.display_order"
                            :min="1"
                            :step="1"
                            size="small"
                            style="width: 100%;"
                            controls-position="right"
                          />
                        </template>
                      </el-table-column>
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
    
    <el-dialog v-model="importDialogVisible" title="导入字段和选项" width="500px">
      <div style="margin-bottom: 15px;">
        <span>请先下载导入模板：</span>
        <el-link type="primary" @click="handleDownloadTemplate">点击下载模板</el-link>
      </div>
      <el-upload
        ref="importFileRef"
        :auto-upload="false"
        :show-file-list="true"
        :on-change="handleFileChange"
        accept=".xlsx,.xls"
        :limit="1"
      >
        <el-button type="primary">选择文件</el-button>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 .xlsx 或 .xls 文件
          </div>
        </template>
      </el-upload>
      
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :loading="importing">
          导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Refresh, Download, Upload, Document } from '@element-plus/icons-vue';
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
const selectedOptionsFromList = ref([]);
const parentFieldOptionsList = ref([]);
const allFields = ref([]);

const fieldTreeRef = ref(null);
const selectedTreeField = ref(null);
const fieldTreeProps = {
  label: 'field_name',
  children: 'children'
};

const importDialogVisible = ref(false);
const importFileRef = ref(null);
const importFile = ref(null);
const importing = ref(false);

const fieldTreeData = computed(() => {
  const hasChildren = (fieldId) => {
    return allFields.value.some(field => field.parent_field_id === fieldId);
  };

  const shouldShowField = (field) => {
    const hasParent = !!field.parent_field_id;
    const hasChild = hasChildren(field.id);
    return hasParent || hasChild;
  };

  const collectParentIds = (fieldId, parentIdsSet) => {
    const field = allFields.value.find(f => f.id === fieldId);
    if (field && field.parent_field_id) {
      parentIdsSet.add(field.parent_field_id);
      collectParentIds(field.parent_field_id, parentIdsSet);
    }
  };

  const fieldsToShow = new Set();
  const parentIdsToShow = new Set();

  allFields.value.forEach(field => {
    if (shouldShowField(field)) {
      fieldsToShow.add(field.id);
      if (field.parent_field_id) {
        collectParentIds(field.id, parentIdsToShow);
      }
    }
  });

  parentIdsToShow.forEach(id => fieldsToShow.add(id));

  const buildTree = (parentId = null) => {
    return allFields.value
      .filter(field => field.parent_field_id === parentId)
      .filter(field => fieldsToShow.has(field.id))
      .map(field => ({
        ...field,
        children: buildTree(field.id)
      }));
  };

  return buildTree();
});

const fieldDetailVisible = ref(false);
const fieldDialogTitle = ref('添加字段');
const fieldFormRef = ref(null);
const originalParentFieldId = ref(null);
const currentParentFieldId = ref(null);

const dragIndex = ref(null);
const dragTab = ref(null);
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
  if (!fieldFormData.id) {
    return allFields.value;
  }
  
  // 获取当前字段的所有子字段和子孙字段的 ID
  const excludedIds = getAllChildFieldIds(fieldFormData.id);
  // 也要排除字段自身
  excludedIds.add(fieldFormData.id);
  
  return allFields.value.filter(f => !excludedIds.has(f.id));
});

const getTabLabel = (tab) => {
  if (!tab.isChildField) {
    const levelNames = ['', '一级', '二级', '三级', '四级', '五级'];
    return levelNames[tab.field_level] || `${tab.field_level}级`;
  } else {
    return tab.field_name || `子字段`;
  }
};

const getParentFieldName = (parentFieldId) => {
  if (!parentFieldId) return '';
  const parentField = allFields.value.find(f => f.id === parentFieldId);
  return parentField ? parentField.field_name : '';
};

const getFieldLevelText = (level) => {
  const levelNames = ['', '一级', '二级', '三级', '四级', '五级'];
  return levelNames[level] || `${level}级`;
};

const handleTreeNodeClick = (data) => {
  selectedTreeField.value = data;
  handleEditFieldById(data.id);
};

const getTabOptions = (tab) => {
  return (tab.options || []).filter(opt => !opt._deleted);
};

// 获取字段及其所有子字段和子孙字段的 ID
const getAllChildFieldIds = (fieldId) => {
  const childIds = new Set();
  
  const addChildIds = (parentId) => {
    const children = allFields.value.filter(f => f.parent_field_id === parentId);
    for (const child of children) {
      childIds.add(child.id);
      addChildIds(child.id);
    }
  };
  
  addChildIds(fieldId);
  return childIds;
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

watch([activeTab, needRefreshOptionList], ([newTab, refresh]) => {
  if (newTab === 'options' && refresh) {
    loadOptionList();
    needRefreshOptionList.value = false;
  }
});

const loadTabOptions = async (tab) => {
  try {
    tab.loading = true;
    const result = await getFieldOptionItems(tab.field_id);
    if (result) {
      let options = [];
      if (Array.isArray(result)) {
        options = result;
      } else if (result.list) {
        options = result.list;
      } else {
        options = [];
      }
      tab.options = options.map(opt => {
        // 确保option_value不会被赋值为选项ID
        if (opt.option_value === opt.id) {
          opt.option_value = '';
        }
        return { ...opt, _deleted: false };
      });
      // 初始化删除选项ID集合
      tab.deletedOptionIds = new Set();
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
  originalParentFieldId.value = null;
  currentParentFieldId.value = null;
  
  optionTabs.value = [{
    id: 'tab-temp',
    field_id: null,
    field_level: 1,
    options: [],
    loading: false,
    isTemp: true,
    selectedOptions: []
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
      originalParentFieldId.value = result.parent_field_id;
      currentParentFieldId.value = result.parent_field_id;
      
      if (result.parent_field_id) {
        try {
          const optionsResult = await getFieldOptionItems(result.parent_field_id);
          if (optionsResult) {
            let options = [];
            if (Array.isArray(optionsResult)) {
              options = optionsResult;
            } else if (optionsResult.list) {
              options = optionsResult.list;
            } else {
              options = [];
            }
            parentFieldOptionsList.value = options.filter(opt => opt.status === 'enabled');
          }
        } catch (error) {
          console.error('加载上级字段选项失败:', error);
          parentFieldOptionsList.value = [];
        }
      } else {
        parentFieldOptionsList.value = [];
      }
      
      // 初始化 tabs 数组，第一个是当前字段
      optionTabs.value = [{
        id: `tab-${result.id}`,
        field_id: result.id,
        field_level: result.field_level,
        options: [],
        loading: false,
        selectedOptions: [],
        isChildField: false,
        isExistingChildField: false
      }];
      
      // 查找并加载当前字段的所有子字段
      if (allFields.value.length > 0) {
        const childFields = allFields.value.filter(f => f.parent_field_id === result.id);
        
        for (const childField of childFields) {
          const childTab = {
            id: `tab-${childField.id}`,
            field_id: childField.id,
            parent_field_id: childField.parent_field_id,
            field_level: childField.field_level,
            field_name: childField.field_name,
            field_code: childField.field_code,
            status: childField.status,
            description: childField.description,
            options: [],
            loading: false,
            isChildField: true,
            isExistingChildField: true,
            selectedOptions: [],
            deletedOptionIds: new Set()
          };
          
          optionTabs.value.push(childTab);
          
          // 加载子字段的选项
          await loadTabOptions(childTab);
        }
      }
      
      optionActiveTab.value = optionTabs.value[0].id;
      
      // 加载主字段的选项
      await loadTabOptions(optionTabs.value[0]);
      
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
      originalParentFieldId.value = result.parent_field_id;
      currentParentFieldId.value = result.parent_field_id;
      
      if (result.parent_field_id) {
        try {
          const optionsResult = await getFieldOptionItems(result.parent_field_id);
          if (optionsResult) {
            let options = [];
            if (Array.isArray(optionsResult)) {
              options = optionsResult;
            } else if (optionsResult.list) {
              options = optionsResult.list;
            } else {
              options = [];
            }
            parentFieldOptionsList.value = options.filter(opt => opt.status === 'enabled');
          }
        } catch (error) {
          console.error('加载上级字段选项失败:', error);
          parentFieldOptionsList.value = [];
        }
      } else {
        parentFieldOptionsList.value = [];
      }
      
      // 初始化 tabs 数组，第一个是当前字段
      optionTabs.value = [{
        id: `tab-${result.id}`,
        field_id: result.id,
        field_level: result.field_level,
        options: [],
        loading: false,
        selectedOptions: [],
        isChildField: false,
        isExistingChildField: false
      }];
      
      // 查找并加载当前字段的所有子字段
      if (allFields.value.length > 0) {
        const childFields = allFields.value.filter(f => f.parent_field_id === result.id);
        
        for (const childField of childFields) {
          const childTab = {
            id: `tab-${childField.id}`,
            field_id: childField.id,
            parent_field_id: childField.parent_field_id,
            field_level: childField.field_level,
            field_name: childField.field_name,
            field_code: childField.field_code,
            status: childField.status,
            description: childField.description,
            options: [],
            loading: false,
            isChildField: true,
            isExistingChildField: true,
            selectedOptions: [],
            deletedOptionIds: new Set()
          };
          
          optionTabs.value.push(childTab);
          
          // 加载子字段的选项
          await loadTabOptions(childTab);
        }
      }
      
      optionActiveTab.value = optionTabs.value[0].id;
      
      // 加载主字段的选项
      await loadTabOptions(optionTabs.value[0]);
      
      fieldDetailVisible.value = true;
    }
  } catch (error) {
    console.error('获取字段详情失败:', error);
    ElMessage.error('获取字段详情失败');
  }
};

// 辅助函数：保存单个字段及其选项
const saveFieldAndOptions = async (fieldData, tab, isEdit, originalParentFieldIdVal, saveFieldOnly = false, saveOptionsOnly = false) => {
  let fieldResult;
  let totalSavedOptions = 0;
  let totalDeletedOptions = 0;
  
  if (!saveOptionsOnly) {
    if (isEdit) {
      fieldResult = await updateFieldOption(fieldData.id, fieldData);
    } else {
      fieldResult = await createFieldOption(fieldData);
    }
    
    if (fieldResult && !isEdit) {
      Object.assign(fieldData, fieldResult);
      tab.field_id = fieldResult.id;
      tab.id = `tab-${fieldResult.id}`;
    }
  }
  
  if (!saveFieldOnly) {
    const currentFieldId = saveOptionsOnly ? tab.field_id : (fieldResult ? fieldResult.id : fieldData.id);
    
    if (currentFieldId) {
      const deletedOptionIds = Array.from(tab.deletedOptionIds || []);
      
      for (const optionId of deletedOptionIds) {
        try {
          await deleteFieldOptionItem(optionId);
          totalDeletedOptions++;
        } catch (err) {
          console.error('删除选项失败:', optionId, err);
          throw err;
        }
      }
      
      const optionsToProcess = tab.options || [];
      
      let parentOptionIdToSave = null;
      if (!saveOptionsOnly && originalParentFieldIdVal && fieldData.parent_field_id && originalParentFieldIdVal !== fieldData.parent_field_id) {
        parentOptionIdToSave = null;
      } else if (!saveOptionsOnly && !fieldData.parent_field_id) {
        parentOptionIdToSave = null;
      }
      
      for (const opt of optionsToProcess) {
        if (opt._deleted) continue;
        
        const finalParentOptionId = parentOptionIdToSave !== null ? parentOptionIdToSave : opt.parent_option_id;
        
        const optionData = {
          option_text: opt.option_text,
          option_value: opt.option_value === opt.id ? '' : opt.option_value,
          status: opt.status,
          display_order: opt.display_order,
          parent_option_id: finalParentOptionId
        };
        
        const isTempId = opt.id && opt.id.toString().startsWith('temp-');
        
        if (opt.id && !isTempId) {
          try {
            await updateFieldOptionItem(opt.id, optionData);
            totalSavedOptions++;
          } catch (err) {
            console.error('更新选项失败:', opt.id, err);
            throw err;
          }
        } else {
          try {
            await createFieldOptionItem(currentFieldId, optionData);
            totalSavedOptions++;
          } catch (err) {
            console.error('创建选项失败:', optionData, err);
            throw err;
          }
        }
      }
    }
  }
  
  return { fieldResult, totalSavedOptions, totalDeletedOptions };
};

const handleSaveField = async () => {
  try {
    await fieldFormRef.value?.validate();
    
    const currentTab = optionTabs.value.find(tab => tab.id === optionActiveTab.value) || optionTabs.value[0];
    
    if (currentTab && currentTab.options.length > 0) {
      const activeOptions = currentTab.options.filter(opt => !opt._deleted);
      activeOptions.forEach((opt, index) => {
        opt.display_order = 1 + index * 5;
      });
      
      const optionTexts = [];
      for (let i = 0; i < activeOptions.length; i++) {
        const opt = activeOptions[i];
        if (!opt.option_text || !opt.option_text.trim()) {
          ElMessage.warning(`第 ${i + 1} 个选项：选项名称必填`);
          return;
        }
        const trimmedText = opt.option_text.trim();
        if (optionTexts.includes(trimmedText)) {
          ElMessage.warning(`第 ${i + 1} 个选项：选项名称"${trimmedText}"重复`);
          return;
        }
        optionTexts.push(trimmedText);
      }
    }
    
    const isEdit = !!fieldFormData.id;
    const mainTab = optionTabs.value.find(tab => !tab.isChildField);
    const childTabs = optionTabs.value.filter(tab => tab.isChildField);
    
    let grandTotalSavedOptions = 0;
    let grandTotalDeletedOptions = 0;
    let mainResult;
    
    if (mainTab) {
      const result = await saveFieldAndOptions(fieldFormData, mainTab, isEdit, originalParentFieldId.value);
      mainResult = result.fieldResult;
      grandTotalSavedOptions += result.totalSavedOptions;
      grandTotalDeletedOptions += result.totalDeletedOptions;
      
      if (mainResult && !isEdit) {
        Object.assign(fieldFormData, mainResult);
      }
    }
    
    for (const childTab of childTabs) {
      if (!childTab.isExistingChildField) {
        if (!childTab.field_name || !childTab.field_code) {
          ElMessage.warning('请填写子字段的名称和标识');
          return;
        }
        
        const childFieldData = {
          field_name: childTab.field_name,
          field_code: childTab.field_code,
          status: childTab.status,
          parent_field_id: fieldFormData.id,
          field_level: childTab.field_level,
          description: childTab.description
        };
        
        if (childTab.field_id) {
          childFieldData.id = childTab.field_id;
        }
        
        const result = await saveFieldAndOptions(
          childFieldData, 
          childTab, 
          !!childTab.field_id, 
          null
        );
        
        grandTotalSavedOptions += result.totalSavedOptions;
        grandTotalDeletedOptions += result.totalDeletedOptions;
        
        if (result.fieldResult && !childTab.field_id) {
          childTab.field_id = result.fieldResult.id;
          childTab.id = `tab-${result.fieldResult.id}`;
          childTab.isTemp = false;
        }
      } else {
        // 已存在的子字段，只保存选项
        const result = await saveFieldAndOptions(
          {}, 
          childTab, 
          false, 
          null, 
          false, 
          true
        );
        
        grandTotalSavedOptions += result.totalSavedOptions;
        grandTotalDeletedOptions += result.totalDeletedOptions;
      }
    }
    
    let message = '保存成功';
    if (grandTotalDeletedOptions > 0 && grandTotalSavedOptions > 0) {
      message = `保存成功，保存了 ${grandTotalSavedOptions} 个选项，删除了 ${grandTotalDeletedOptions} 个选项`;
    } else if (grandTotalDeletedOptions > 0) {
      message = `保存成功，删除了 ${grandTotalDeletedOptions} 个选项`;
    } else if (grandTotalSavedOptions > 0) {
      message = `保存成功，保存了 ${grandTotalSavedOptions} 个选项`;
    }
    
    ElMessage.success(message);
    
    await loadFieldList();
    await loadAllFields();
    
    if (activeTab.value === 'options') {
      await loadOptionList();
    } else {
      needRefreshOptionList.value = true;
    }
    
    fieldDetailVisible.value = false;
  } catch (error) {
    if (error !== false && typeof error !== 'boolean') {
      console.error('保存字段失败:', error);
    }
  }
};

const handleDeleteField = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该字段吗？该字段的子字段将被解除关联，且层级会自动更新。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    // 后端会自动处理所有关联关系的清理
    await deleteFieldOption(id);
    ElMessage.success('删除成功');
    await loadFieldList();
    await loadAllFields();
    
    if (activeTab.value === 'options') {
      await loadOptionList();
    } else {
      needRefreshOptionList.value = true;
    }
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

const handleDeleteOptionFromList = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该选项吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await deleteFieldOptionItem(row.id);
    ElMessage.success('删除成功');
    await loadOptionList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除选项失败:', error);
      ElMessage.error('删除选项失败');
    }
  }
};



const handleParentFieldChange = async (newParentId) => {
  if (newParentId) {
    const parentField = allFields.value.find(f => f.id === newParentId);
    if (parentField) {
      fieldFormData.field_level = parentField.field_level + 1;
    }
    
    try {
      const result = await getFieldOptionItems(newParentId);
      if (result) {
        let options = [];
        if (Array.isArray(result)) {
          options = result;
        } else if (result.list) {
          options = result.list;
        } else {
          options = [];
        }
        parentFieldOptionsList.value = options.filter(opt => opt.status === 'enabled');
      }
    } catch (error) {
      console.error('加载上级字段选项失败:', error);
      parentFieldOptionsList.value = [];
    }
  } else {
    fieldFormData.field_level = 1;
    parentFieldOptionsList.value = [];
  }
  
  currentParentFieldId.value = newParentId;
  
  // 关键逻辑：无论上级字段变成什么，只要发生变化，清空所有选项的 parent_option_id
  optionTabs.value.forEach(tab => {
    if (tab.options) {
      tab.options.forEach(opt => {
        opt.parent_option_id = null;
      });
    }
  });
};

const handleOptionSelectionChange = (tab, val) => {
  tab.selectedOptions = val;
};

const getSelectedOptions = (tab) => {
  return tab.selectedOptions || [];
};

const handleBatchDeleteOptions = async (tab) => {
  try {
    if (getSelectedOptions(tab).length === 0) {
      ElMessage.warning('请先选择要删除的选项');
      return;
    }
    
    await ElMessageBox.confirm(`确定要删除选中的 ${getSelectedOptions(tab).length} 个选项吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    // 记录被删除的选项ID
    if (!tab.deletedOptionIds) {
      tab.deletedOptionIds = new Set();
    }
    getSelectedOptions(tab).forEach(opt => {
      if (opt.id && !opt.id.toString().startsWith('temp-')) {
        tab.deletedOptionIds.add(opt.id);
      }
    });
    
    // 直接从数组中移除选中的选项
    const selectedIds = new Set(getSelectedOptions(tab).map(opt => opt.id));
    tab.options = tab.options.filter(opt => !selectedIds.has(opt.id));
    
    tab.selectedOptions = [];

  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除选项失败:', error);
      ElMessage.error('批量删除选项失败');
    }
  }
};

const handleAddOption = (tab) => {
  const activeOptions = tab.options.filter(o => !o._deleted);
  const newOption = {
    id: `temp-${Date.now()}`,
    option_text: '',
    option_value: '',
    status: 'enabled',
    display_order: 1,
    _deleted: false
  };
  
  activeOptions.forEach(opt => {
    opt.display_order = (opt.display_order || 1) + 5;
  });
  
  tab.options.unshift(newOption);
  
  nextTick(() => {
    const textInput = document.querySelector('.option-text-input:last-child input');
    if (textInput) {
      textInput.focus();
    }
  });
};

const handleOptionStatusChange = (row, tab) => {
};

const handleDeleteOption = async (row, tab) => {
  try {
    await ElMessageBox.confirm('确定要删除该选项吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    // 记录被删除的选项ID
    if (row.id && !row.id.toString().startsWith('temp-')) {
      if (!tab.deletedOptionIds) {
        tab.deletedOptionIds = new Set();
      }
      tab.deletedOptionIds.add(row.id);
    }
    
    // 直接从数组中移除选项
    const index = tab.options.findIndex(opt => opt.id === row.id);
    if (index > -1) {
      tab.options.splice(index, 1);
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除选项失败:', error);
      ElMessage.error('删除选项失败');
    }
  }
};

const handleRefreshOrder = (tab) => {
  try {
    tab.options.forEach((opt, index) => {
      opt.display_order = 1 + index * 5;
    });
    ElMessage.success('序号刷新成功');
  } catch (error) {
    console.error('刷新序号失败:', error);
    ElMessage.error('刷新序号失败');
  }
};

const handleDragStart = (event, index, tab) => {
  dragIndex.value = index;
  dragTab.value = tab;
  event.dataTransfer.effectAllowed = 'move';
};

const handleDragOver = (event, index, tab) => {
  event.dataTransfer.dropEffect = 'move';
};

const handleDrop = (event, dropIndex, tab) => {
  event.preventDefault();
  if (dragIndex.value === null || dragTab.value !== tab) return;
  
  const activeOptions = tab.options.filter(opt => !opt._deleted);
  const dragOption = activeOptions[dragIndex.value];
  
  if (dragOption) {
    const deletedOptions = tab.options.filter(opt => opt._deleted);
    
    const tempOptions = [...activeOptions];
    tempOptions.splice(dragIndex.value, 1);
    tempOptions.splice(dropIndex, 0, dragOption);
    
    tempOptions.forEach((opt, index) => {
      opt.display_order = 1 + index * 5;
    });
    
    tab.options = [...tempOptions, ...deletedOptions];
  }
  
  dragIndex.value = null;
  dragTab.value = null;
};

const handleDragEnd = (tab) => {
  dragIndex.value = null;
  dragTab.value = null;
};

const handleAddChildField = () => {
  if (!fieldFormData.id) {
    ElMessage.warning('请先保存当前字段，再添加子字段');
    return;
  }
  
  const newChildTab = {
    id: `child-tab-${Date.now()}`,
    field_id: null,
    parent_field_id: fieldFormData.id,
    field_level: fieldFormData.field_level + 1,
    field_name: '',
    field_code: '',
    status: 'enabled',
    description: '',
    options: [],
    loading: false,
    isChildField: true,
    isTemp: true,
    selectedOptions: [],
    deletedOptionIds: new Set()
  };
  
  optionTabs.value.push(newChildTab);
  optionActiveTab.value = newChildTab.id;
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

const handleExport = async () => {
  try {
    let url = 'http://localhost:3000/api/field-options/export/download';
    const params = new URLSearchParams();
    if (fieldSearchKeyword.value) {
      params.append('keyword', fieldSearchKeyword.value);
    }
    if (fieldStatusFilter.value) {
      params.append('status', fieldStatusFilter.value);
    }
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('导出失败');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `field_options_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
    
    ElMessage.success('导出成功');
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败');
  }
};

const handleDownloadTemplate = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/field-options/import/template', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('下载模板失败');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'field_options_import_template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
    
    ElMessage.success('模板下载成功');
  } catch (error) {
    console.error('下载模板失败:', error);
    ElMessage.error('下载模板失败');
  }
};

const handleFileChange = (file) => {
  importFile.value = file.raw;
};

const handleImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件');
    return;
  }
  
  try {
    importing.value = true;
    const formData = new FormData();
    formData.append('file', importFile.value);
    
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/field-options/import/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.code === 200) {
      ElMessage.success(`导入成功！字段数：${result.data.fieldCount}，选项数：${result.data.optionCount}`);
      importDialogVisible.value = false;
      importFile.value = null;
      if (importFileRef.value) {
        importFileRef.value.clearFiles();
      }
      loadFieldList();
      loadAllFields();
      loadOptionList();
    } else {
      ElMessage.error(result.message || '导入失败');
    }
  } catch (error) {
    console.error('导入失败:', error);
    ElMessage.error('导入失败');
  } finally {
    importing.value = false;
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
  padding: 4px 0;
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

.child-field-info {
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.child-field-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.child-field-form {
  background-color: #fff;
}

.tab-toolbar {
  display: flex;
  gap: 10px;
  padding: 4px 0;
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
}

.parent-field-select {
  width: 200px;
}

.drag-handle {
  cursor: move;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.drag-handle:hover {
  background-color: #f0f9eb;
}

.hidden-row {
  display: none !important;
}

/* 确保表格行被正确隐藏 */
el-table .el-table__row.hidden-row {
  display: none !important;
  height: 0 !important;
  overflow: hidden !important;
  border: none !important;
}

/* 字段树样式 */
.field-tree-layout {
  display: flex;
  height: 600px;
}

.field-tree-left {
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.tree-toolbar {
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.field-tree-left :deep(.el-tree) {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.tree-node-label {
  font-weight: 500;
  color: #303133;
}

.tree-node-code {
  color: #909399;
  font-size: 13px;
}

.tree-node-level {
  margin-left: auto;
}
</style>