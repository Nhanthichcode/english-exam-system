const express = require('express');
const router = express.Router();

const examController = require('../controllers/examController');
const { authMiddleware, checkRole} = require('../middlewares/authMiddleware');

router.post('/create-templet', authMiddleware, checkRole([1, 2]), examController.initiateNewExam);
router.get('/:id/take', authMiddleware, checkRole([3]), examController.getExamForStudent);
router.post('/auto-save', authMiddleware, checkRole([3]), examController.autoSaveProgress);
router.post('/submit', authMiddleware, checkRole([3]), examController.submitExamAndGrade);

module.exports = router;