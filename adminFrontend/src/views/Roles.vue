<template>
  <div class="roles">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>角色管理</span>
            <el-button type="primary" @click="handleAdd" style="margin-left: 20px">
              <el-icon><Plus /></el-icon>
              新增角色
            </el-button>
          </div>
          <div class="header-right">
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
              placeholder="搜索角色名称或编码"
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

      <el-table :data="roleList" border v-loading="loading">
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="name" label="角色名称" min-width="150" />
        <el-table-column prop="code" label="角色代码" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="success" link @click="handleMember(row)">
              成员
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 角色表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色代码" prop="code">
          <el-input 
            v-model="form.code" 
            placeholder="请输入角色代码，如：admin" 
            :disabled="isSystemRole"
          />
          <el-text v-if="isSystemRole" type="warning" size="small">
            系统内置角色代码不允许修改
          </el-text>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="管理端菜单" name="admin">
              <el-tree
                ref="adminTreeRef"
                :data="adminMenus"
                show-checkbox
                node-key="id"
                :props="{ label: 'name', children: 'children' }"
                :default-checked-keys="selectedMenus.admin"
                :render-content="renderContent"
                :disabled="(data: any) => !data.needPermission"
              />
            </el-tab-pane>
            <el-tab-pane label="用户端菜单" name="home">
              <el-tree
                ref="homeTreeRef"
                :data="homeMenus"
                show-checkbox
                node-key="id"
                :props="{ label: 'name', children: 'children' }"
                :default-checked-keys="selectedMenus.home"
                :render-content="renderContent"
                :disabled="(data: any) => !data.needPermission"
              />
            </el-tab-pane>
          </el-tabs>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 成员管理对话框 -->
    <el-dialog
      v-model="memberDialogVisible"
      title="成员管理"
      width="800px"
      :close-on-click-modal="false"
      @close="handleMemberDialogClose"
    >
      <div class="member-search">
        <div class="search-left">
          <el-input
            v-model="memberSearchKeyword"
            placeholder="搜索用户名或邮箱"
            clearable
            style="width: 300px"
            @clear="fetchRoleMembers"
            @keyup.enter="fetchRoleMembers"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button 
            v-if="selectedMembers.length > 0" 
            type="danger" 
            size="small" 
            @click="handleBatchRemoveMembers"
            style="margin-left: 10px"
          >
            批量移除 ({{ selectedMembers.length }})
          </el-button>
        </div>
        <el-button type="primary" size="small" @click="handleAddMember">
          <el-icon><Plus /></el-icon>
          添加成员
        </el-button>
      </div>
      <el-table 
        :data="memberList" 
        border 
        v-loading="memberLoading" 
        style="margin-top: 10px"
        @selection-change="handleMemberSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="created_at" label="添加时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleRemoveMember(row)">
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="memberPage"
          v-model:page-size="memberPageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="memberTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchRoleMembers"
          @current-change="fetchRoleMembers"
        />
      </div>
    </el-dialog>

    <!-- 添加成员对话框 -->
    <el-dialog
      v-model="addMemberDialogVisible"
      title="添加成员"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="member-search">
        <el-input
          v-model="addMemberSearchKeyword"
          placeholder="搜索用户名或邮箱"
          clearable
          style="width: 300px"
          @clear="fetchAvailableUsers"
          @keyup.enter="fetchAvailableUsers"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <el-table
        :data="availableUsers"
        border
        v-loading="addMemberLoading"
        style="margin-top: 10px; max-height: 400px; overflow-y: auto"
        @selection-change="handleUserSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="addMemberPage"
          v-model:page-size="addMemberPageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="addMemberTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchAvailableUsers"
          @current-change="fetchAvailableUsers"
        />
      </div>
      <template #footer>
        <el-button @click="addMemberDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAddMember" :loading="addMemberSubmitLoading">
          确定添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import request from '../utils/request';
import { useUserStore } from '../stores/user';

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  created_at: string;
  menus?: Menu[];
}

interface Menu {
  id: string;
  name: string;
  path: string;
  component: string;
  icon: string;
  parentId: string | null;
  sortOrder: number;
  type: string;
  isShow: boolean;
  clientType: string;
  needPermission: boolean;
  children?: Menu[];
}

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  created_at: string;
}

