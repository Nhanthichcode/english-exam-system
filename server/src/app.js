const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const fileUpload = require('express-fileupload');
const db = require('./config/db');
const app = express();
const PORT = process.env.PORT || 5000;

const authRoutes = require('./router/authRoutes');
const questionRoutes = require('./router/questionRoutes');
const examRoutes = require('./router/examRoutes');
const adminRoutes = require('./router/adminRoutes');
const historyRoutes = require('./router/historyRoutes');
const uploadRoutes = require('./router/uploadRoutes');
// Cấu hình Middlewares
app.use(cors({
    origin: 'http://localhost:5173', // URL mặc định của React sau này
    credentials: true // Cho phép gửi cookie kèm theo request
}));
app.use(express.json()); // Cho phép Express đọc dữ liệu dạng JSON từ Client gửi lên
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn kích thước file upload tối đa 10MB
    abortOnLimit: true, // Tự động dừng upload nếu vượt quá giới hạn
    createParentPath: true, // Tự động tạo thư mục cha nếu chưa tồn tại
}));
// Sử dụng các route đã định nghĩa
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/upload', uploadRoutes);

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`Server đang chạy mượt mà tại port: ${PORT}`);
});