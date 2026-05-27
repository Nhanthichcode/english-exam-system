const Question = require('../models/questionModel');
const QuestionGroup = require('../models/questionGroupModel');
const db = require('../config/db');
const xlsx = require('xlsx');

exports.createFullQuestionGroup = async (req, res) => {
    try {
        const { group_info, questions } = req.body;
        const created_by = req.user.id;
        if (!group_info || !questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ. Vui lòng cung cấp đầy đủ thông tin nhóm câu hỏi và danh sách câu hỏi.' });
        }
        const newGroup = await QuestionGroup.create({ ...group_info, group_type_code: group_info.group_type_code || 'STANDARD', created_by });
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

// ================================================================
// 1. API: THÊM MỘT CÂU HỎI ĐƠN LẺ (Form Fill)
// ================================================================
exports.createSingleQuestion = async (req, res) => {
    try {
        const { group_id, question_type, question_text, options, correct_answer, explanation, order_in_group } = req.body;

        if (!group_id || !question_type || !options || !correct_answer) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ các thông tin bắt buộc (group_id, type, options, correct_answer)!" });
        }

        const insertQuery = `
            INSERT INTO questions (group_id, question_type, question_text, options, correct_answer, explanation, order_in_group, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING *
        `;
        
        // Lưu ý: options và correct_answer truyền từ Frontend lên dạng Object/JSON, pg sẽ tự động map vào cột JSONB
        const result = await db.query(insertQuery, [
            group_id, 
            question_type, 
            question_text, 
            JSON.stringify(options), 
            JSON.stringify(correct_answer), 
            explanation, 
            order_in_group || 1
        ]);

        return res.status(201).json({
            message: "Thêm câu hỏi đơn lẻ thành công!",
            question: result.rows[0]
        });
    } catch (error) {
        console.error("Lỗi thêm câu hỏi đơn lẻ:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi thêm câu hỏi!" });
    }
};

// ================================================================
// 2. API: IMPORT CÂU HỎI HÀNG LOẠT BẰNG FILE EXCEL
// ================================================================
exports.importQuestionsFromExcel = async (req, res) => {
    try {
        if (!req.files || !req.files.excelFile) {
            return res.status(400).json({ message: "Vui lòng tải lên file Excel (.xlsx hoặc .xls)!" });
        }

        const file = req.files.excelFile;
        const workbook = xlsx.read(file.data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawQuestions = xlsx.utils.sheet_to_json(worksheet);

        if (rawQuestions.length === 0) {
            return res.status(400).json({ message: "File Excel rỗng, không tìm thấy dữ liệu câu hỏi!" });
        }

        let successCount = 0;
        let failCount = 0;
        const errorDetails = [];

        for (let i = 0; i < rawQuestions.length; i++) {
            const row = rawQuestions[i];
            const { group_id, question_type, question_text, options, correct_answer, explanation, order_in_group } = row;

            // Kiểm tra tính hợp lệ dữ liệu cơ bản
            if (!group_id || !question_type || !options || !correct_answer) {
                failCount++;
                errorDetails.push(`Dòng ${i + 2}: Thiếu thông tin bắt buộc.`);
                continue;
            }

            try {
                // Ép kiểu JSON cho trường options và correct_answer đọc từ Excel text
                let parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
                let parsedCorrectAnswer = typeof correct_answer === 'string' ? JSON.parse(correct_answer) : correct_answer;

                const insertQuery = `
                    INSERT INTO questions (group_id, question_type, question_text, options, correct_answer, explanation, order_in_group, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                `;

                await db.query(insertQuery, [
                    group_id,
                    question_type,
                    question_text,
                    JSON.stringify(parsedOptions),
                    JSON.stringify(parsedCorrectAnswer),
                    explanation || null,
                    order_in_group || 1
                ]);

                successCount++;
            } catch (rowError) {
                failCount++;
                errorDetails.push(`Dòng ${i + 2}: Lỗi định dạng dữ liệu hoặc SQL (${rowError.message}).`);
            }
        }

        return res.status(200).json({
            message: "Quá trình import danh sách câu hỏi hoàn tất!",
            summary: {
                total_processed: rawQuestions.length,
                success_count: successCount,
                failed_count: failCount
            },
            errors: errorDetails
        });
    } catch (error) {
        console.error("Lỗi Import câu hỏi từ Excel:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi xử lý file Excel câu hỏi!" });
    }
};

// ================================================================
// 3. API: SỬA THÔNG TIN CÂU HỎI
// ================================================================
exports.updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { question_type, question_text, options, correct_answer, explanation, order_in_group } = req.body;

        if (!question_type || !options || !correct_answer) {
            return res.status(400).json({ message: "Vui lòng không để trống các thông tin cốt lõi!" });
        }

        const query = `
            UPDATE questions 
            SET question_type = $1, question_text = $2, options = $3, correct_answer = $4, explanation = $5, order_in_group = $6
            WHERE id = $7
            RETURNING *
        `;

        const result = await db.query(query, [
            question_type, 
            question_text, 
            JSON.stringify(options), 
            JSON.stringify(correct_answer), 
            explanation, 
            order_in_group, 
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy câu hỏi yêu cầu cập nhật!" });
        }

        return res.status(200).json({ message: "Cập nhật câu hỏi thành công!", question: result.rows[0] });
    } catch (error) {
        console.error("Lỗi sửa câu hỏi:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi chỉnh sửa câu hỏi!" });
    }
};

// ================================================================
// 4. API: XÓA ĐƠN LẺ MỘT CÂU HỎI
// ================================================================
exports.deleteSingleQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query('DELETE FROM questions WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy câu hỏi cần xóa!" });
        }

        return res.status(200).json({ message: `Đã xóa vĩnh viễn câu hỏi ID #${id} khỏi hệ thống.` });
    } catch (error) {
        console.error("Lỗi xóa một câu hỏi:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi xóa câu hỏi!" });
    }
};

// ================================================================
// 5. API: XÓA SỐ LƯỢNG LỚN CÂU HỎI (Bulk Delete)
// ================================================================
exports.deleteMultipleQuestions = async (req, res) => {
    try {
        const { question_ids } = req.body; // Mảng ID truyền lên dạng: [101, 102, 103]

        if (!question_ids || !Array.isArray(question_ids) || question_ids.length === 0) {
            return res.status(400).json({ message: "Vui lòng cung cấp danh sách mảng ID các câu hỏi cần xóa!" });
        }

        const query = `
            DELETE FROM questions 
            WHERE id = ANY($1) 
            AND id NOT IN (SELECT DISTINCT question_id FROM exam_questions WHERE question_id IS NOT NULL)
            RETURNING id
        `;
        const result = await db.query(query, [question_ids]);
const skippedCount = question_ids.length - result.rowCount;
        return res.status(200).json({
            message: "Xóa hàng loạt câu hỏi hoàn tất!",
            summary: {
                total_requested: question_ids.length,       
                successfully_deleted: result.rowCount,     
                skipped_used_questions: skippedCount       
            },
            deleted_ids: result.rows.map(row => row.id)
        });
    } catch (error) {
        console.error("Lỗi xóa hàng loạt câu hỏi:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi thực hiện xóa hàng loạt!" });
    }
};