const userStore = useUserStore();
const roleList = ref<Role[]>([]);
const adminMenus = ref<Menu[]>([]);
const homeMenus = ref<Menu[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref();
const adminTreeRef = ref();
const homeTreeRef = ref();
const activeTab = ref('admin');

// 分页
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const searchKeyword = ref('');
const filterStatus = ref('');

// 成员管理相关
const memberDialogVisible = ref(false);
const addMemberDialogVisible = ref(false);
const currentRole = ref<Role | null>(null);
const memberList = ref<User[]>([]);
const memberLoading = ref(false);
const memberPage = ref(1);
const memberPageSize = ref(10);
const memberTotal = ref(0);
const memberSearchKeyword = ref('');

// 添加成员相关
const availableUsers = ref<User[]>([]);
const addMemberLoading = ref(false);
const addMemberSubmitLoading = ref(false);
const addMemberPage = ref(1);
const addMemberPageSize = ref(10);
const addMemberTotal = ref(0);
const addMemberSearchKeyword = ref('');
const selectedUserIds = ref<string[]>([]);

// 批量移除成员相关
const selectedMembers = ref<User[]>([]);

const selectedMenus = reactive({
  admin: [] as string[],
  home: [] as string[],
});

const form = reactive({
  id: '',
  name: '',
  code: '',
  description: '',
});

// 系统内置角色代码
const SYSTEM_ROLES = ['super_admin', 'admin', 'developer', 'user'];

// 判断是否为系统内置角色
const isSystemRole = computed(() => {
  return SYSTEM_ROLES.includes(form.code);
});

const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色代码', trigger: 'blur' }],
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN');
};

const handleSearch = () => {
  page.value = 1;
  fetchRoles();
};

const fetchRoles = async () => {
  loading.value = true;
  console.log('开始执行fetchRoles函数');
  let res: any;
  try {
    console.log('用户store登录状态:', userStore.isLoggedIn);
    console.log('用户store token存在:', !!userStore.token);
    console.log('localStorage token存在:', !!localStorage.getItem('token'));
    
    if (!userStore.isLoggedIn) {
      console.error('用户未登录，无法获取角色列表');
      roleList.value = [];
      total.value = 0;
      return;
    }
    
    console.log('准备发送请求到:', 'http://localhost:3000/api/roles');
    console.log('请求参数:', {
      page: page.value,
      pageSize: pageSize.value,
      includeDisabled: 'true',
    });
    
    // 使用request实例，与fetchMenus保持一致
    console.log('准备发送请求到: /roles');
    console.log('请求参数:', {
      page: page.value,
      pageSize: pageSize.value,
      includeDisabled: 'true',
    });
    
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      includeDisabled: 'true',
    };
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value;
    }
    if (filterStatus.value) {
      params.status = filterStatus.value;
    }
    
    res = await request.get<any, { list: Role[]; total: number }>('/roles', {
      params
    });
    console.log('请求成功，响应:', res);
    // 正确处理分页响应（request拦截器已经处理了后端返回的数据结构）
    roleList.value = Array.isArray(res?.list) ? res.list : [];
    total.value = res?.total || 0;
    console.log('角色列表:', roleList.value);
    console.log('角色数量:', roleList.value.length);
  } catch (error: any) {
    console.error('获取角色列表失败:', error);
    console.error('错误信息:', error.message);
    roleList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
    console.log('fetchRoles函数执行完毕');
  }
};

const fetchMenus = async () => {
  try {
    const [adminRes, homeRes] = await Promise.all([
      request.get<any, Menu[]>('/menus?clientType=admin'),
      request.get<any, Menu[]>('/menus?clientType=home'),
    ]);
    adminMenus.value = adminRes;
    homeMenus.value = homeRes;
  } catch (error) {
    console.error('获取菜单列表失败:', error);
  }
};

const renderContent = (h: any, { data }: any) => {
  return h('span', {
    class: 'menu-item'
  }, [
    h('span', {
      class: {
        'menu-name': true,
        'no-permission': !data.needPermission
      }
    }, data.name)
  ]);
};

