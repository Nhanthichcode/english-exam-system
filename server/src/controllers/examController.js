const Exam = require('../models/examModel');

exports.initiateNewExam = async (req, res) => {
    try {
        const { exam_type_id, title, total_time_minutes } = req.body;
        const creator_id = req.user.id;

        if (!exam_type_id || !title || !total_time_minutes) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin để tạo đề thi mới.' });
        }

        const newExam = await Exam.createDraft({ exam_type_id, creator_id, title, total_time_minutes });
        const examSections = await Exam.generateSectionsFromTemplate(newExam.id, exam_type_id);
        res.status(201).json({ exam: newExam, sections: examSections });
    } catch (error) {
        console.error('Error creating new exam:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi tạo đề thi mới.' });
    }
};