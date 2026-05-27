const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const db = require('./config/db');
const app = express();
const PORT = process.env.PORT || 5000;

const authRoutes = require('./router/authRoutes');

// Cấu hình Middlewares
app.use(cors({
    origin: 'http://localhost:3000', // URL mặc định của React sau này
    credentials: true // Cho phép gửi cookie kèm theo request
}));
app.use(express.json()); // Cho phép Express đọc dữ liệu dạng JSON từ Client gửi lên
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Route test kiểm tra server hoạt động
app.get('/api/test', (req, res) => {
    res.json({ message: "Backend Node.js + Express đã sẵn sàng!" });
});

// Sử dụng các route đã định nghĩa
app.use('/api/auth', authRoutes);

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`Server đang chạy mượt mà tại port: ${PORT}`);
});