const resetForm = () => {
  form.id = '';
  form.name = '';
  form.code = '';
  form.description = '';
  selectedMenus.admin = [];
  selectedMenus.home = [];
};

const handleAdd = () => {
  isEdit.value = false;
  resetForm();
  
  // 自动添加不需要权限的菜单
  const noPermissionAdminMenus = adminMenus.value
    .filter(menu => !menu.needPermission)
    .map(menu => menu.id);
  const noPermissionHomeMenus = homeMenus.value
    .filter(menu => !menu.needPermission)
    .map(menu => menu.id);
  
  selectedMenus.admin = noPermissionAdminMenus;
  selectedMenus.home = noPermissionHomeMenus;
  
  dialogVisible.value = true;
};

const handleEdit = async (row: Role) => {
  isEdit.value = true;
  form.id = row.id;
  form.name = row.name;
  form.code = row.code;
  form.description = row.description;

  try {
    const res = await request.get<any, { menus: Menu[] }>(`/roles/${row.id}`);
    if (res.menus) {
      selectedMenus.admin = res.menus
        .filter((m: Menu) => m.clientType === 'admin')
        .map((m: Menu) => m.id);
      selectedMenus.home = res.menus
        .filter((m: Menu) => m.clientType === 'home')
        .map((m: Menu) => m.id);
    }
  } catch (error) {
    console.error('获取角色详情失败:', error);
  }

  // 自动添加不需要权限的菜单
  const noPermissionAdminMenus = adminMenus.value
    .filter(menu => !menu.needPermission)
    .map(menu => menu.id);
  const noPermissionHomeMenus = homeMenus.value
    .filter(menu => !menu.needPermission)
    .map(menu => menu.id);
  
  selectedMenus.admin = [...new Set([...selectedMenus.admin, ...noPermissionAdminMenus])];
  selectedMenus.home = [...new Set([...selectedMenus.home, ...noPermissionHomeMenus])];

  dialogVisible.value = true;
};

const handleDelete = async (row: Role) => {
  try {
    await ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
      type: 'warning',
    });
    await request.delete(`/roles/${row.id}`);
    ElMessage.success('删除成功');
    fetchRoles();
  } catch (error: any) {
    // 请求拦截器已经处理了错误消息显示，这里不需要重复显示
    if (error !== 'cancel') {
      console.error('删除失败:', error);
    }
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      try {
        // 获取选中的菜单
        const adminChecked = adminTreeRef.value?.getCheckedKeys() || [];
        const homeChecked = homeTreeRef.value?.getCheckedKeys() || [];
        
        // 获取所有不需要权限的菜单
        const noPermissionMenus = [
          ...(adminMenus.value || []),
          ...(homeMenus.value || [])
        ].filter(menu => !menu.needPermission).map(menu => menu.id);
        
        // 合并选中的菜单和不需要权限的菜单（去重）
        const menuIds = [...new Set([...adminChecked, ...homeChecked, ...noPermissionMenus])];

        const data = {
          name: form.name,
          code: form.code,
          description: form.description,
          menuIds,
        };

        if (isEdit.value) {
          await request.put(`/roles/${form.id}`, data);
          ElMessage.success('更新成功');
        } else {
          await request.post('/roles', data);
          ElMessage.success('创建成功');
        }

        dialogVisible.value = false;
        fetchRoles();
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败');
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  page.value = 1;
  fetchRoles();
};

const handleCurrentChange = (val: number) => {
  page.value = val;
  fetchRoles();
};

// 角色成员管理相关方法
const handleMember = (row: Role) => {
  currentRole.value = row;
  memberDialogVisible.value = true;
  memberPage.value = 1;
  memberSearchKeyword.value = '';
  fetchRoleMembers();
};

const handleMemberDialogClose = () => {
  currentRole.value = null;
  memberList.value = [];
  selectedMembers.value = [];
};

const fetchRoleMembers = async () => {
  if (!currentRole.value) return;
  memberLoading.value = true;
  try {
    const params: any = {
      page: memberPage.value,
      pageSize: memberPageSize.value,
    };
    if (memberSearchKeyword.value) {
      params.keyword = memberSearchKeyword.value;
    }
    console.log('请求角色成员:', `/roles/${currentRole.value.id}/members`, params);
    const res = await request.get<any, { list: User[]; total: number }>(`/roles/${currentRole.value.id}/members`, { params });
    console.log('角色成员响应:', res);
    memberList.value = res.list || [];
    memberTotal.value = res.total || 0;
  } catch (error: any) {
    console.error('获取角色成员失败:', error);
    console.error('错误详情:', error.message, error.response?.data);
  } finally {
    memberLoading.value = false;
  }
};

const handleRemoveMember = async (row: User) => {
  if (!currentRole.value) return;
  try {
    await ElMessageBox.confirm('确定要移除该成员吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await request.delete(`/roles/${currentRole.value.id}/members/${row.id}`);
    ElMessage.success('移除成功');
    fetchRoleMembers();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除成员失败:', error);
    }
  }
};

// 成员选择变更
const handleMemberSelectionChange = (selection: User[]) => {
  selectedMembers.value = selection;
};

// 批量移除成员
const handleBatchRemoveMembers = async () => {
  if (!currentRole.value || selectedMembers.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确定要移除选中的 ${selectedMembers.value.length} 个成员吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    // 逐个移除成员
    const removePromises = selectedMembers.value.map(member => 
      request.delete(`/roles/${currentRole.value!.id}/members/${member.id}`)
    );
    await Promise.all(removePromises);
    
    ElMessage.success('批量移除成功');
    selectedMembers.value = [];
    fetchRoleMembers();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量移除成员失败:', error);
    }
  }
};

