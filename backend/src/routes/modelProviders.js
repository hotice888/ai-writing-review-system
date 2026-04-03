const express = require('express');
const router = express.Router();
const modelProviderController = require('../controllers/modelProviderController');
const { authMiddleware } = require('../middleware/auth');

// 获取所有模型平台
router.get('/', authMiddleware, modelProviderController.getAllProviders);

// 获取所有模型平台的可选模型
router.get('/providers-models', authMiddleware, modelProviderController.getAllProviderModels);

// 获取单个模型平台
router.get('/:id', authMiddleware, modelProviderController.getProviderById);

// 创建模型平台
router.post('/', authMiddleware, modelProviderController.createProvider);

// 更新模型平台
router.put('/:id', authMiddleware, modelProviderController.updateProvider);

// 更新模型平台状态
router.put('/:id/status', authMiddleware, modelProviderController.updateProviderStatus);

// 删除模型平台
router.delete('/:id', authMiddleware, modelProviderController.deleteProvider);

module.exports = router;