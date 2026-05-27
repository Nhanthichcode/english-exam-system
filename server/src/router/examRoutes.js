const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authMiddleware, checkRole} = require('../middlewares/authMiddleware');

router.post('/create-templet', authMiddleware, checkRole([1, 2]), examController.initiateNewExam);

module.exports = router;