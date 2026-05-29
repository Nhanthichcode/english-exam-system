const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authMiddleware, checkRole } = require('../middlewares/authMiddleware');

// create-group là tên custom, không phải tên mặc định của RESTful API, nó là phương thức 'questionController.createFullQuestionGroup'
router.post('/create-group', authMiddleware, checkRole([1, 2]), questionController.createFullQuestionGroup);
router.post('/create', authMiddleware, checkRole([1, 2]), questionController.createSingleQuestion);
router.post('/import-excel', authMiddleware, checkRole([1, 2]), questionController.importQuestionsFromExcel);
router.get('/detail/:id', authMiddleware, checkRole([1, 2]), questionController.getQuestionDetail);
router.put('/update/:id', authMiddleware, checkRole([1, 2]), questionController.updateQuestion);
router.delete('/delete/:id', authMiddleware, checkRole([1, 2]), questionController.deleteSingleQuestion);
router.delete('/bulk/delete', authMiddleware, checkRole([1, 2]), questionController.deleteMultipleQuestions);
router.get('/admin-list', authMiddleware, checkRole([1, 2]), questionController.getAdminQuestions);


module.exports = router;