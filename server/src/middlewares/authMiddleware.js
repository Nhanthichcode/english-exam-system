const db = require('../config/db');
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Không tìm thấy quyền truy cập hợp lệ, vui lòng đăng nhập lại!" });
    }
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token === 'undefined' || token === 'null') {
        return res.status(401).json({ message: "Mã xác thực cấu trúc rỗng hoặc không hợp lệ!" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Lỗi xác thực token:", error.message);

        // Trả về mã lỗi 401 rõ ràng thay vì để lỗi sập log hệ thống
        return res.status(401).json({
            message: "Mã truy cập đã hết hạn hoặc bị chỉnh sửa!",
            error: error.message
        });
    };
}
    const checkRole = (allowerRoles) => {
        return (req, res, next) => {
            if (!req.user || !allowerRoles.includes(req.user.role_id)) {
                return res.status(403).json({ message: 'Bạn không có quyền truy cập vào khu vực này' });
            }
            next();
        };
    };

    module.exports = {
        authMiddleware,
        checkRole
    };