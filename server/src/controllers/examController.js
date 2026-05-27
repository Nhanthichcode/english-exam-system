const Exam = require('../models/examModel');
const db = require('../config/db');

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

exports.getExamForStudent = async (req, res) => {
    try {
        const examId = req.params.id;
        const userId = req.user.id; // Lấy từ token đăng nhập của học sinh

        // 1. Gọi Model lấy cấu trúc đề thi chi tiết
        const examDetails = await Exam.getExamDetailsForStudent(examId);
        if (!examDetails) {
            return res.status(404).json({ message: "Không tìm thấy đề thi yêu cầu!" });
        }

        // 2. Tạo một lượt thi mới trong DB (bảng exam_attempts) ở trạng thái 'in_progress' 
        const attemptQuery = `
            INSERT INTO exam_attempts (user_id, exam_id, start_time, status)
            VALUES ($1, $2, NOW(), 'in_progress')
            RETURNING id, start_time
        `;
        const attemptResult = await db.query(attemptQuery, [userId, examId]);
        const attempt = attemptResult.rows[0];

        // Đính kèm ID lượt thi để lát nữa React làm tính năng Auto-save gửi lên đúng lượt
        examDetails.attempt_id = attempt.id;

        return res.status(200).json({
            message: "Tải đề thi thành công! Thời gian làm bài bắt đầu tính.",
            exam_data: examDetails
        });

    } catch (error) {
        console.error("Lỗi tải đề thi cho học sinh:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi tải đề thi!" });
    }
};

exports.autoSaveProgress = async (req, res) => {
    try {
        const { attempt_id, current_progress } = req.body;
        // console.log("Dữ liệu nhận được để Auto-save:", { attempt_id, current_progress });
        
        if (!attempt_id || !current_progress) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ cho tính năng Auto-save!" });
        }

        const saveQuery = `
            UPDATE exam_attempts 
            SET current_progress = $1
            WHERE id = $2 AND status = 'in_progress'
            RETURNING id 
    `;

        const result = await db.query(saveQuery, [JSON.stringify(current_progress), attempt_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy lượt thi đang tiến hành để lưu tiến độ!" });
        }

        return res.status(200).json({ message: "Tiến độ làm bài đã được lưu tự động!", attempt_id: result.rows[0].id });
    }
    catch (error) {
        console.error("Lỗi khi lưu tiến độ làm bài:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi lưu tiến độ làm bài!" });
    }

};