const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authMiddleware, checkRole } = require('../middlewares/authMiddleware');

// Chỉ Giáo viên (2) và Admin (1) mới có quyền upload tư liệu số vào ngân hàng đề
router.post('/media', authMiddleware, checkRole([1, 2]), uploadController.uploadMediaFile);

module.exports = router;