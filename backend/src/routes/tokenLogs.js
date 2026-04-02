const express = require('express');
const router = express.Router();
const { getTokenLogs, getTokenLogStats, getTokenLogDetail, deleteTokenLogsBatch } = require('../controllers/tokenLogController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, adminMiddleware, getTokenLogs);
router.get('/stats', authMiddleware, adminMiddleware, getTokenLogStats);
router.get('/:id', authMiddleware, adminMiddleware, getTokenLogDetail);
router.delete('/batch', authMiddleware, adminMiddleware, deleteTokenLogsBatch);

module.exports = router;
