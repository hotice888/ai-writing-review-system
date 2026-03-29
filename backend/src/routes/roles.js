const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getUserMenus,
  getRoleMembers,
  addRoleMember,
  removeRoleMember,
} = require('../controllers/roleController');

// 获取所有角色
router.get('/', authMiddleware, getRoles);

// 获取当前用户的菜单（必须放在 /:id 路由之前）
router.get('/menus/user', authMiddleware, getUserMenus);

// 创建角色
router.post('/', authMiddleware, createRole);

// 获取角色详情
router.get('/:id', authMiddleware, getRoleById);

// 更新角色
router.put('/:id', authMiddleware, updateRole);

// 删除角色
router.delete('/:id', authMiddleware, deleteRole);

// 获取角色成员
router.get('/:id/members', authMiddleware, getRoleMembers);

// 添加角色成员
router.post('/:id/members', authMiddleware, addRoleMember);

// 移除角色成员
router.delete('/:id/members/:userId', authMiddleware, removeRoleMember);

module.exports = router;
