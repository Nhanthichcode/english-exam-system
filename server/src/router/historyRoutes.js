const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authMiddleware, checkRole } = require('../middlewares/authMiddleware');

router.get('/my-history', authMiddleware, checkRole([3]), historyController.getExamHistory);
router.get('/attempt/:attempt_id', authMiddleware, checkRole([3]), historyController.getAttemptDetail);

module.exports = router;