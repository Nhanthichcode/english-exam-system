const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authMiddleware, checkRole} = require('../middlewares/authMiddleware');
// Đường dẫn: POST /api/auth/register
router.post('/register', authController.register);

// Đường dẫn: POST /api/auth/login (MỚI THÊM)
router.post('/login', authController.login);
    
// Đường dẫn: POST /api/auth/logout (MỚI THÊM)
router.post('/logout', authController.logout);

// Đường dẫn: POST /api/auth/refreshtoken (MỚI THÊM)
router.post('/refreshtoken', authController.refreshToken);

// 1. Trang cá nhân học viên: Bất kỳ ai đăng nhập thành công cũng vào được (role_id nào cũng được)
router.get('/profile', authMiddleware, (req, res) => {
    res.json({
        message: "Chào mừng bạn đến với khu vực tài khoản cá nhân!",
        user_data: req.user // Hiển thị dữ liệu đã được bóc tách từ Token
    });
});

// 2. Khu vực quản trị: Chỉ cho phép tài khoản Admin (role_id = 1) được truy cập
router.get('/admin-only', authMiddleware, checkRole([1]), (req, res) => {
    res.json({ message: "Chào sếp Admin! Đây là dữ liệu tuyệt mật của hệ thống." });
});

module.exports = router;