const db = require('../config/db');
const Token = {
    // 1. Lưu Refresh Token mới vào Database
    create: async (userId, tokenHash, expiresAt) => {
        const queryText = `
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at) 
            VALUES ($1, $2, $3) 
            RETURNING *
        `;
        const values = [userId, tokenHash, expiresAt];
        const result = await db.query(queryText, values);
        return result.rows[0];
    },

    delete: async (tokenHash) => {
        const queryText = `
            DELETE FROM refresh_tokens
            WHERE token_hash = $1
        `;
        await db.query(queryText, [tokenHash]);
    },

    findByToken: async (tokenHash) => {
        const queryText = 'SELECT * FROM refresh_tokens WHERE token_hash = $1';
        const result = await db.query(queryText, [tokenHash]);
        return result.rows[0]; // Trả về bản ghi nếu tìm thấy
    }
};


module.exports = Token;