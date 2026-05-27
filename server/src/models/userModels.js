const db = require('../config/db');

const User = {
    // 1. Tìm kiếm user bằng Email
    findByEmail: async (email) => {
        const queryText = 'SELECT * FROM users WHERE email = $1';
        const result = await db.query(queryText, [email]);
        return result.rows[0]; // Trả về object user đầu tiên hoặc undefined nếu không thấy
    },

    // 2. Tạo một user mới (Mặc định role_id = 3 là Student)
    create: async (email, passwordHash, fullName) => {
        try {
            const queryText = `
            INSERT INTO users (email, password_hash, full_name, role_id) 
            VALUES ($1, $2, $3, 3) 
            RETURNING id, email, full_name, role_id, created_at
        `;
            const values = [email, passwordHash, fullName];
            const result = await db.query(queryText, values);
            return result.rows[0]; // Trả về thông tin user vừa tạo
        } catch (dbError) {            
            console.error('Lỗi thực thi SQL tại User.create:', dbError.hint || dbError.message);
            throw dbError;
        }}
    };

    module.exports = User;