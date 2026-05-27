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

exports.submitExamAndGrade = async (req, res) => {
    try {
        const { attempt_id, answers } = req.body; // answers dạng object: {"1": "A", "2": "C"} (Key là question_id, Value là đáp án chọn)

        if (!attempt_id || !answers) {
            return res.status(400).json({ message: "Thiếu mã lượt thi hoặc danh sách đáp án bài làm!" });
        }

        // 1. Kiểm tra trạng thái lượt thi hiện tại xem có hợp lệ (đang làm) không
        const attemptCheck = await db.query(
            'SELECT exam_id, status FROM exam_attempts WHERE id = $1', 
            [attempt_id]
        );
        
        if (attemptCheck.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy lượt thi này!" });
        }
        if (attemptCheck.rows[0].status === 'completed') {
            return res.status(400).json({ message: "Bài thi này đã được nộp và chấm điểm trước đó!" });
        }

        const examId = attemptCheck.rows[0].exam_id;

        // 2. Lấy danh sách đáp án ĐÚNG và ĐIỂM SỐ của từng câu hỏi thuộc đề thi này trực tiếp từ DB
        const correctAnswersQuery = `
            SELECT q.id as question_id, q.correct_answer, eq.score
            FROM exam_questions eq
            JOIN questions q ON eq.question_id = q.id
            JOIN exam_sections es ON eq.exam_section_id = es.id
            WHERE es.exam_id = $1
        `;
        const correctAnswersResult = await db.query(correctAnswersQuery, [examId]);
        const correctQuestions = correctAnswersResult.rows;

        // 3. Khởi tạo các biến tính toán kết quả
        let totalScore = 0;
        let totalCorrect = 0;
        let totalQuestions = correctQuestions.length;
        const detailedResults = []; // Lưu chi tiết để trả về báo cáo dạng: câu này đúng hay sai, đáp án nào đúng

        // 4. Thuật toán so khớp đáp án
        correctQuestions.forEach(q => {
            const questionIdStr = q.question_id.toString();
            const studentAnswer = answers[questionIdStr] || null; // Đáp án học sinh chọn (nếu bỏ trống thì mặc định null)
            
            // Trường correct_answer lưu dạng JSON trong DB, ví dụ: {"key": "A"}
            const correctAnswerKey = q.correct_answer?.key; 

            const isCorrect = (studentAnswer !== null && studentAnswer.trim().toUpperCase() === correctAnswerKey.trim().toUpperCase());

            if (isCorrect) {
                totalCorrect++;
                totalScore += parseFloat(q.score); // Cộng điểm của câu đó vào tổng điểm
            }

            // Đóng gói thông tin chi tiết từng câu để lưu lịch sử làm bài bài bản
            detailedResults.push({
                question_id: q.question_id,
                student_answer: studentAnswer,
                correct_answer: correctAnswerKey,
                is_correct: isCorrect,
                score_earned: isCorrect ? parseFloat(q.score) : 0
            });
        });

        // 5. Cập nhật kết quả chấm điểm vào bảng exam_attempts trong Database
        const updateAttemptQuery = `
            UPDATE exam_attempts
            SET 
                end_time = NOW(),
                status = 'completed',
                score = $1,
                current_progress = $2 -- Lưu lại toàn bộ mảng đáp án cuối cùng
            WHERE id = $3
            RETURNING id, start_time, end_time
        `;
        
        const updateResult = await db.query(updateAttemptQuery, [
            totalScore, 
            JSON.stringify(answers), 
            attempt_id
        ]);

        const attemptInfo = updateResult.rows[0];

        // 6. Trả về kết quả trực quan cho Thí sinh xem điểm ngay lập tức
        return res.status(200).json({
            message: "Nộp bài thi và chấm điểm thành công!",
            summary: {
                attempt_id: attemptInfo.id,
                total_questions: totalQuestions,
                correct_answers: totalCorrect,
                wrong_answers: totalQuestions - totalCorrect,
                final_score: totalScore,
                start_time: attemptInfo.start_time,
                end_time: attemptInfo.end_time
            },
            detailed_report: detailedResults // Chi tiết từng câu đúng sai phục vụ tính năng "Xem giải thích đáp án"
        });

    } catch (error) {
        console.error("Lỗi xử lý nộp bài và chấm điểm:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi xử lý chấm điểm!" });
    }
};