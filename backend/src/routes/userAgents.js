const express = require('express');
const router = express.Router();
const {
  getUserAgents,
  getUserAgentById,
  createUserAgent,
  updateUserAgent,
  deleteUserAgent,
} = require('../controllers/userAgentController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, getUserAgents);
router.get('/:id', authMiddleware, getUserAgentById);
router.post('/', authMiddleware, createUserAgent);
router.put('/:id', authMiddleware, updateUserAgent);
router.delete('/:id', authMiddleware, deleteUserAgent);

module.exports = router;