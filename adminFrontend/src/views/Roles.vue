<template>
  <div class="roles">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>角色管理</h2>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索角色名称或编码"
              clearable
              style="width: 300px; margin-right: 10px"
              @clear="fetchRoles"
              @keyup.enter="fetchRoles"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="filterStatus"
              placeholder="按状态筛选"
              clearable
              style="width: 150px; margin-right: 10px"
              @change="fetchRoles"
            >
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
            </el-select>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon> 新增角色
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="roleList"
        border
        v-loading="loading"
        style="width: 100%"
        stripe
        :row-style="{ transition: 'all 0.3s ease' }"
        :cell-style="{ transition: 'all 0.3s ease' }"
      >
        <el-table-column type="selection" width="40" align="center" />
        <el-table-column type="index" label="序号" width="50" align="center" />
        <el-table-column prop="name" label="角色名称" width="100" show-overflow-tooltip />
        <el-table-column prop="code" label="角色编码" width="120" show-overflow-tooltip />
        <el-table-column prop="description" label="角色描述" min-width="280" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'danger'" size="small" effect="plain">
              {{ row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="140" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="280" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" plain round @click="handleEdit(row)" style="margin-right: 8px">
              编辑
            </el-button>
            <el-button type="info" size="small" plain round @click="handlePermission(row)" style="margin-right: 8px">
              权限
            </el-button>
            <el-button type="warning" size="small" plain round @click="handleMember(row)" style="margin-right: 8px">
              成员
            </el-button>
            <el-button type="danger" size="small" plain round @click="handleDelete(row)">
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
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        label-width="80px"
        style="margin-top: 20px"
      >
        <el-form-item label="角色名称" prop="name" :rules="[{ required: true, message: '请输入角色名称', trigger: 'blur' }]">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code" :rules="[{ required: true, message: '请输入角色编码', trigger: 'blur' }]">
          <el-input v-model="form.code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="父角色" prop="parent_ids">
          <el-select
            v-model="form.parent_ids"
            multiple
            placeholder="请选择父角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.name"
              :value="role.id"
              :disabled="isEdit && form.id === role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="管理端" name="admin">
              <el-tree
                ref="adminTreeRef"
                :data="adminMenus"
                show-checkbox
                node-key="id"
                :default-checked-keys="selectedMenus.admin"
                :props="{
                  children: 'children',
                  label: (menu: Menu) => {
                    return menu.needPermission ? menu.name : `${menu.name} [全员]`;
                  },
                }"
                style="width: 100%; max-height: 600px; overflow-y: auto"
              />
            </el-tab-pane>
            <el-tab-pane label="用户端" name="home">
              <el-tree
                ref="homeTreeRef"
                :data="homeMenus"
                show-checkbox
                node-key="id"
                :default-checked-keys="selectedMenus.home"
                :props="{
                  children: 'children',
                  label: (menu: Menu) => {
                    return menu.needPermission ? menu.name : `${menu.name} [全员]`;
                  },
                }"
                style="width: 100%; max-height: 600px; overflow-y: auto"
              />
            </el-tab-pane>
          </el-tabs>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 成员管理对话框 -->
    <el-dialog
      v-model="memberDialogVisible"
      :title="`${currentRole?.name} 成员管理`"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="member-search">
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
        <el-button type="primary" @click="handleAddMember">
          <el-icon><Plus /></el-icon> 添加成员
        </el-button>
      </div>
      <el-table
        :data="memberList"
        border
        v-loading="memberLoading"
        style="margin-top: 10px; max-height: 500px; overflow-y: auto"
        @selection-change="handleMemberSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="created_at" label="加入时间" width="180" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="handleRemoveMember(row)">
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
          layout="total, sizes, prev, pager, next, jumper"
          :total="memberTotal"
          @size-change="handleMemberSizeChange"
          @current-change="handleMemberCurrentChange"
        />
      </div>
      <div v-if="selectedMembers.length > 0" style="margin-top: 10px; text-align: right">
        <el-button type="danger" @click="handleBatchRemoveMembers">
          批量移除 ({{ selectedMembers.length }})
        </el-button>
      </div>
      <template #footer>
        <el-button @click="memberDialogVisible = false">关闭</el-button>
      </template>
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
        style="margin-top: 10px; max-height: 500px; overflow-y: auto"
        @selection-change="handleUserSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="addMemberPage"
          v-model:page-size="addMemberPageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="addMemberTotal"
          @size-change="handleAddMemberSizeChange"
          @current-change="handleAddMemberCurrentChange"
        />
      </div>
      <template #footer>
        <el-button @click="addMemberDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAddMember" :loading="addMemberSubmitLoading">
          确定添加
        </el-button>
      </template>
    </el-dialog>

    <!-- 权限详情对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      :title="`${currentRole?.name} 权限详情`"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="permission-search">
        <el-input
          v-model="permissionSearchKeyword"
          placeholder="搜索菜单名称或编码"
          clearable
          style="width: 300px; margin-right: 10px"
          @clear="filterPermissions"
          @keyup.enter="filterPermissions"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="permissionClientFilter"
          placeholder="按客户端筛选"
          clearable
          style="width: 150px; margin-right: 10px"
          @change="filterPermissions"
        >
          <el-option label="管理端" value="admin" />
          <el-option label="用户端" value="home" />
        </el-select>
        <el-select
          v-model="permissionTypeFilter"
          placeholder="按权限类型筛选"
          clearable
          style="width: 150px"
          @change="filterPermissions"
        >
          <el-option label="直接权限" value="direct" />
          <el-option label="继承权限" value="inherited" />
          <el-option label="公开权限" value="public" />
        </el-select>
      </div>
      <el-table
        :data="filteredPermissions"
        border
        v-loading="permissionLoading"
        style="margin-top: 10px; max-height: 500px; overflow-y: auto"
      >
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column label="菜单名称" min-width="150">
          <template #default="{ row }">
            {{ row.name }}
          </template>
        </el-table-column>
        <el-table-column prop="code" label="菜单编码" min-width="150" />
        <el-table-column prop="clientType" label="客户端" width="100">
          <template #default="{ row }">
            <el-tag :type="row.clientType === 'admin' ? 'primary' : 'success'">
              {{ row.clientType === 'admin' ? '管理端' : '用户端' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getPermissionTypeColor(row)">
              {{ getPermissionTypeLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="继承来源" min-width="150">
          <template #default="{ row }">
            <span v-if="row.inheritanceType === 'inherited' && row.source">
              {{ row.source }}
            </span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">关闭</el-button>
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
  parent_ids?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  directMenus?: Menu[];
  allMenus?: (Menu & { source: string; inheritanceType: 'direct' | 'inherited' })[];
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
  isShow?: boolean;
  clientType: string;
  needPermission: boolean;
  children?: Menu[];
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  position?: string;
  code?: string;
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

// 权限详情相关
const permissionDialogVisible = ref(false);
const permissionLoading = ref(false);
const permissionSearchKeyword = ref('');
const permissionClientFilter = ref('');
const permissionTypeFilter = ref('');
const rolePermissions = ref<any[]>([]);

const selectedMenus = reactive({
  admin: [] as string[],
  home: [] as string[],
});

const form = reactive({
  id: '',
  name: '',
  code: '',
  description: '',
  parent_ids: [] as string[],
});

// 获取角色列表
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
    
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
    };
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value;
    }
    
    if (filterStatus.value) {
      params.status = filterStatus.value;
    }
    
    console.log('发送请求获取角色列表，参数:', params);
    res = await request.get<any, { list: Role[]; total: number }>('/roles', { params });
    console.log('获取角色列表成功，响应:', res);
    
    roleList.value = res.list || [];
    total.value = res.total || 0;
  } catch (error: any) {
    console.error('获取角色列表失败:', error);
    roleList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 获取菜单列表
const fetchMenus = async () => {
  try {
    const res = await request.get<any, Menu[]>('/menus');
    // 按客户端类型分组
    adminMenus.value = res.filter(menu => menu.clientType === 'admin');
    homeMenus.value = res.filter(menu => menu.clientType === 'home');
  } catch (error) {
    console.error('获取菜单列表失败:', error);
  }
};

// 处理新增角色
const handleAdd = () => {
  isEdit.value = false;
  form.id = '';
  form.name = '';
  form.code = '';
  form.description = '';
  form.parent_ids = [];
  selectedMenus.admin = [];
  selectedMenus.home = [];
  dialogVisible.value = true;
};

// 处理编辑角色
const handleEdit = async (row: Role) => {
  isEdit.value = true;
  form.id = row.id;
  form.name = row.name;
  form.code = row.code;
  form.description = row.description || '';
  form.parent_ids = row.parent_ids || [];
  
  if (!row.id) {
    console.error('角色ID不存在');
    return;
  }
  console.log('准备发送请求到:', `/roles/${row.id}`);
  const res = await request.get<any, Role>(`/roles/${row.id}`);
  console.log('获取角色详情成功，响应:', res);
  // 设置父角色
  form.parent_ids = res.parent_ids || [];
  
  // 清空之前的选择
  selectedMenus.admin = [];
  selectedMenus.home = [];
  
  // 设置直接菜单权限（根据映射关系判断）
  if (res.directMenus) {
    selectedMenus.admin = res.directMenus
      .filter((m: Menu) => m.clientType === 'admin')
      .map((m: Menu) => m.id);
    selectedMenus.home = res.directMenus
      .filter((m: Menu) => m.clientType === 'home')
      .map((m: Menu) => m.id);
  }
  
  dialogVisible.value = true;
};

// 处理删除角色
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

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      try {
        // 获取选中的菜单
        const adminChecked = adminTreeRef.value?.getCheckedKeys() || [];
        const homeChecked = homeTreeRef.value?.getCheckedKeys() || [];
        
        // 合并选中的菜单（去重）
        const menuIds = [...new Set([...adminChecked, ...homeChecked])];

        const data = {
          name: form.name,
          code: form.code,
          description: form.description,
          parentIds: form.parent_ids,
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

// 处理成员管理
const handleMember = (row: Role) => {
  currentRole.value = row;
  memberDialogVisible.value = true;
  memberPage.value = 1;
  memberSearchKeyword.value = '';
  selectedMembers.value = [];
  fetchRoleMembers();
};

// 获取角色成员
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
    
    const res = await request.get<any, { list: User[]; total: number }>(`/roles/${currentRole.value.id}/members`, { params });
    memberList.value = res.list || [];
    memberTotal.value = res.total || 0;
  } catch (error) {
    console.error('获取角色成员失败:', error);
    memberList.value = [];
    memberTotal.value = 0;
  } finally {
    memberLoading.value = false;
  }
};

// 移除成员
const handleRemoveMember = async (member: User) => {
  if (!currentRole.value) return;
  try {
    await ElMessageBox.confirm(`确定要移除成员 ${member.username} 吗？`, '提示', {
      type: 'warning',
    });
    await request.delete(`/roles/${currentRole.value.id}/members/${member.id}`);
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

// 处理添加成员
const handleAddMember = () => {
  addMemberDialogVisible.value = true;
  addMemberPage.value = 1;
  addMemberSearchKeyword.value = '';
  selectedUserIds.value = [];
  fetchAvailableUsers();
};

// 获取可用用户
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

// 用户选择变更
const handleUserSelectionChange = (selection: User[]) => {
  selectedUserIds.value = selection.map(u => u.id);
};

// 确认添加成员
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

// 处理权限详情
const handlePermission = async (row: Role) => {
  currentRole.value = row;
  permissionDialogVisible.value = true;
  permissionLoading.value = true;
  permissionSearchKeyword.value = '';
  permissionClientFilter.value = '';
  permissionTypeFilter.value = '';
  
  try {
    const res = await request.get<any, Role>(`/roles/${row.id}`);
    console.log('获取角色权限详情响应:', res);
    if (res.allMenus) {
      console.log('allMenus长度:', res.allMenus.length);
      console.log('allMenus内容:', res.allMenus);
      rolePermissions.value = res.allMenus;
    } else {
      rolePermissions.value = [];
    }
  } catch (error) {
    console.error('获取角色权限失败:', error);
    rolePermissions.value = [];
  } finally {
    permissionLoading.value = false;
  }
};

// 过滤后的权限列表
const filteredPermissions = computed(() => {
  let permissions = [...rolePermissions.value];
  
  console.log('原始权限列表长度:', permissions.length);
  console.log('原始权限列表内容:', permissions);
  
  // 按角色code排序
  permissions.sort((a, b) => {
    if (a.code && b.code) {
      return a.code.localeCompare(b.code);
    }
    return 0;
  });
  
  // 按搜索关键词过滤
  if (permissionSearchKeyword.value) {
    const keyword = permissionSearchKeyword.value.toLowerCase();
    permissions = permissions.filter(permission => 
      permission.name.toLowerCase().includes(keyword) || 
      (permission.code && permission.code.toLowerCase().includes(keyword))
    );
  }
  
  // 按客户端过滤
  if (permissionClientFilter.value) {
    permissions = permissions.filter(permission => 
      permission.clientType === permissionClientFilter.value
    );
  }
  
  // 按权限类型过滤
  if (permissionTypeFilter.value) {
    permissions = permissions.filter(permission => {
      if (permissionTypeFilter.value === 'public') {
        return !permission.needPermission;
      }
      return permission.inheritanceType === permissionTypeFilter.value;
    });
  }
  
  console.log('过滤后权限列表长度:', permissions.length);
  console.log('过滤后权限列表内容:', permissions);
  
  return permissions;
});

// 获取权限类型颜色
const getPermissionTypeColor = (row: any) => {
  if (!row.needPermission) return 'info';
  if (row.inheritanceType === 'direct') return 'primary';
  if (row.inheritanceType === 'inherited') return 'warning';
  return '';
};

// 获取权限类型标签
const getPermissionTypeLabel = (row: any) => {
  if (!row.needPermission) return '公开权限';
  if (row.inheritanceType === 'direct') return '直接权限';
  if (row.inheritanceType === 'inherited') return '继承权限';
  return '';
};

// 处理搜索
const handleSearch = () => {
  page.value = 1;
  fetchRoles();
};

// 处理分页大小变更
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  page.value = 1;
  fetchRoles();
};

// 处理当前页变更
const handleCurrentChange = (val: number) => {
  page.value = val;
  fetchRoles();
};

// 处理成员分页大小变更
const handleMemberSizeChange = (val: number) => {
  memberPageSize.value = val;
  memberPage.value = 1;
  fetchRoleMembers();
};

// 处理成员当前页变更
const handleMemberCurrentChange = (val: number) => {
  memberPage.value = val;
  fetchRoleMembers();
};

// 处理添加成员分页大小变更
const handleAddMemberSizeChange = (val: number) => {
  addMemberPageSize.value = val;
  addMemberPage.value = 1;
  fetchAvailableUsers();
};

// 处理添加成员当前页变更
const handleAddMemberCurrentChange = (val: number) => {
  addMemberPage.value = val;
  fetchAvailableUsers();
};

// 过滤权限
const filterPermissions = () => {
  // 计算属性会自动更新
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
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

.permission-search {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.text-gray {
  color: #909399;
}
</style>