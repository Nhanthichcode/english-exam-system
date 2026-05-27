const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

const { authMiddleware, checkRole} = require('../middlewares/authMiddleware');
// create-group là tên custom, không phải tên mặc định của RESTful API, nó là phương thức 'questionController.createFullQuestionGroup'
router.post('/create-group', authMiddleware, checkRole([1, 2]), questionController.createFullQuestionGroup);

module.exports = router;