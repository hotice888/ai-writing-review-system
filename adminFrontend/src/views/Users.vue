<template>
  <div class="users">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>用户管理</span>
            <el-button type="primary" @click="handleAddUser" style="margin-left: 20px">
              <el-icon><Plus /></el-icon>
              新增用户
            </el-button>
          </div>
          <div class="header-right">
            <el-select
              v-model="filterRole"
              placeholder="按角色筛选"
              clearable
              style="width: 150px; margin-right: 10px"
              @clear="handleSearch"
            >
              <el-option
                v-for="role in roleList"
                :key="role.id"
                :label="role.name"
                :value="role.code"
              />
            </el-select>
            <el-select
              v-model="filterStatus"
              placeholder="按状态筛选"
              clearable
              style="width: 150px; margin-right: 10px"
              @clear="handleSearch"
            >
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户名或邮箱"
              clearable
              style="width: 200px"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>
      <TablePage
        :data="userList"
        :loading="loading"
        :total="total"
        :page="page"
        :page-size="pageSize"
        @page-change="handlePageChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="id" label="用户ID" width="180" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="roles" label="角色" width="200">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag 
                v-for="role in row.roles" 
                :key="typeof role === 'object' ? role.id : role"
                :type="(typeof role === 'object' ? role.code : role) === 'super_admin' ? 'danger' : (typeof role === 'object' ? role.code : role) === 'admin' ? 'warning' : 'primary'"
                size="small"
              >
                {{ getRoleName(typeof role === 'object' ? role.code : role) }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="120">
          <template #default="{ row }">
            <div style="display: flex; gap: 12px; align-items: center;">
              <el-button type="primary" link @click="handleEditUser(row)">
                编辑
              </el-button>
              <el-button
                v-if="!isAdminUser(row)"
                type="danger" link
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </TablePage>
    </el-card>

    <FormModal
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      :loading="dialogLoading"
      @confirm="handleConfirm"
    >
      <template #form>
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formData.username"
            placeholder="请输入用户名"
            clearable
            :disabled="isEdit && formData.username === 'admin'"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="formData.email"
            placeholder="请输入邮箱"
            clearable
          />
        </el-form-item>
        <el-form-item label="密码" :required="!isEdit">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-select v-model="formData.roles" multiple placeholder="请选择角色">
            <el-option 
              v-for="role in roleList" 
              :key="role.id" 
              :label="role.name" 
              :value="role.code" 
            />
          </el-select>
        </el-form-item>
      </template>
    </FormModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue';
import TablePage from '../components/TablePage.vue';
import FormModal from '../components/FormModal.vue';
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
} from '../api/admin';
import type { User, Role } from '../types';

const userList = ref<User[]>([]);
const roleList = ref<Role[]>([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');
const filterRole = ref('');
const filterStatus = ref('');

const dialogVisible = ref(false);
const dialogLoading = ref(false);
const isEdit = ref(false);
const currentUserId = ref('');

const formData = reactive({
  username: '',
  email: '',
  password: '',
  roles: [] as string[],
});

const fetchUserList = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value;
    }
    if (filterRole.value) {
      params.role = filterRole.value;
    }
    if (filterStatus.value) {
      params.status = filterStatus.value;
    }
    const data = await getUserList(params);
    userList.value = data.list || [];
    total.value = data.total || 0;
  } catch (error) {
    console.error('获取用户列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  fetchUserList();
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const fetchRoles = async () => {
  try {
    const res = await getRoles();
    console.log('获取角色列表响应:', res);
    console.log('响应是否为对象:', typeof res === 'object' && res !== null);
    // 检查res是否有list属性，如果有则使用list，否则使用res本身（request拦截器已经处理了后端返回的数据结构）
    roleList.value = Array.isArray(res?.list) ? res.list : (Array.isArray(res) ? res : []);
    console.log('角色列表:', roleList.value);
  } catch (error) {
    console.error('获取角色列表失败:', error);
    roleList.value = [];
  }
};

const getRoleName = (code: string) => {
  if (!Array.isArray(roleList.value)) {
    return code;
  }
  const role = roleList.value.find(r => r.code === code);
  return role?.name || code;
};

const isAdminUser = (user: User) => {
  return user.username === 'admin';
};

const handlePageChange = (newPage: number, newPageSize: number) => {
  page.value = newPage;
  pageSize.value = newPageSize;
  fetchUserList();
};

const handleAddUser = () => {
  isEdit.value = false;
  currentUserId.value = '';
  Object.assign(formData, {
    username: '',
    email: '',
    password: '',
    roles: ['user'],
  });
  dialogVisible.value = true;
};

const handleEditUser = async (user: User) => {
  isEdit.value = true;
  currentUserId.value = user.id;
  // 提取角色code数组
  const roleCodes = Array.isArray(user.roles) ? user.roles.map(role => {
    if (typeof role === 'object' && role !== null) {
      return (role as any).code || role;
    }
    return role;
  }) : [];
  Object.assign(formData, {
    username: user.username,
    email: user.email,
    password: '',
    roles: roleCodes,
  });
  dialogVisible.value = true;
};

const handleConfirm = async () => {
  dialogLoading.value = true;
  try {
    if (isEdit.value) {
      await updateUser(currentUserId.value, {
        username: formData.username,
        email: formData.email,
        password: formData.password || undefined,
        roles: formData.roles,
      });
      ElMessage.success('更新成功');
    } else {
      await createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        roles: formData.roles,
      });
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchUserList();
  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    dialogLoading.value = false;
  }
};

const handleDelete = async (user: User) => {
  if (isAdminUser(user)) {
    ElMessage.warning('管理员用户禁止删除');
    return;
  }
  try {
    await ElMessageBox.confirm(`确定要删除用户 ${user.username} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await deleteUser(user.id);
    ElMessage.success('删除成功');
    fetchUserList();
  } catch (error) {
    console.error('删除失败:', error);
  }
};

onMounted(() => {
  fetchUserList();
  fetchRoles();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.users {
  width: 100%;
  height: 100%;
}

/* 确保表格占满宽度 */
:deep(.el-table) {
  width: 100%;
}

/* 确保卡片占满宽度 */
.el-card {
  width: 100%;
}

/* 减小卡片内边距，使列表更紧凑 */
.el-card__body {
  padding: 10px;
}

/* 复选框和序号列居中 */
:deep(.el-table-column--selection .cell),
:deep(.el-table-column--index .cell) {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 优化操作列宽度 */
:deep(.el-table-column--fixed-right) {
  width: 150px !important;
}

/* 减小表格单元格内边距 */
:deep(.el-table th>.cell, .el-table td>.cell) {
  padding: 8px 12px;
}
</style>