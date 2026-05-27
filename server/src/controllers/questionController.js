const Question = require('../models/questionModel');
const QuestionGroup = require('../models/questionGroupModel');

exports.createFullQuestionGroup = async (req, res) => {
    try {
        const { group_info, questions } = req.body;
        const created_by = req.user.id;
        if (!group_info || !questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ. Vui lòng cung cấp đầy đủ thông tin nhóm câu hỏi và danh sách câu hỏi.' });
        }
        const newGroup = await QuestionGroup.create({ ...group_info, created_by });
        const saveQuetions = [];
        for (let i = 0; i < questions.length; i++) {
            const questionData = questions[i];
            const saveQuestion = await Question.create({
                group_id: newGroup.id,
                question_type: questionData.question_type,
                question_text: questionData.question_text,
                options: questionData.options,
                correct_answer: questionData.correct_answer,
                explanation: questionData.explanation,
                order_in_group: questionData.order_in_group || (i + 1)
            });
            saveQuetions.push(saveQuestion);
        }

        return res.status(201).json({ message: 'Nhóm câu hỏi và các câu hỏi đã được tạo thành công!',
            group: newGroup,
            questions: saveQuetions });
    } catch (error) {
        console.error('Lỗi tạo nhóm câu hỏi:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống phía Server!' });
    }
};