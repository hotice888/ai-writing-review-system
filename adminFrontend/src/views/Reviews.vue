<template>
  <div class="reviews">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>评审管理</span>
          <el-radio-group v-model="statusFilter" @change="handleFilterChange">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="pending">待审核</el-radio-button>
            <el-radio-button label="approved">已通过</el-radio-button>
            <el-radio-button label="rejected">已拒绝</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <TablePage
        :data="reviewList"
        :loading="loading"
        :total="total"
        :page="page"
        :page-size="pageSize"
        @page-change="handlePageChange"
      >
        <el-table-column prop="id" label="评审ID" width="180" />
        <el-table-column prop="userId" label="用户ID" width="150" />
        <el-table-column prop="title" label="标题" width="200" />
        <el-table-column prop="score" label="评分" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="200">
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <div style="display: flex; gap: 8px; align-items: center;">
              <el-button
                type="success"
                size="small"
                @click="handleApprove(row)"
                v-if="row.status === 'pending'"
              >
                通过
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="handleReject(row)"
                v-if="row.status === 'pending'"
              >
                拒绝
              </el-button>
              <el-button
                type="primary"
                size="small"
                @click="handleView(row)"
              >
                查看
              </el-button>
            </div>
          </template>
        </el-table-column>
      </TablePage>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import TablePage from '../components/TablePage.vue';
import { getReviewList, approveReview, rejectReview } from '../api/admin';
import type { Review } from '../types';

const reviewList = ref<Review[]>([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const statusFilter = ref('');

const fetchReviewList = async () => {
  loading.value = true;
  try {
    const data = await getReviewList({
      page: page.value,
      pageSize: pageSize.value,
      status: statusFilter.value,
    });
    reviewList.value = data.list;
    total.value = data.total;
  } catch (error) {
    console.error('获取评审列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (newPage: number, newPageSize: number) => {
  page.value = newPage;
  pageSize.value = newPageSize;
  fetchReviewList();
};

const handleFilterChange = () => {
  page.value = 1;
  fetchReviewList();
};

const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return typeMap[status] || 'info';
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };
  return textMap[status] || status;
};

const handleApprove = async (review: Review) => {
  try {
    await ElMessageBox.confirm(`确定要通过评审 "${review.title}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await approveReview(review.id);
    ElMessage.success('操作成功');
    fetchReviewList();
  } catch (error) {
    console.error('操作失败:', error);
  }
};

const handleReject = async (review: Review) => {
  try {
    await ElMessageBox.confirm(`确定要拒绝评审 "${review.title}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await rejectReview(review.id);
    ElMessage.success('操作成功');
    fetchReviewList();
  } catch (error) {
    console.error('操作失败:', error);
  }
};

const handleView = (review: Review) => {
  ElMessageBox.alert(review.content, review.title, {
    confirmButtonText: '关闭',
  });
};

// 格式化时间
const formatDateTime = (dateString: string) => {
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

onMounted(() => {
  fetchReviewList();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
