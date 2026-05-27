const Users = require("../models/userModels");
const Token = require("../models/tokenModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, full_name: user.full_name, email: user.email, role_id: user.role_id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "1h" },
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role_id: user.role_id },
        process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

exports.register = async (req, res) => {
    const { email, password, full_name } = req.body;
    try {
        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await Users.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "Email đã được sử dụng" });
        }

        // Hash mật khẩu
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Tạo user mới
        const newUser = await Users.create(email, passwordHash, full_name);

        // Tạo token JWT
        const token = jwt.sign(
            { id: newUser.id, full_name: newUser.full_name, email: newUser.email, role_id: newUser.role_id },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: "1h" },
        );

        res.status(201).json({ message: "Đăng ký thành công", token, user: newUser });
    } catch (error) {
        console.error("Lỗi Đăng ký:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống phía Server!" });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mật khẩu!" });
        }
        // Tìm user theo email
        const user = await Users.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
        }

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
        }

        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Refresh token có hạn 7 ngày
        await Token.create(user.id, refreshToken, expiresAt);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Chỉ gửi cookie qua HTTPS trong production
            sameSite: 'Strict', // Ngăn chặn CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });

        return res.status(200).json({
            message: "Đăng nhập thành công",
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name?? "Không có tên",
                role_id: user.role_id
            }
        });
    } catch (error) {
        console.error("Lỗi Đăng nhập:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống phía Server!" });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // req.user hiện tại đã có đầy đủ thông tin giải mã từ Token mới
        return res.status(200).json({
            message: "Chào mừng bạn đến với khu vực tài khoản cá nhân",
            user_data: {
                id: req.user.id,
                email: req.user.email,
                role_id: req.user.role_id,
                full_name: req.user.full_name,
                iat: req.user.iat,
                exp: req.user.exp
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
};

exports.logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(400).json({ message: "Không tìm thấy refresh token!" });
    }
    try {
        await Token.delete(refreshToken);
        res.clearCookie('refreshToken');
        return res.status(200).json({ message: "Đăng xuất thành công" });
    } catch (error) {
        console.error("Lỗi Đăng xuất:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống phía Server!" });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        // 1. Lấy mã refresh token từ HttpOnly Cookie gửi lên
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!" });
        }

        // 2. Kiểm tra xem Token này có tồn tại trong Database không
        const tokenInDb = await Token.findByToken(refreshToken);
        if (!tokenInDb) {
            return res.status(403).json({ message: "Refresh Token không hợp lệ!" });
        }

        // 3. Kiểm tra xem token đã bị thu hồi (revoked) hoặc hết hạn chưa
        if (tokenInDb.revoked || new Date(tokenInDb.expires_at) < new Date()) {
            return res.status(403).json({ message: "Refresh Token đã hết hạn hoặc bị thu hồi!" });
        }

        // 4. Xác thực tính toàn vẹn của Token bằng jwt.verify
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Mã xác thực không hợp lệ hoặc đã bị chỉnh sửa!" });
            }

            // 5. Lấy lại thông tin user để đóng gói vào Access Token mới
            const userQuery = await db.query('SELECT id, email, full_name, role_id FROM users WHERE id = $1', [decoded.id]);
            const user = userQuery.rows[0];

            if (!user) {
                return res.status(404).json({ message: "Không tìm thấy người dùng phù hợp!" });
            }

            // 6. Cấp Access Token mới
            const newAccessToken = jwt.sign(
                { id: user.id, email: user.email, full_name: user.full_name, role_id: user.role_id },
                process.env.JWT_ACCESS_SECRET,
                { expiresIn: '15m' }
            );

            // 7. Trả về Access Token mới cho Client React sử dụng tiếp
            return res.status(200).json({
                accessToken: newAccessToken
            });
        });

    } catch (error) {
        console.error("Lỗi Refresh Token:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống phía Server!" });
    }
};