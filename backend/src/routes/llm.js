const express = require('express');
const router = express.Router();
const { invokeLLM } = require('../controllers/llmController');
const { authMiddleware } = require('../middleware/auth');

router.post('/invoke', authMiddleware, invokeLLM);

module.exports = router;
