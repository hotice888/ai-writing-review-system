<template>
  <div class="token-logs">
    <el-card>
      <!-- 查询条件 -->
      <div class="filter-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名、模型名称"
          clearable
          style="width: 200px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="fixed-width-date-picker"
          @change="handleSearch"
        />
        <el-select
          v-model="filterBusinessType"
          placeholder="业务类型"
          clearable
          style="width: 120px"
          @change="handleSearch"
        >
          <el-option label="测试" value="test" />
          <el-option label="智能体" value="agent" />
          <el-option label="写作" value="writing" />
          <el-option label="API调用" value="api_call" />
        </el-select>
        <el-select
          v-model="filterStatus"
          placeholder="请求状态"
          clearable
          style="width: 120px"
          @change="handleSearch"
        >
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
        </el-select>
      </div>

      <!-- 统计信息 - 单行显示 -->
      <div class="stats-container" v-if="stats">
        <div class="stats-row" style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <el-button 
              type="danger" 
              size="small" 
              :disabled="selectedLogs.length === 0"
              @click="handleBatchDelete"
            >
              批量删除 ({{ selectedLogs.length }})
            </el-button>
            <div style="display: flex; gap: 20px;">
              <div class="stat-item">
                <span class="stat-label">总请求:</span>
                <span class="stat-value">{{ stats.overview.total_requests || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">成功:</span>
                <span class="stat-value success">{{ stats.overview.successful_requests || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">失败:</span>
                <span class="stat-value danger">{{ stats.overview.failed_requests || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总Token:</span>
                <span class="stat-value primary">{{ formatNumber(stats.overview.total_tokens || 0) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">请求Token:</span>
                <span class="stat-value">{{ formatNumber(stats.overview.total_prompt_tokens || 0) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">响应Token:</span>
                <span class="stat-value">{{ formatNumber(stats.overview.total_completion_tokens || 0) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均耗时:</span>
                <span class="stat-value">{{ Math.round(stats.overview.avg_duration_ms || 0) }}ms</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最大耗时:</span>
                <span class="stat-value">{{ stats.overview.max_duration_ms || 0 }}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <el-table
        v-model:selection="selectedLogs"
        :data="logList"
        :loading="loading"
        style="width: 100%"
        size="small"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="40" />
        <el-table-column prop="username" label="用户" width="100">
          <template #default="{ row }">
            <div>{{ row.username || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="model_name" label="模型名称" width="200">
          <template #default="{ row }">
            <div style="font-size: 12px; word-break: break-all">{{ row.model_name || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="model_identifier" label="模型标识" width="120">
          <template #default="{ row }">
            <div style="font-size: 12px; word-break: break-all">{{ row.model_identifier || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="business_type" label="业务类型" width="90">
          <template #default="{ row }">
            <el-tag :type="getBusinessTypeColor(row.business_type)" size="small">
              {{ getBusinessTypeName(row.business_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_tokens" label="Token使用" width="110">
          <template #default="{ row }">
            <div style="font-size: 12px">{{ row.total_tokens || 0 }}</div>
            <div style="font-size: 11px; color: #999">
              请求: {{ row.prompt_tokens || 0 }} / 响应: {{ row.completion_tokens || 0 }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="response_success" label="请求状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.response_success ? 'success' : 'danger'" size="small">
              {{ row.response_success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="response_status_code" label="状态码" width="80">
          <template #default="{ row }">
            <span :class="row.response_success ? 'text-success' : 'text-danger'">
              {{ row.response_status_code }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="duration_ms" label="耗时" width="80">
          <template #default="{ row }">
            {{ row.duration_ms || 0 }}ms
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="请求时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 15px; display: flex; justify-content: flex-end">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="请求详情" width="80%" :fullscreen="false" custom-class="token-log-detail-dialog">
      <el-descriptions :column="2" border v-if="currentLog" size="small">
        <el-descriptions-item label="请求ID">{{ currentLog.request_id }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentLog.username }} ({{ currentLog.email }})</el-descriptions-item>
        <el-descriptions-item label="模型名称">{{ currentLog.model_name }}</el-descriptions-item>
        <el-descriptions-item label="模型标识">{{ currentLog.model_identifier }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ getBusinessTypeName(currentLog.business_type) }}</el-descriptions-item>
        <el-descriptions-item label="请求URL">{{ currentLog.request_url }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">{{ currentLog.request_method }}</el-descriptions-item>
        <el-descriptions-item label="请求状态">
          <el-tag :type="currentLog.response_success ? 'success' : 'danger'" size="small">
            {{ currentLog.response_success ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态码">{{ currentLog.response_status_code }}</el-descriptions-item>
        <el-descriptions-item label="总Token">{{ currentLog.total_tokens || 0 }}</el-descriptions-item>
        <el-descriptions-item label="请求Token">{{ currentLog.prompt_tokens || 0 }}</el-descriptions-item>
        <el-descriptions-item label="响应Token">{{ currentLog.completion_tokens || 0 }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ currentLog.duration_ms || 0 }}ms</el-descriptions-item>
        <el-descriptions-item label="请求时间">{{ formatDateTime(currentLog.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2" v-if="currentLog.error_message">
          <el-text type="danger">{{ currentLog.error_message }}</el-text>
        </el-descriptions-item>
      </el-descriptions>
      
      <div style="margin-top: 15px; max-height: 700px" v-if="currentLogDetail">
        <el-row :gutter="20" style="height: 100%">
          <el-col :span="12" style="display: flex; flex-direction: column; gap: 10px; height: 100%">
            <el-card shadow="hover" style="flex: 1; min-height: 180px">
              <template #header>
                <div class="card-header" style="padding: 5px 5px; font-size: 14px; line-height: 10px">
                  <span>请求参数</span>
                </div>
              </template>
              <el-input
                v-model="currentLogDetail.request_params"
                type="textarea"
                :rows="5"
                readonly
                style="font-family: monospace; font-size: 14px; height: calc(100% - 30px)"
              />
            </el-card>
            
            <el-card shadow="hover" style="flex: 1; min-height: 180px">
              <template #header>
                <div class="card-header" style="padding: 5px 5px; font-size: 14px; line-height: 10px">
                  <span>请求消息</span>
                </div>
              </template>
              <el-input
                v-model="currentLogDetail.request_messages"
                type="textarea"
                :rows="8"
                readonly
                style="font-family: monospace; font-size: 14px; height: calc(100% - 30px)"
              />
            </el-card>
          </el-col>
          <el-col :span="12" style="height: 100%">
            <el-card shadow="hover" style="height: 100%">
              <template #header>
                <div class="card-header" style="padding: 5px 15px; font-size: 14px; line-height: 10px">
                  <span>响应数据</span>
                </div>
              </template>
              <el-input
                v-model="currentLogDetail.response_data"
                type="textarea"
                :rows="18"
                readonly
                style="font-family: monospace; font-size: 14px; height: calc(100% - 30px)"
              />
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { getTokenLogs, getTokenLogStats, getTokenLogDetail, deleteTokenLogsBatch } from '../api/tokenLogs';

const loading = ref(false);
const logList = ref([]);
const selectedLogs = ref([]);
const stats = ref(null);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const searchKeyword = ref('');
const filterBusinessType = ref('');
const filterStatus = ref('');
const dateRange = ref(null);
const detailDialogVisible = ref(false);
const currentLog = ref(null);
const currentLogDetail = ref(null);

const handleSearch = async () => {
  page.value = 1;
  await fetchLogs();
  await fetchStats();
};

const handleSelectionChange = (selection) => {
  selectedLogs.value = selection;
};

const handleBatchDelete = async () => {
  if (selectedLogs.value.length === 0) return;
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedLogs.value.length} 条日志吗？`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    const ids = selectedLogs.value.map(log => log.id);
    await deleteTokenLogsBatch(ids);
    
    ElMessage.success('批量删除成功');
    selectedLogs.value = [];
    await fetchLogs();
    await fetchStats();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error);
      ElMessage.error('批量删除失败');
    }
  }
};

const handlePageChange = (newPage) => {
  page.value = newPage;
  fetchLogs();
};

const handleSizeChange = (newSize) => {
  pageSize.value = newSize;
  page.value = 1;
  fetchLogs();
};

const fetchLogs = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value
    };
    
    if (searchKeyword.value) {
      params.search = searchKeyword.value;
    }
    
    if (filterBusinessType.value) {
      params.business_type = filterBusinessType.value;
    }
    
    if (filterStatus.value) {
      params.status = filterStatus.value;
    }
    
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0].toISOString();
      params.end_date = dateRange.value[1].toISOString();
    }
    
    const result = await getTokenLogs(params);
    logList.value = result.list;
    total.value = result.total;
  } catch (error) {
    console.error('Error fetching logs:', error);
    ElMessage.error('获取日志失败');
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const params = {};
    
    if (filterBusinessType.value) {
      params.business_type = filterBusinessType.value;
    }
    
    if (filterStatus.value) {
      params.status = filterStatus.value;
    }
    
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0].toISOString();
      params.end_date = dateRange.value[1].toISOString();
    }
    
    const result = await getTokenLogStats(params);
    stats.value = result;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

const handleViewDetail = async (row) => {
  try {
    const result = await getTokenLogDetail(row.id);
    currentLog.value = result;
    
    let requestParamsStr = '';
    let requestMessagesStr = '';
    let responseDataStr = '';
    
    try {
      if (result.request_params) {
        requestParamsStr = typeof result.request_params === 'string' 
          ? JSON.stringify(JSON.parse(result.request_params), null, 2)
          : JSON.stringify(result.request_params, null, 2);
      }
    } catch (e) {
      requestParamsStr = String(result.request_params);
    }
    
    try {
      if (result.request_messages) {
        requestMessagesStr = typeof result.request_messages === 'string' 
          ? JSON.stringify(JSON.parse(result.request_messages), null, 2)
          : JSON.stringify(result.request_messages, null, 2);
      }
    } catch (e) {
      requestMessagesStr = String(result.request_messages);
    }
    
    try {
      if (result.response_data) {
        responseDataStr = typeof result.response_data === 'string' 
          ? JSON.stringify(JSON.parse(result.response_data), null, 2)
          : JSON.stringify(result.response_data, null, 2);
      }
    } catch (e) {
      responseDataStr = String(result.response_data);
    }
    
    currentLogDetail.value = {
      request_params: requestParamsStr,
      request_messages: requestMessagesStr,
      response_data: responseDataStr
    };
    detailDialogVisible.value = true;
  } catch (error) {
    console.error('Error fetching detail:', error);
    ElMessage.error('获取详情失败');
  }
};

const getBusinessTypeName = (type) => {
  const types = {
    test: '测试',
    agent: '智能体',
    writing: '写作',
    api_call: 'API调用'
  };
  return types[type] || type;
};

const getBusinessTypeColor = (type) => {
  const colors = {
    test: 'primary',
    agent: 'success',
    writing: 'warning',
    api_call: 'info'
  };
  return colors[type] || '';
};

const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

onMounted(() => {
  fetchLogs();
  fetchStats();
});
</script>

<style scoped>
.token-logs {
  padding: 15px;
}

.token-log-detail-dialog .el-dialog__body {
  max-height: 80vh;
  overflow-y: auto;
  padding: 10px;
}

.token-log-detail-dialog .el-dialog__header {
  padding: 10px 20px;
}

.token-log-detail-dialog .el-dialog__title {
  font-size: 16px;
  line-height: 1.2;
}

.token-log-detail-dialog .el-descriptions {
  margin-bottom: 10px;
}

.token-log-detail-dialog .el-descriptions__item {
  padding: 8px 15px;
  line-height: 1.2;
}

.token-log-detail-dialog .el-descriptions__label {
  font-size: 13px;
  line-height: 1.2;
}

.token-log-detail-dialog .el-descriptions__content {
  font-size: 13px;
  line-height: 1.2;
}

.token-log-detail-dialog .el-card {
  margin-bottom: 10px;
}

.token-log-detail-dialog :deep(.el-card__header) {
  padding: 8px 15px !important;
  height: auto;
  line-height: 1.2;
  min-height: 32px;
  margin: 0 !important;
}

.token-log-detail-dialog .el-card__body {
  padding: 8px;
}

.token-log-detail-dialog .el-input__inner {
  font-size: 13px;
  line-height: 1.2;
  padding: 6px 12px;
}

.token-log-detail-dialog .el-textarea__inner {
  font-size: 13px;
  line-height: 1.3;
  padding: 8px 12px;
  min-height: 80px;
}

.filter-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.stats-container {
  margin-bottom: 15px;
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stats-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.stat-value {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.stat-value.primary {
  color: #409EFF;
}

.stat-value.success {
  color: #67C23A;
}

.stat-value.danger {
  color: #F56C6C;
}

.text-success {
  color: #67C23A;
}

.text-danger {
  color: #F56C6C;
}

:deep(.el-table) {
  width: 100% !important;
}

:deep(.el-table__row) {
  height: 50px !important;
}

:deep(.el-table__column) {
  min-width: 0 !important;
}

:deep(.el-table__header-wrapper), :deep(.el-table__body-wrapper) {
  width: 100% !important;
}

:deep(.el-table__header), :deep(.el-table__body) {
  width: 100% !important;
}

:deep(.el-table__header th), :deep(.el-table__body td) {
  box-sizing: border-box;
}

.fixed-width-date-picker {
  width: 180px !important;
  min-width: 180px !important;
  max-width: 180px !important;
  flex-shrink: 0 !important;
}

.fixed-width-date-picker :deep(.el-date-editor) {
  width: 180px !important;
  min-width: 180px !important;
  max-width: 180px !important;
  flex-shrink: 0 !important;
}

.fixed-width-date-picker :deep(.el-input__wrapper) {
  width: 180px !important;
  min-width: 180px !important;
  max-width: 180px !important;
  flex-shrink: 0 !important;
}

.fixed-width-date-picker :deep(.el-range-editor) {
  width: 180px !important;
  min-width: 180px !important;
  max-width: 180px !important;
  flex-shrink: 0 !important;
}
</style>
