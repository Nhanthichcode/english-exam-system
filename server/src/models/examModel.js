const db = require('../config/db');

const Exam = {
    createDraft: async (examData) => {
        const { exam_type_id, creator_id, title, total_time_minutes } = examData;
        const queryText = `
            INSERT INTO exams (exam_type_id, creator_id, title, status, total_time_minutes)
            VALUES ($1, $2, $3, 'draft', $4)
            RETURNING *
        `;
        const values = [exam_type_id, creator_id, title, total_time_minutes];
        const result = await db.query(queryText, values);
        return result.rows[0];
    },

    generateSectionsFromTemplate: async (examId, examTypeId) => {
        // Lấy tất cả cấu trúc các Part được định nghĩa sẵn cho loại đề thi này
        const templateQuery = `
            SELECT * FROM part_templates 
            WHERE exam_type_id = $1 
            ORDER BY part_number ASC
        `;
        const templates = await db.query(templateQuery, [examTypeId]);

        const createdSections = [];
        // Lặp qua từng Part mẫu để chèn vào bảng exam_sections của đề thi này
        for (let i = 0; i < templates.rows.length; i++) {
            const template = templates.rows[i];
            const sectionQuery = `
                INSERT INTO exam_sections (exam_id, part_template_id, section_order, skill_id, instructions)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            const values = [
                examId, 
                template.id, 
                i + 1, // Thứ tự xuất hiện của phần này trong đề thi
                template.skill_id, 
                `Vui lòng trả lời các câu hỏi dựa trên ${template.part_name}` // Hướng dẫn mặc định
            ];
            const sectionResult = await db.query(sectionQuery, values);
            createdSections.push(sectionResult.rows[0]);
        }
        return createdSections;
    }
};

module.exports = Exam;