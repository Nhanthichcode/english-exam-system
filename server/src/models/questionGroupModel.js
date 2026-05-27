const db = require('../config/db');

const QuestionGroup = {

    create: async (groupData) =>{
        const {
            group_type_code, title, content, audio_url,
            transcript_en, transcript_vi, image_url,
            cefr_level_id, difficulty, tags, created_by
        } = groupData;

        const query =`
        INSERT INTO question_groups (
                group_type_code, title, content, audio_url, 
                transcript_en, transcript_vi, image_url, 
                cefr_level_id, difficulty, tags, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const value = [
            group_type_code, title, content, audio_url,
            transcript_en, transcript_vi, image_url,
            cefr_level_id, difficulty, JSON.stringify(tags || []), created_by
        ];

        const result = await db.query(query, value);
        return result.rows[0];
    },

    findById: async (id) => {
        const query = 'SELECT * FROM question_groups WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

};

module.exports = QuestionGroup;