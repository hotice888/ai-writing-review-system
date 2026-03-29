<template>
  <div class="table-page">
    <div class="table-header">
      <slot name="header"></slot>
    </div>
    <el-table
      :data="tableData"
      v-loading="loading"
      :border="border"
      :stripe="stripe"
      @selection-change="handleSelectionChange"
    >
      <slot></slot>
    </el-table>
    <div class="table-pagination" v-if="showPagination">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

interface Props {
  data: any[];
  loading?: boolean;
  border?: boolean;
  stripe?: boolean;
  showPagination?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  border: true,
  stripe: true,
  showPagination: true,
  total: 0,
  page: 1,
  pageSize: 10,
});

const emit = defineEmits<{
  (e: 'selection-change', selection: any[]): void;
  (e: 'page-change', page: number, pageSize: number): void;
}>();

const tableData = ref(props.data);
const currentPage = ref(props.page);
const pageSizeValue = ref(props.pageSize);

watch(
  () => props.data,
  (newData) => {
    tableData.value = newData;
  }
);

watch(
  () => props.page,
  (newPage) => {
    currentPage.value = newPage;
  }
);

watch(
  () => props.pageSize,
  (newPageSize) => {
    pageSizeValue.value = newPageSize;
  }
);

const handleSelectionChange = (selection: any[]) => {
  emit('selection-change', selection);
};

const handleSizeChange = (size: number) => {
  pageSizeValue.value = size;
  emit('page-change', currentPage.value, size);
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  emit('page-change', page, pageSizeValue.value);
};
</script>

<style scoped>
.table-page {
  padding: 0;
}

.table-header {
  margin-bottom: 10px;
}

.table-pagination {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
</style>
