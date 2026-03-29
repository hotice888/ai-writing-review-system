const express = require('express');
const router = express.Router();
const {
  getUserList,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getReviewList,
  approveReview,
  rejectReview,
} = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/users', authMiddleware, adminMiddleware, getUserList);
router.get('/users/:userId', authMiddleware, adminMiddleware, getUserById);
router.post('/users', authMiddleware, adminMiddleware, createUser);
router.put('/users/:userId', authMiddleware, adminMiddleware, updateUser);
router.delete('/users/:userId', authMiddleware, adminMiddleware, deleteUser);
router.get('/reviews', authMiddleware, adminMiddleware, getReviewList);
router.put('/reviews/:reviewId/approve', authMiddleware, adminMiddleware, approveReview);
router.put('/reviews/:reviewId/reject', authMiddleware, adminMiddleware, rejectReview);

module.exports = router;
