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
    },

    getExamDetailsForStudent: async (examId) => {
        const examQuery = 'SELECT id, title, total_time_minutes, exam_type_id FROM exams WHERE id = $1';
        const examResult = await db.query(examQuery, [examId]);
        if (examResult.rows.length === 0) return null;

        const exam = examResult.rows[0];

        // Lấy danh sách các phần thi (Sections) của đề này
        const sectionsQuery = 'SELECT id, part_template_id, section_order, skill_id, instructions FROM exam_sections WHERE exam_id = $1 ORDER BY section_order ASC';
        const sectionsResult = await db.query(sectionsQuery, [examId]);
        exam.sections = sectionsResult.rows;

        // Lặp qua từng section để lấy các câu hỏi cấu trúc theo nhóm
        for (let section of exam.sections) {
            const questionsQuery = `
                SELECT 
                    eq.order_in_section, eq.score,
                    q.id as question_id, q.question_type, q.question_text, q.options, q.order_in_group,
                    qg.id as group_id, qg.title as group_title, qg.content as group_content, 
                    qg.audio_url, qg.image_url
                FROM exam_questions eq
                JOIN questions q ON eq.question_id = q.id
                JOIN question_groups qg ON eq.group_id = qg.id
                WHERE eq.exam_section_id = $1
                ORDER BY eq.order_in_section ASC
            `;
            const qResult = await db.query(questionsQuery, [section.id]);

            // Xử lý nhóm các câu hỏi con vào đúng Question Group của chúng để React dễ render cấu trúc cây
            const groupsMap = {};
            qResult.rows.forEach(row => {
                if (!groupsMap[row.group_id]) {
                    groupsMap[row.group_id] = {
                        group_id: row.group_id,
                        title: row.group_title,
                        content: row.group_content,
                        audio_url: row.audio_url,
                        image_url: row.image_url,
                        questions: []
                    };
                }
                groupsMap[row.group_id].questions.push({
                    id: row.question_id,
                    question_type: row.question_type,
                    question_text: row.question_text,
                    options: row.options,
                    order_in_section: row.order_in_section,
                    score: row.score
                });
            });

            section.groups = Object.values(groupsMap);
        }

        return exam;
    }
};

module.exports = Exam;