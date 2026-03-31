const express = require('express');
const router = express.Router();
const {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
} = require('../controllers/agentController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, adminMiddleware, getAgents);
router.get('/:id', authMiddleware, adminMiddleware, getAgentById);
router.post('/', authMiddleware, adminMiddleware, createAgent);
router.put('/:id', authMiddleware, adminMiddleware, updateAgent);
router.delete('/:id', authMiddleware, adminMiddleware, deleteAgent);

module.exports = router;