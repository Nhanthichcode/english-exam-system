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

        return res.status(201).json({
            message: 'Nhóm câu hỏi và các câu hỏi đã được tạo thành công!',
            group: newGroup,
            questions: saveQuetions
        });
    } catch (error) {
        console.error('Lỗi tạo nhóm câu hỏi:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống phía Server!' });
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
exports.getQuestionDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                q.id,
                q.question_text,
                q.question_type,
                q.options,
                q.correct_answer,
                q.explanation,
                q.order_in_group,
                g.id AS group_id,
                g.title AS group_title,
                g.audio_url,
                g.image_url,
                g.cefr_level_id,
                g.difficulty,
                g.group_type_code
            FROM questions q
            LEFT JOIN question_groups g ON q.group_id = g.id
            WHERE q.id = $1
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy câu hỏi yêu cầu!" });
        }

        return res.status(200).json({
            message: "Tải thông tin chi tiết câu hỏi thành công!",
            question: result.rows[0]
        });
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết câu hỏi:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi tải chi tiết câu hỏi!" });
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

exports.getAdminQuestions = async (req, res) => {
    try {
        // Truy vấn lấy danh sách câu hỏi, sắp xếp theo ID giảm dần (mới nhất lên đầu)
        const query = `
            SELECT id, question_text, question_type, order_in_group 
            FROM questions 
            ORDER BY id DESC
        `;
        const result = await db.query(query);

        return res.status(200).json({
            message: "Lấy danh sách câu hỏi quản trị thành công!",
            questions: result.rows
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách câu hỏi admin:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi tải danh sách câu hỏi!" });
    }
};

// 🚀 API TẠO MỚI CÂU HỎI ĐƠN MỤC TIÊU
exports.createSingleQuestion = async (req, res) => {
    try {
        const { 
            question_text, options, correct_answer, explanation, order_in_group,
            title, cefr_level_id, difficulty, group_type_code, audio_url, image_url 
        } = req.body;

        // Chấp nhận cả 'type' hoặc 'question_type' từ Frontend gửi lên
        const type = req.body.type || req.body.question_type;

        // Kiểm tra validation nghiêm ngặt theo yêu cầu của hệ thống
        if (!type || !options || !correct_answer) {
            return res.status(400).json({ 
                message: "Vui lòng điền đầy đủ các thông tin bắt buộc (type, options, correct_answer)!" 
            });
        }

        // 1. Tự động khởi tạo nhóm câu hỏi (question_groups) trước để lấy group_id
        const groupResult = await db.query(`
            INSERT INTO question_groups (group_type_code, title, audio_url, image_url, cefr_level_id, difficulty)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [group_type_code || 'READING_SINGLE', title || null, audio_url || null, image_url || null, cefr_level_id || 1, difficulty || 3]);

        const group_id = groupResult.rows[0].id;

        // 2. Chèn dữ liệu vào bảng questions với group_id vừa sinh ra
        const questionResult = await db.query(`
            INSERT INTO questions (group_id, question_type, question_text, options, correct_answer, explanation, order_in_group)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            group_id, 
            type, 
            question_text, 
            typeof options === 'string' ? options : JSON.stringify(options), 
            typeof correct_answer === 'object' ? JSON.stringify(correct_answer) : JSON.stringify({ key: correct_answer }), 
            explanation, 
            order_in_group || 1
        ]);

        return res.status(201).json({
            message: "Tạo câu hỏi thành công!",
            question: questionResult.rows[0]
        });
    } catch (error) {
        console.error("Lỗi tạo câu hỏi:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống không thể khởi tạo câu hỏi!" });
    }
};

// 🚀 API CẬP NHẬT CÂU HỎI
exports.updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            question_text, options, correct_answer, explanation, order_in_group,
            title, cefr_level_id, difficulty, group_type_code, audio_url, image_url
        } = req.body;

        const type = req.body.type || req.body.question_type;

        if (!type || !options || !correct_answer) {
            return res.status(400).json({ 
                message: "Vui lòng điền đầy đủ các thông tin bắt buộc (type, options, correct_answer)!" 
            });
        }

        // Tìm group_id hiện tại của câu hỏi để cập nhật song song vào bảng nhóm câu hỏi
        const checkQ = await db.query('SELECT group_id FROM questions WHERE id = $1', [id]);
        if (checkQ.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy câu hỏi cần chỉnh sửa!" });
        }
        const group_id = checkQ.rows[0].group_id;

        // Cập nhật bảng nhóm câu hỏi (question_groups)
        await db.query(`
            UPDATE question_groups 
            SET title = $1, cefr_level_id = $2, difficulty = $3, group_type_code = $4,
                audio_url = COALESCE($5, audio_url), 
                image_url = COALESCE($6, image_url)
            WHERE id = $7
        `, [title, cefr_level_id, difficulty, group_type_code, audio_url, image_url, group_id]);

        // Cập nhật bảng câu hỏi chính (questions)
        const updateQuery = `
            UPDATE questions 
            SET question_type = $1, question_text = $2, options = $3, 
                correct_answer = $4, explanation = $5, order_in_group = $6
            WHERE id = $7
            RETURNING *
        `;
        
        const updatedResult = await db.query(updateQuery, [
            type, 
            question_text, 
            typeof options === 'string' ? options : JSON.stringify(options), 
            typeof correct_answer === 'object' ? JSON.stringify(correct_answer) : JSON.stringify({ key: correct_answer }), 
            explanation, 
            order_in_group, 
            id
        ]);

        return res.status(200).json({
            message: "Cập nhật thông tin câu hỏi thành công!",
            question: updatedResult.rows[0]
        });
    } catch (error) {
        console.error("Lỗi cập nhật câu hỏi:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật dữ liệu!" });
    }
};