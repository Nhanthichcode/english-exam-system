const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

const { authMiddleware, checkRole} = require('../middlewares/authMiddleware');

router.post('/create-group', authMiddleware, checkRole([1, 2]), questionController.createFullQuestionGroup);

module.exports = router;