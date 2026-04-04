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

// 获取模型配置列表
router.get('/:user_model_id/configs', authMiddleware, userModelController.getModelConfigs);

// 创建模型配置
router.post('/:user_model_id/configs', authMiddleware, userModelController.createModelConfig);

// 更新模型配置
router.put('/:user_model_id/configs/:config_id', authMiddleware, userModelController.updateModelConfig);

// 删除模型配置
router.delete('/:user_model_id/configs/:config_id', authMiddleware, userModelController.deleteModelConfig);

module.exports = router;