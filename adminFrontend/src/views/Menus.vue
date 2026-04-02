<template>
  <div class="menus">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>菜单管理</span>
            <el-button type="primary" @click="handleAdd" style="margin-left: 20px">
              <el-icon><Plus /></el-icon>
              新增菜单
            </el-button>
          </div>
          <div class="header-right">
            <el-select
              v-model="filterClientType"
              placeholder="按客户端筛选"
              clearable
              style="width: 150px; margin-right: 10px"
              @clear="handleSearch"
              @change="handleSearch"
            >
              <el-option label="管理端" value="admin" />
              <el-option label="用户端" value="home" />
            </el-select>
            <el-select
              v-model="filterPosition"
              placeholder="按菜单位置筛选"
              clearable
              style="width: 150px; margin-right: 10px"
              @clear="handleSearch"
              @change="handleSearch"
            >
              <el-option label="左导航" value="left" />
              <el-option label="头像菜单" value="avatar" />
            </el-select>
            <el-select
              v-model="filterStatus"
              placeholder="按状态筛选"
              clearable
              style="width: 150px; margin-right: 10px"
              @clear="handleSearch"
              @change="handleSearch"
            >
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
              <el-option label="开发中" value="in_progress" />
              <el-option label="未实现" value="not_implemented" />
            </el-select>
            <el-select
              v-model="filterNeedPermission"
              placeholder="是否需要权限"
              clearable
              style="width: 150px; margin-right: 10px"
              @clear="handleSearch"
              @change="handleSearch"
            >
              <el-option label="需要权限" value="true" />
              <el-option label="无需权限" value="false" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索菜单名称或编码"
              clearable
              style="width: 200px"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>
      
      <div class="view-controls">
        <el-radio-group v-model="viewMode" size="small" @change="handleViewModeChange">
          <el-radio-button label="tree">树形视图</el-radio-button>
          <el-radio-button label="list">列表视图</el-radio-button>
        </el-radio-group>
      </div>
      
      <!-- 树形视图 -->
      <el-table
        v-if="viewMode === 'tree'"
        :data="menuList"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="name" label="菜单名称" min-width="150">
          <template #default="{ row }">
            <div
              v-if="!editingRow || editingRow.id !== row.id || editingField !== 'name'"
              @dblclick="startEditing(row, 'name')"
              class="editable-cell"
            >
              {{ row.name }}
            </div>
            <el-input
              v-else
              v-model="row.name"
              size="small"
              @blur="handleInlineEdit(row, 'name')"
              @keyup.enter="handleInlineEdit(row, 'name')"
              @keyup.esc="cancelEditing"
              ref="nameInput"
              auto-focus
            />
          </template>
        </el-table-column>
        <el-table-column prop="code" label="菜单编码" min-width="150">
          <template #default="{ row }">
            <div
              v-if="!editingRow || editingRow.id !== row.id || editingField !== 'code'"
              @dblclick="startEditing(row, 'code')"
              class="editable-cell"
            >
              {{ row.code }}
            </div>
            <el-input
              v-else
              v-model="row.code"
              size="small"
              @blur="handleInlineEdit(row, 'code')"
              @keyup.enter="handleInlineEdit(row, 'code')"
              @keyup.esc="cancelEditing"
              ref="codeInput"
              auto-focus
            />
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" min-width="150" />
        <el-table-column prop="component" label="组件" min-width="150" />
        <el-table-column prop="icon" label="图标" width="100">
          <template #default="{ row }">
            <el-icon v-if="row.icon && iconComponents[row.icon]" :size="18" color="#409eff">
              <component :is="iconComponents[row.icon]" />
            </el-icon>
            <span v-else-if="row.icon" class="icon-text">{{ row.icon }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80">
          <template #default="{ row }">
            <div
              v-if="!editingRow || editingRow.id !== row.id || editingField !== 'sortOrder'"
              @dblclick="startEditing(row, 'sortOrder')"
              class="editable-cell"
            >
              {{ row.sortOrder || 0 }}
            </div>
            <el-input-number
              v-else
              v-model="row.sortOrder"
              :min="0"
              :max="999"
              size="small"
              @blur="handleInlineEdit(row, 'sortOrder')"
              @change="handleInlineEdit(row, 'sortOrder')"
              @keyup.enter="handleInlineEdit(row, 'sortOrder')"
              @keyup.esc="cancelEditing"
              ref="sortInput"
              auto-focus
            />
          </template>
        </el-table-column>
        <el-table-column prop="clientType" label="客户端" width="100">
          <template #default="{ row }">
            <div
              v-if="!editingRow || editingRow.id !== row.id || editingField !== 'clientType'"
              @dblclick="startEditing(row, 'clientType')"
              class="editable-cell"
            >
              <el-tag :type="row.clientType === 'admin' ? 'primary' : 'success'">
                {{ row.clientType === 'admin' ? '管理端' : '用户端' }}
              </el-tag>
            </div>
            <el-select
              v-else
              v-model="row.clientType"
              size="small"
              @change="handleInlineEdit(row, 'clientType')"
              @blur="handleInlineEdit(row, 'clientType')"
              @keyup.esc="cancelEditing"
              style="width: 90px"
              ref="clientTypeSelect"
            >
              <el-option label="管理端" value="admin" />
              <el-option label="用户端" value="home" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="position" label="菜单位置" width="100">
          <template #default="{ row }">
            <div
              v-if="!editingRow || editingRow.id !== row.id || editingField !== 'position'"
              @dblclick="startEditing(row, 'position')"
              class="editable-cell"
            >
              <el-tag :type="row.position === 'left' ? 'primary' : 'warning'">
                {{ row.position === 'left' ? '左导航' : '头像菜单' }}
              </el-tag>
            </div>
            <el-select
              v-else
              v-model="row.position"
              size="small"
              @change="handleInlineEdit(row, 'position')"
              @blur="handleInlineEdit(row, 'position')"
              @keyup.esc="cancelEditing"
              style="width: 90px"
              ref="positionSelect"
            >
              <el-option label="左导航" value="left" />
              <el-option label="头像菜单" value="avatar" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="needPermission" label="需要权限" width="100">
          <template #default="{ row }">
            <div
              v-if="!editingRow || editingRow.id !== row.id || editingField !== 'needPermission'"
              @dblclick="startEditing(row, 'needPermission')"
              class="editable-cell"
            >
              <el-tag :type="row.needPermission ? 'success' : 'info'">
                {{ row.needPermission ? '是' : '否' }}
              </el-tag>
            </div>
            <el-switch
              v-else
              v-model="row.needPermission"
              active-text="是"
              inactive-text="否"
              @change="handleInlineEdit(row, 'needPermission')"
              @blur="handleInlineEdit(row, 'needPermission')"
              @keyup.esc="cancelEditing"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="菜单状态" width="120">
          <template #default="{ row }">
            <div
              v-if="!editingRow || editingRow.id !== row.id || editingField !== 'status'"
              @dblclick="startEditing(row, 'status')"
              class="editable-cell"
            >
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </div>
            <el-select
              v-else
              v-model="row.status"
              size="small"
              @change="handleInlineEdit(row, 'status')"
              @blur="handleInlineEdit(row, 'status')"
              @keyup.esc="cancelEditing"
              style="width: 100px"
              ref="statusSelect"
            >
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
              <el-option label="开发中" value="in_progress" />
              <el-option label="未实现" value="not_implemented" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="显示方式" width="120">
          <template #default="{ row }">
            <div
              v-if="!editingRow || editingRow.id !== row.id || editingField !== 'target'"
              @dblclick="startEditing(row, 'target')"
              class="editable-cell"
            >
              <el-tag :type="row.target === '_self' ? 'primary' : 'success'">
                {{ row.target === '_self' ? '主内容区' : '新页签' }}
              </el-tag>
            </div>
            <el-select
              v-else
              v-model="row.target"
              size="small"
              @change="handleInlineEdit(row, 'target')"
              @blur="handleInlineEdit(row, 'target')"
              @keyup.esc="cancelEditing"
              style="width: 100px"
              ref="targetSelect"
            >
              <el-option label="主内容区" value="_self" />
              <el-option label="新页签" value="_blank" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="success" link @click="handlePermission(row)">
              权限
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 列表视图 -->
      <div v-else>
        <el-table
          :data="flatMenuList"
          row-key="id"
          border
        >
          <el-table-column type="index" label="序号" width="80" />
          <el-table-column prop="name" label="菜单名称" min-width="150">
            <template #default="{ row }">
              <div
                v-if="!editingRow || editingRow.id !== row.id || editingField !== 'name'"
                @dblclick="startEditing(row, 'name')"
                class="editable-cell"
              >
                {{ row.name }}
              </div>
              <el-input
                v-else
                v-model="row.name"
                size="small"
                @blur="handleInlineEdit(row, 'name')"
                @keyup.enter="handleInlineEdit(row, 'name')"
                @keyup.esc="cancelEditing"
                ref="nameInput"
                auto-focus
              />
            </template>
          </el-table-column>
          <el-table-column prop="code" label="菜单编码" min-width="150">
            <template #default="{ row }">
              <div
                v-if="!editingRow || editingRow.id !== row.id || editingField !== 'code'"
                @dblclick="startEditing(row, 'code')"
                class="editable-cell"
              >
                {{ row.code }}
              </div>
              <el-input
                v-else
                v-model="row.code"
                size="small"
                @blur="handleInlineEdit(row, 'code')"
                @keyup.enter="handleInlineEdit(row, 'code')"
                @keyup.esc="cancelEditing"
                ref="codeInput"
                auto-focus
              />
            </template>
          </el-table-column>
          <el-table-column prop="path" label="路由路径" min-width="150" />
          <el-table-column prop="component" label="组件" min-width="150" />
          <el-table-column prop="icon" label="图标" width="100">
            <template #default="{ row }">
              <el-icon v-if="row.icon && iconComponents[row.icon]" :size="18" color="#409eff">
                <component :is="iconComponents[row.icon]" />
              </el-icon>
              <span v-else-if="row.icon" class="icon-text">{{ row.icon }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="parentId" label="上级菜单" min-width="150">
            <template #default="{ row }">
              {{ getParentMenuName(row.parentId) }}
            </template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="排序" width="80">
            <template #default="{ row }">
              <div
                v-if="!editingRow || editingRow.id !== row.id || editingField !== 'sortOrder'"
                @dblclick="startEditing(row, 'sortOrder')"
                class="editable-cell"
              >
                {{ row.sortOrder || 0 }}
              </div>
              <el-input-number
                v-else
                v-model="row.sortOrder"
                :min="0"
                :max="999"
                size="small"
                @blur="handleInlineEdit(row, 'sortOrder')"
                @change="handleInlineEdit(row, 'sortOrder')"
                @keyup.enter="handleInlineEdit(row, 'sortOrder')"
                @keyup.esc="cancelEditing"
                ref="sortInput"
                auto-focus
              />
            </template>
          </el-table-column>
          <el-table-column prop="clientType" label="客户端" width="100">
            <template #default="{ row }">
              <div
                v-if="!editingRow || editingRow.id !== row.id || editingField !== 'clientType'"
                @dblclick="startEditing(row, 'clientType')"
                class="editable-cell"
              >
                <el-tag :type="row.clientType === 'admin' ? 'primary' : 'success'">
                  {{ row.clientType === 'admin' ? '管理端' : '用户端' }}
                </el-tag>
              </div>
              <el-select
                v-else
                v-model="row.clientType"
                size="small"
                @change="handleInlineEdit(row, 'clientType')"
                @blur="handleInlineEdit(row, 'clientType')"
                @keyup.esc="cancelEditing"
                style="width: 90px"
                ref="clientTypeSelect"
              >
                <el-option label="管理端" value="admin" />
                <el-option label="用户端" value="home" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="position" label="菜单位置" width="100">
            <template #default="{ row }">
              <div
                v-if="!editingRow || editingRow.id !== row.id || editingField !== 'position'"
                @dblclick="startEditing(row, 'position')"
                class="editable-cell"
              >
                <el-tag :type="row.position === 'left' ? 'primary' : 'warning'">
                  {{ row.position === 'left' ? '左导航' : '头像菜单' }}
                </el-tag>
              </div>
              <el-select
                v-else
                v-model="row.position"
                size="small"
                @change="handleInlineEdit(row, 'position')"
                @blur="handleInlineEdit(row, 'position')"
                @keyup.esc="cancelEditing"
                style="width: 90px"
                ref="positionSelect"
              >
                <el-option label="左导航" value="left" />
                <el-option label="头像菜单" value="avatar" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="needPermission" label="需要权限" width="100">
            <template #default="{ row }">
              <div
                v-if="!editingRow || editingRow.id !== row.id || editingField !== 'needPermission'"
                @dblclick="startEditing(row, 'needPermission')"
                class="editable-cell"
              >
                <el-tag :type="row.needPermission ? 'success' : 'info'">
                  {{ row.needPermission ? '是' : '否' }}
                </el-tag>
              </div>
              <el-switch
                v-else
                v-model="row.needPermission"
                active-text="是"
                inactive-text="否"
                @change="handleInlineEdit(row, 'needPermission')"
                @blur="handleInlineEdit(row, 'needPermission')"
                @keyup.esc="cancelEditing"
              />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="菜单状态" width="120">
            <template #default="{ row }">
              <div
                v-if="!editingRow || editingRow.id !== row.id || editingField !== 'status'"
                @dblclick="startEditing(row, 'status')"
                class="editable-cell"
              >
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </div>
              <el-select
                v-else
                v-model="row.status"
                size="small"
                @change="handleInlineEdit(row, 'status')"
                @blur="handleInlineEdit(row, 'status')"
                @keyup.esc="cancelEditing"
                style="width: 100px"
                ref="statusSelect"
              >
                <el-option label="启用" value="enabled" />
                <el-option label="禁用" value="disabled" />
                <el-option label="开发中" value="in_progress" />
                <el-option label="未实现" value="not_implemented" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="target" label="显示方式" width="120">
            <template #default="{ row }">
              <div
                v-if="!editingRow || editingRow.id !== row.id || editingField !== 'target'"
                @dblclick="startEditing(row, 'target')"
                class="editable-cell"
              >
                <el-tag :type="row.target === '_self' ? 'primary' : 'success'">
                  {{ row.target === '_self' ? '主内容区' : '新页签' }}
                </el-tag>
              </div>
              <el-select
                v-else
                v-model="row.target"
                size="small"
                @change="handleInlineEdit(row, 'target')"
                @blur="handleInlineEdit(row, 'target')"
                @keyup.esc="cancelEditing"
                style="width: 100px"
                ref="targetSelect"
              >
                <el-option label="主内容区" value="_self" />
                <el-option label="新页签" value="_blank" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="200">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button type="success" link @click="handlePermission(row)">
                权限
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
      </div>
    </el-card>

    <!-- 菜单表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑菜单' : '新增菜单'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="菜单编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入菜单编码，如：users" />
        </el-form-item>
        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="请输入路由路径，如：/users" />
        </el-form-item>
        <el-form-item label="组件" prop="component">
          <el-input v-model="form.component" placeholder="请输入组件名称，如：Users" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-select v-model="form.icon" placeholder="请选择图标" class="icon-select" popper-class="icon-select-dropdown">
            <el-option
              v-for="icon in iconOptions"
              :key="icon.value"
              :label="icon.label"
              :value="icon.value"
            >
              <div class="icon-option">
                <el-icon v-if="iconComponents[icon.value]" :size="18">
                  <component :is="iconComponents[icon.value]" />
                </el-icon>
                <span>{{ icon.label }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="上级菜单" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="parentMenus"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="请选择上级菜单（可选）"
            clearable
            check-strictly
          />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="客户端类型" prop="clientType">
          <el-radio-group v-model="form.clientType">
            <el-radio label="admin">管理端</el-radio>
            <el-radio label="home">用户端</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单位置" prop="position">
          <el-radio-group v-model="form.position">
            <el-radio label="left">左导航</el-radio>
            <el-radio label="avatar">头像菜单</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
            <el-option label="开发中" value="in_progress" />
            <el-option label="未实现" value="not_implemented" />
          </el-select>
        </el-form-item>
        <el-form-item label="需要权限" prop="needPermission">
          <el-switch v-model="form.needPermission" />
        </el-form-item>
        <el-form-item label="显示方式" prop="target">
          <el-select v-model="form.target" placeholder="请选择显示方式">
            <el-option label="主内容区" value="_self" />
            <el-option label="新页签" value="_blank" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 权限管理对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限管理"
      width="800px"
      :close-on-click-modal="false"
      @close="handlePermissionDialogClose"
    >
      <div class="permission-search">
        <div class="search-left">
          <el-input
            v-model="permissionSearchKeyword"
            placeholder="搜索角色名称或代码"
            clearable
            style="width: 300px"
            @clear="fetchMenuRoles"
            @keyup.enter="fetchMenuRoles"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button 
            v-if="selectedRoles.length > 0" 
            type="danger" 
            size="small" 
            @click="handleBatchRemovePermissions"
            style="margin-left: 10px"
          >
            批量解除 ({{ selectedRoles.length }})
          </el-button>
        </div>
        <el-button type="primary" size="small" @click="handleAddPermission">
          <el-icon><Plus /></el-icon>
          添加角色
        </el-button>
      </div>
      <el-table 
        :data="permissionRoleList" 
        border 
        v-loading="permissionLoading" 
        style="margin-top: 10px"
        @selection-change="handleRoleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="name" label="角色名称" min-width="120" />
        <el-table-column prop="code" label="角色代码" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'danger'">
              {{ row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleRemovePermission(row)">
              解除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="permissionPage"
          v-model:page-size="permissionPageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="permissionTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchMenuRoles"
          @current-change="fetchMenuRoles"
        />
      </div>
    </el-dialog>

    <!-- 添加角色对话框 -->
    <el-dialog
      v-model="addPermissionDialogVisible"
      title="添加角色"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="permission-search">
        <el-input
          v-model="addPermissionSearchKeyword"
          placeholder="搜索角色名称或代码"
          clearable
          style="width: 300px"
          @clear="fetchAvailableRoles"
          @keyup.enter="fetchAvailableRoles"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <el-table
        :data="availableRoles"
        border
        v-loading="addPermissionLoading"
        style="margin-top: 10px; max-height: 400px; overflow-y: auto"
        @selection-change="handleAddRoleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="name" label="角色名称" min-width="120" />
        <el-table-column prop="code" label="角色代码" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'danger'">
              {{ row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="addPermissionPage"
          v-model:page-size="addPermissionPageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="addPermissionTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchAvailableRoles"
          @current-change="fetchAvailableRoles"
        />
      </div>
      <template #footer>
        <el-button @click="addPermissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAddPermission" :loading="addPermissionSubmitLoading">
          确定添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, User, Setting, Document, DataAnalysis, House, Menu, Grid, ChatDotRound, Tickets } from '@element-plus/icons-vue';
import request from '../utils/request';

interface Menu {
  id: string;
  name: string;
  code: string;
  path: string;
  component: string;
  icon: string;
  parentId: string | null;
  sortOrder: number;
  type: string;
  status: string;
  clientType: string;
  needPermission: boolean;
  position: string;
  target: string;
  createdAt: string;
  updatedAt: string;
  children?: Menu[];
}

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  status: string;
  created_at: string;
}

const menuList = ref<Menu[]>([]);
const flatMenuList = ref<Menu[]>([]);
const parentMenus = ref<Menu[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref();
const viewMode = ref('tree');

// 分页
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const searchKeyword = ref('');
const filterStatus = ref('');
const filterNeedPermission = ref('');
const filterClientType = ref('');
const filterPosition = ref('');

// 权限管理相关
const permissionDialogVisible = ref(false);
const addPermissionDialogVisible = ref(false);
const currentMenu = ref<Menu | null>(null);
const permissionRoleList = ref<Role[]>([]);
const permissionLoading = ref(false);
const permissionPage = ref(1);
const permissionPageSize = ref(10);
const permissionTotal = ref(0);
const permissionSearchKeyword = ref('');

// 添加权限相关
const availableRoles = ref<Role[]>([]);
const addPermissionLoading = ref(false);
const addPermissionSubmitLoading = ref(false);
const addPermissionPage = ref(1);
const addPermissionPageSize = ref(10);
const addPermissionTotal = ref(0);
const addPermissionSearchKeyword = ref('');
const selectedRoleIds = ref<string[]>([]);

// 批量解除权限相关
const selectedRoles = ref<Role[]>([]);

// 行内编辑相关
const editingRow = ref<Menu | null>(null);
const editingField = ref<string>('');
const nameInput = ref();
const codeInput = ref();
const statusSelect = ref();
const sortInput = ref();
const clientTypeSelect = ref();
const positionSelect = ref();
const targetSelect = ref();

const startEditing = (row: Menu, field: string) => {
  editingRow.value = row;
  editingField.value = field;
  // 延迟聚焦输入框
  setTimeout(() => {
    if (field === 'name' && nameInput.value) {
      nameInput.value.focus();
    } else if (field === 'code' && codeInput.value) {
      codeInput.value.focus();
    } else if (field === 'status' && statusSelect.value) {
      statusSelect.value.focus();
    } else if (field === 'sortOrder' && sortInput.value) {
      sortInput.value.focus();
    } else if (field === 'clientType' && clientTypeSelect.value) {
      clientTypeSelect.value.focus();
    } else if (field === 'position' && positionSelect.value) {
      positionSelect.value.focus();
    } else if (field === 'target' && targetSelect.value) {
      targetSelect.value.focus();
    } else if (field === 'needPermission' && statusSelect.value) {
      statusSelect.value.focus();
    }
  }, 100);
};

const cancelEditing = () => {
  editingRow.value = null;
  editingField.value = '';
  // 重新获取数据，恢复原始值
  fetchMenus();
};

const form = reactive({
  id: '',
  name: '',
  code: '',
  path: '',
  component: '',
  icon: '',
  parentId: null as string | null,
  sortOrder: 0,
  clientType: 'admin',
  position: 'left',
  status: 'enabled',
  needPermission: true,
  target: '_self',
});

const rules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入菜单编码', trigger: 'blur' }],
  path: [{ required: false, message: '请输入路由路径', trigger: 'blur' }],
  component: [{ required: false, message: '请输入组件名称', trigger: 'blur' }],
};

const iconComponents: Record<string, any> = {
  User,
  Setting,
  Document,
  DataAnalysis,
  House,
  Menu,
  Grid,
  ChatDotRound,
  Tickets,
};

const iconOptions = [
  { label: '用户', value: 'User' },
  { label: '设置', value: 'Setting' },
  { label: '文档', value: 'Document' },
  { label: '数据分析', value: 'DataAnalysis' },
  { label: '首页', value: 'House' },
  { label: '菜单', value: 'Menu' },
  { label: '网格', value: 'Grid' },
  { label: '聊天', value: 'ChatDotRound' },
  { label: '工单', value: 'Tickets' },
];

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    enabled: 'success',
    disabled: 'danger',
    in_progress: 'warning',
    not_implemented: 'info',
  };
  return types[status] || 'info';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    enabled: '启用',
    disabled: '禁用',
    in_progress: '开发中',
    not_implemented: '未实现',
  };
  return labels[status] || status;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN');
};

const handleSearch = () => {
  page.value = 1;
  fetchMenus();
};

const fetchMenus = async () => {
  try {
    console.log('开始获取菜单列表，视图模式:', viewMode.value);
    const params: any = {};
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value;
    }
    if (filterStatus.value) {
      params.status = filterStatus.value;
    }
    if (filterNeedPermission.value !== '') {
      params.needPermission = filterNeedPermission.value;
    }
    if (filterClientType.value) {
      params.clientType = filterClientType.value;
    }
    if (filterPosition.value) {
      params.position = filterPosition.value;
    }
    
    if (viewMode.value === 'tree') {
      console.log('请求树形菜单数据，参数:', params);
      const res = await request.get<any, Menu[]>('/menus', { params });
      console.log('树形菜单响应:', res);
      menuList.value = Array.isArray(res) ? res : [];
      console.log('处理后 menuList:', menuList.value);
      // 获取可作为上级的菜单（一级菜单）
      parentMenus.value = flattenMenus(menuList.value).filter((m: Menu) => !m.parentId);
    } else {
      console.log('请求列表菜单数据，参数:', { ...params, flatten: true, page: page.value, pageSize: pageSize.value });
      const res = await request.get<any, { list: Menu[]; total: number }>('/menus', {
        params: {
          ...params,
          flatten: true,
          page: page.value,
          pageSize: pageSize.value,
        }
      });
      console.log('列表菜单响应:', res);
      flatMenuList.value = Array.isArray(res?.list) ? res.list : [];
      console.log('处理后 flatMenuList:', flatMenuList.value);
      total.value = res?.total || 0;
      // 获取所有菜单用于上级菜单选择
      parentMenus.value = flatMenuList.value.filter((m: Menu) => !m.parentId);
    }
  } catch (error) {
    console.error('获取菜单列表失败:', error);
  }
};

const handleViewModeChange = () => {
  page.value = 1;
  fetchMenus();
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchMenus();
};

const handleCurrentChange = (val: number) => {
  page.value = val;
  fetchMenus();
};

const flattenMenus = (menus: Menu[]): Menu[] => {
  const result: Menu[] = [];
  if (!Array.isArray(menus)) {
    return result;
  }
  for (const menu of menus) {
    result.push(menu);
    if (menu.children && Array.isArray(menu.children) && menu.children.length > 0) {
      result.push(...flattenMenus(menu.children));
    }
  }
  return result;
};

const getParentMenuName = (parentId: string | null) => {
  if (!parentId) return '无';
  const allMenus = flattenMenus(menuList.value);
  const parentMenu = allMenus.find(m => m.id === parentId);
  return parentMenu?.name || '未知';
};

const handleAdd = () => {
  isEdit.value = false;
  Object.assign(form, {
    id: '',
    name: '',
    code: '',
    path: '',
    component: '',
    icon: '',
    parentId: null,
    sortOrder: 0,
    clientType: 'admin',
    position: 'left',
    status: 'enabled',
    needPermission: true,
    target: '_self',
  });
  dialogVisible.value = true;
};

const handleEdit = async (row: Menu) => {
  isEdit.value = true;
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code,
    path: row.path,
    component: row.component,
    icon: row.icon,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    clientType: row.clientType,
    position: row.position || 'left',
    status: row.status,
    needPermission: row.needPermission,
    target: row.target || '_self',
  });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();
  
  submitLoading.value = true;
  try {
    const data = {
      name: form.name,
      code: form.code,
      path: form.path,
      component: form.component,
      icon: form.icon,
      parentId: form.parentId,
      sortOrder: form.sortOrder,
      clientType: form.clientType,
      position: form.position,
      status: form.status,
      needPermission: form.needPermission,
      target: form.target,
    };
    
    if (isEdit.value) {
      await request.put(`/menus/${form.id}`, data);
      ElMessage.success('更新成功');
    } else {
      await request.post('/menus', data);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchMenus();
  } catch (error) {
    console.error('保存菜单失败:', error);
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = async (row: Menu) => {
  try {
    await ElMessageBox.confirm('确定要删除该菜单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await request.delete(`/menus/${row.id}`);
    ElMessage.success('删除成功');
    fetchMenus();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除菜单失败:', error);
    }
  }
};

const handleInlineEdit = async (row: Menu, field: string) => {
  try {
    // 构建只包含被编辑字段的更新数据
    const updateData = {};
    
    // 根据被编辑的字段设置相应的数据
    switch (field) {
      case 'name':
        updateData.name = row.name;
        break;
      case 'code':
        updateData.code = row.code;
        break;
      case 'sortOrder':
        updateData.sortOrder = row.sortOrder || 0;
        break;
      case 'status':
        updateData.status = row.status || 'enabled';
        break;
      case 'needPermission':
        updateData.needPermission = row.needPermission;
        break;
      case 'clientType':
        updateData.clientType = row.clientType || 'admin';
        break;
      case 'position':
        updateData.position = row.position || 'left';
        break;
      case 'target':
        updateData.target = row.target || '_self';
        break;
      default:
        // 对于其他字段，使用完整更新
        Object.assign(updateData, {
          name: row.name,
          code: row.code,
          path: row.path,
          component: row.component,
          icon: row.icon,
          parentId: row.parentId || null,
          sortOrder: row.sortOrder || 0,
          type: row.type || 'menu',
          status: row.status || 'enabled',
          clientType: row.clientType || 'admin',
          position: row.position || 'left',
          needPermission: row.needPermission,
          target: row.target || '_self'
        });
    }
    
    // 发送更新请求
    await request.put(`/menus/${row.id}`, updateData);
    ElMessage.success('更新成功');
    // 清除编辑状态
    editingRow.value = null;
    editingField.value = '';
    // 重新获取菜单数据，确保所有数据都是最新的
    fetchMenus();
  } catch (error) {
    console.error('更新菜单失败:', error);
    ElMessage.error('更新失败，请重试');
    // 重新获取菜单数据，恢复原始值
    fetchMenus();
    // 清除编辑状态
    editingRow.value = null;
    editingField.value = '';
  }
};

// 权限管理相关方法
const handlePermission = (row: Menu) => {
  currentMenu.value = row;
  permissionDialogVisible.value = true;
  permissionPage.value = 1;
  permissionSearchKeyword.value = '';
  fetchMenuRoles();
};

const handlePermissionDialogClose = () => {
  currentMenu.value = null;
  permissionRoleList.value = [];
  selectedRoles.value = [];
};

const fetchMenuRoles = async () => {
  if (!currentMenu.value) return;
  permissionLoading.value = true;
  try {
    const params: any = {
      page: permissionPage.value,
      pageSize: permissionPageSize.value,
    };
    if (permissionSearchKeyword.value) {
      params.keyword = permissionSearchKeyword.value;
    }
    const res = await request.get<any, { list: Role[]; total: number }>(`/menus/${currentMenu.value.id}/roles`, { params });
    permissionRoleList.value = res.list || [];
    permissionTotal.value = res.total || 0;
  } catch (error) {
    console.error('获取菜单角色失败:', error);
  } finally {
    permissionLoading.value = false;
  }
};

const handleRemovePermission = async (row: Role) => {
  if (!currentMenu.value) return;
  try {
    await ElMessageBox.confirm('确定要解除该角色的权限吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await request.delete(`/menus/${currentMenu.value.id}/roles/${row.id}`);
    ElMessage.success('解除成功');
    fetchMenuRoles();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解除权限失败:', error);
    }
  }
};

// 角色选择变更
const handleRoleSelectionChange = (selection: Role[]) => {
  selectedRoles.value = selection;
};

// 批量解除权限
const handleBatchRemovePermissions = async () => {
  if (!currentMenu.value || selectedRoles.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确定要解除选中的 ${selectedRoles.value.length} 个角色的权限吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    // 逐个解除权限
    const removePromises = selectedRoles.value.map(role => 
      request.delete(`/menus/${currentMenu.value!.id}/roles/${role.id}`)
    );
    await Promise.all(removePromises);
    
    ElMessage.success('批量解除成功');
    selectedRoles.value = [];
    fetchMenuRoles();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量解除权限失败:', error);
    }
  }
};

const handleAddPermission = () => {
  addPermissionDialogVisible.value = true;
  addPermissionPage.value = 1;
  addPermissionSearchKeyword.value = '';
  selectedRoleIds.value = [];
  fetchAvailableRoles();
};

const fetchAvailableRoles = async () => {
  if (!currentMenu.value) return;
  addPermissionLoading.value = true;
  try {
    const params: any = {
      page: addPermissionPage.value,
      pageSize: addPermissionPageSize.value,
      includeDisabled: 'true',
    };
    if (addPermissionSearchKeyword.value) {
      params.keyword = addPermissionSearchKeyword.value;
    }
    const res = await request.get<any, { list: Role[]; total: number }>('/roles', { params });
    
    // 过滤掉已经绑定的角色
    const boundRoleIds = permissionRoleList.value.map(r => r.id);
    availableRoles.value = (res.list || []).filter((role: Role) => !boundRoleIds.includes(role.id));
    addPermissionTotal.value = (res.total || 0) - permissionRoleList.value.length;
  } catch (error) {
    console.error('获取可用角色失败:', error);
  } finally {
    addPermissionLoading.value = false;
  }
};

const handleAddRoleSelectionChange = (selection: Role[]) => {
  selectedRoleIds.value = selection.map(r => r.id);
};

const handleConfirmAddPermission = async () => {
  if (!currentMenu.value || selectedRoleIds.value.length === 0) {
    ElMessage.warning('请选择要添加的角色');
    return;
  }
  addPermissionSubmitLoading.value = true;
  try {
    await request.post(`/menus/${currentMenu.value.id}/roles`, {
      roleIds: selectedRoleIds.value,
    });
    ElMessage.success('添加成功');
    addPermissionDialogVisible.value = false;
    fetchMenuRoles();
  } catch (error) {
    console.error('添加权限失败:', error);
  } finally {
    addPermissionSubmitLoading.value = false;
  }
};

onMounted(() => {
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

.view-controls {
  margin-bottom: 15px;
}

.icon-select {
  width: 100%;
}

.icon-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-text {
  color: #909399;
}

.menus {
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

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.search-left {
  display: flex;
  align-items: center;
}

.editable-cell {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.editable-cell:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
