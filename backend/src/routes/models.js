const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');
const { authMiddleware } = require('../middleware/auth');

// 获取所有模型
router.get('/', authMiddleware, modelController.getAllModels);

// 获取单个模型
router.get('/:id', authMiddleware, modelController.getModelById);

// 创建模型
router.post('/', authMiddleware, modelController.createModel);

// 更新模型
router.put('/:id', authMiddleware, modelController.updateModel);

// 删除模型
router.delete('/:id', authMiddleware, modelController.deleteModel);

module.exports = router;