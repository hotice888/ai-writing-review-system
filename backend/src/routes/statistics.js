const express = require('express');
const router = express.Router();
const { getOverviewStats, getRankings, getTrendStats } = require('../controllers/statisticsController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/overview', authMiddleware, adminMiddleware, getOverviewStats);
router.get('/rankings', authMiddleware, adminMiddleware, getRankings);
router.get('/trends', authMiddleware, adminMiddleware, getTrendStats);

module.exports = router;
