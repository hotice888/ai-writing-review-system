const express = require('express');
const router = express.Router();
const modelProviderController = require('../controllers/modelProviderController');
const { authMiddleware } = require('../middleware/auth');

// 获取所有模型提供商
router.get('/', authMiddleware, modelProviderController.getAllProviders);

// 获取所有模型提供商的可选模型
router.get('/providers-models', authMiddleware, modelProviderController.getAllProviderModels);

// 获取单个模型提供商
router.get('/:id', authMiddleware, modelProviderController.getProviderById);

// 创建模型提供商
router.post('/', authMiddleware, modelProviderController.createProvider);

// 更新模型提供商
router.put('/:id', authMiddleware, modelProviderController.updateProvider);

// 删除模型提供商
router.delete('/:id', authMiddleware, modelProviderController.deleteProvider);

module.exports = router;