const handleAddMember = () => {
  addMemberDialogVisible.value = true;
  addMemberPage.value = 1;
  addMemberSearchKeyword.value = '';
  selectedUserIds.value = [];
  fetchAvailableUsers();
};

const fetchAvailableUsers = async () => {
  if (!currentRole.value) return;
  addMemberLoading.value = true;
  try {
    const params: any = {
      page: addMemberPage.value,
      pageSize: addMemberPageSize.value,
    };
    if (addMemberSearchKeyword.value) {
      params.keyword = addMemberSearchKeyword.value;
    }
    const res = await request.get<any, { list: User[]; total: number }>('/admin/users', { params });
    
    // 过滤掉已经是该角色成员的用户
    const memberIds = memberList.value.map(m => m.id);
    availableUsers.value = (res.list || []).filter((user: User) => !memberIds.includes(user.id));
    addMemberTotal.value = (res.total || 0) - memberList.value.length;
  } catch (error) {
    console.error('获取可用用户失败:', error);
  } finally {
    addMemberLoading.value = false;
  }
};

const handleUserSelectionChange = (selection: User[]) => {
  selectedUserIds.value = selection.map(u => u.id);
};

const handleConfirmAddMember = async () => {
  if (!currentRole.value || selectedUserIds.value.length === 0) {
    ElMessage.warning('请选择要添加的用户');
    return;
  }
  addMemberSubmitLoading.value = true;
  try {
    await request.post(`/roles/${currentRole.value.id}/members`, {
      userIds: selectedUserIds.value,
    });
    ElMessage.success('添加成功');
    addMemberDialogVisible.value = false;
    fetchRoleMembers();
  } catch (error) {
    console.error('添加成员失败:', error);
  } finally {
    addMemberSubmitLoading.value = false;
  }
};

onMounted(() => {
  fetchRoles();
  fetchMenus();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
}

.menu-name {
  flex: 1;
}

.no-permission {
  color: #909399;
}

.menu-tag {
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 12px;
  color: #67c23a;
  background-color: #f0f9eb;
  border-radius: 10px;
}

/* 禁选的复选框样式 */
:deep(.el-tree-node__content.is-disabled .el-checkbox__input) {
  cursor: not-allowed;
  opacity: 0.5;
}

:deep(.el-tree-node__content.is-disabled .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #c0c4cc;
  border-color: #c0c4cc;
}

.roles {
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

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.search-left {
  display: flex;
  align-items: center;
}

/* 减小表格单元格内边距 */
:deep(.el-table th>.cell, .el-table td>.cell) {
  padding: 8px 12px;
}
</style>