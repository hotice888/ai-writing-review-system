const express = require('express');
const router = express.Router();
const fieldOptionController = require('../controllers/fieldOptionController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, adminMiddleware, fieldOptionController.getFieldOptions);
router.get('/items', authMiddleware, adminMiddleware, fieldOptionController.getAllOptionItems);
router.get('/:id', authMiddleware, adminMiddleware, fieldOptionController.getFieldOptionById);
router.post('/', authMiddleware, adminMiddleware, fieldOptionController.createFieldOption);
router.put('/:id', authMiddleware, adminMiddleware, fieldOptionController.updateFieldOption);
router.delete('/:id', authMiddleware, adminMiddleware, fieldOptionController.deleteFieldOption);
router.put('/:id/status', authMiddleware, adminMiddleware, fieldOptionController.toggleFieldStatus);

router.get('/:fieldId/items', authMiddleware, adminMiddleware, fieldOptionController.getFieldOptionItems);
router.post('/:fieldId/items', authMiddleware, adminMiddleware, fieldOptionController.createFieldOptionItem);
router.put('/:fieldId/items/refresh-order', authMiddleware, adminMiddleware, fieldOptionController.refreshOptionOrder);

router.put('/items/:id', authMiddleware, adminMiddleware, fieldOptionController.updateFieldOptionItem);
router.delete('/items/:id', authMiddleware, adminMiddleware, fieldOptionController.deleteFieldOptionItem);
router.post('/items/batch', authMiddleware, adminMiddleware, fieldOptionController.batchDeleteOptionItems);
router.put('/items/:id/status', authMiddleware, adminMiddleware, fieldOptionController.toggleOptionItemStatus);

router.get('/export/download', authMiddleware, adminMiddleware, fieldOptionController.exportFieldOptions);
router.get('/import/template', authMiddleware, adminMiddleware, fieldOptionController.downloadImportTemplate);
router.post('/import/upload', authMiddleware, adminMiddleware, fieldOptionController.importFieldOptions);

module.exports = router;
