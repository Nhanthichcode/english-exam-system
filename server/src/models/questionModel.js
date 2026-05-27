const db = require('../config/db');

const questionModel = {

    create: async (questionData) => {
        const {
            group_id, question_type, question_text,
            options, correct_answer, explanation, order_in_group
        } = questionData;

        const query = `
        INSERT INTO questions (
                group_id, question_type, question_text, 
                options, correct_answer, explanation, order_in_group
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const value = [
            group_id, question_type, question_text,
            JSON.stringify(options), JSON.stringify(correct_answer), explanation, order_in_group
        ];

        const result = await db.query(query, value);
        return result.rows[0];
    },

    findByGroupId: async (group_id) => {
        const query = 'SELECT * FROM questions WHERE group_id = $1 ORDER BY order_in_group ASC';
        const result = await db.query(query, [group_id]);
        return result.rows;
    }
};

module.exports = questionModel;