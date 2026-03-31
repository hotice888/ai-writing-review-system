const express = require('express');
const router = express.Router();
const userModelController = require('../controllers/userModelController');
const { authMiddleware } = require('../middleware/auth');

// 获取用户模型列表
router.get('/', authMiddleware, userModelController.getUserModels);

// 获取单个用户模型
router.get('/:id', authMiddleware, userModelController.getUserModelById);

// 创建用户模型
router.post('/', authMiddleware, userModelController.createUserModel);

// 更新用户模型
router.put('/:id', authMiddleware, userModelController.updateUserModel);

// 删除用户模型
router.delete('/:id', authMiddleware, userModelController.deleteUserModel);

// 获取平台支持的模型列表
router.get('/platform/models', authMiddleware, userModelController.getPlatformModels);

module.exports = router;