const db = require('../config/db');

// Lấy danh sách lịch sử thi của học viên hiện tại
exports.getExamHistory = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy từ authMiddleware

        const query = `
            SELECT ea.id as attempt_id, e.title as exam_title, 
                    ea.start_time, ea.end_time, ea.score, ea.status
            FROM exam_attempts ea
            JOIN exams e ON ea.exam_id = e.id
            WHERE ea.user_id = $1 AND ea.status = 'completed'
            ORDER BY ea.end_time DESC
        `;
        const result = await db.query(query, [userId]);

        return res.status(200).json({ history: result.rows });
    } catch (error) {
        console.error("Lỗi lấy lịch sử thi:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi lấy lịch sử!" });
    }
};

// Xem lại chi tiết bài làm của một lượt thi cụ thể (Phục vụ tính năng Xem Giải Thích)
exports.getAttemptDetail = async (req, res) => {
    try {
        const { attempt_id } = req.params;
        const userId = req.user.id;

        // Kiểm tra lượt thi có thuộc về học viên này không
        const attemptQuery = `
            SELECT ea.*, e.title as exam_title 
            FROM exam_attempts ea
            JOIN exams e ON ea.exam_id = e.id
            WHERE ea.id = $1 AND ea.user_id = $2
        `;
        const attemptRes = await db.query(attemptQuery, [attempt_id, userId]);
        if (attemptRes.rows.length === 0) {
            return res.status(403).json({ message: "Bạn không có quyền xem lượt thi này!" });
        }

        const attempt = attemptRes.rows[0];

        // Lấy lại danh sách đáp án đúng để đối chiếu giải thích
        const correctAnswersQuery = `
            SELECT q.id as question_id, q.question_text, q.options, q.correct_answer, q.explanation, eq.score
            FROM exam_questions eq
            JOIN questions q ON eq.question_id = q.id
            JOIN exam_sections es ON eq.exam_section_id = es.id
            WHERE es.exam_id = $1
        `;
        const qaRes = await db.query(correctAnswersQuery, [attempt.exam_id]);

        return res.status(200).json({
            exam_title: attempt.exam_title,
            score: attempt.score,
            start_time: attempt.start_time,
            end_time: attempt.end_time,
            student_answers: attempt.current_progress, // Chuỗi JSONB chứa đáp án học viên chọn
            questions: qaRes.rows
        });
    } catch (error) {
        console.error("Lỗi lấy chi tiết lượt thi:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
};