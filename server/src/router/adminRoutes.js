const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, checkRole } = require('../middlewares/authMiddleware');

// Chỉ cho phép Role ID = 1 (Admin) truy cập
router.get('/users', authMiddleware, checkRole([1]), adminController.getAllUsers);
router.put('/users/change-role', authMiddleware, checkRole([1]), adminController.updateUserRole);
router.post('/users/create-single', authMiddleware, checkRole([1]), adminController.createSingleUser);
router.post('/users/import-excel', authMiddleware, checkRole([1]), adminController.importUsersFromExcel);
router.put('/users/:id', authMiddleware, checkRole([1]), adminController.updateUser);
router.patch('/users/:id/status', authMiddleware, checkRole([1]), adminController.toggleUserStatus);
router.delete('/users/:id', authMiddleware, checkRole([1]), adminController.deleteSingleUser);
router.delete('/users/bulk/delete', authMiddleware, checkRole([1]), adminController.deleteMultipleUsers);

module.exports = router;