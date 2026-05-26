const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // Bổ sung cấu hình SSL dưới đây để chạy được với các dịch vụ Cloud như Neon
    ssl: {
        rejectUnauthorized: false
    }
});

// Kiểm tra kết nối khi khởi động ứng dụng
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Lỗi kết nối Database Neon thất bại:', err.stack);
    }
    console.log('Kết nối thành công tới Database PostgreSQL trên Neon.tech!');
    release();
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};