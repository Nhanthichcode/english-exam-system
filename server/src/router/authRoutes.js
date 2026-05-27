const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// Đường dẫn: POST /api/auth/register
router.post('/register', authController.register);

// Đường dẫn: POST /api/auth/login (MỚI THÊM)
router.post('/login', authController.login);
    
// Đường dẫn: POST /api/auth/logout (MỚI THÊM)
router.post('/logout', authController.logout);

// Đường dẫn: POST /api/auth/refreshtoken (MỚI THÊM)
router.post('/refreshtoken', authController.refreshToken);

module.exports = router;