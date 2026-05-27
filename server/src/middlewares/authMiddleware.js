const db = require('../config/db');
const jwt = require('jsonwebtoken');
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
if(!token){
    return res.status(401).json({ message: 'Không tìm thấy quyền truy cập' });
}
try{
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
}catch(error){
    console.error('Lỗi xác thực token:', error);
    return res.status(403).json({ message: 'Token hết hạn hoặc không hợp lệ' }); 
}
};
const checkRole = (allowerRoles)=>{
    return (req, res, next)=>{
        if(!req.user || !allowerRoles.includes(req.user.role_id)){
            return res.status(403).json({ message: 'Bạn không có quyền truy cập vào khu vực này' });
        }
        next();
    };
};

module.exports = {
    authMiddleware,
    checkRole
};