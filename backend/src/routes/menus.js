const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenuRoles,
  addMenuRole,
  removeMenuRole,
} = require('../controllers/menuController');

// 获取所有菜单
router.get('/', authMiddleware, getMenus);

// 获取菜单详情
router.get('/:id', authMiddleware, getMenuById);

// 创建菜单
router.post('/', authMiddleware, createMenu);

// 更新菜单
router.put('/:id', authMiddleware, updateMenu);

// 删除菜单
router.delete('/:id', authMiddleware, deleteMenu);

// 获取菜单绑定的角色
router.get('/:id/roles', authMiddleware, getMenuRoles);

// 绑定角色到菜单
router.post('/:id/roles', authMiddleware, addMenuRole);

// 解除角色与菜单的绑定
router.delete('/:id/roles/:roleId', authMiddleware, removeMenuRole);

module.exports = router;
