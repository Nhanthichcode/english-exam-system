const db = require('../config/db');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');

// Lấy danh sách toàn bộ người dùng trong hệ thống
exports.getAllUsers = async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.full_name, u.email, r.name as role_name, u.created_at 
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        `;
        const result = await db.query(query);
        return res.status(200).json({ users: result.rows });
    } catch (error) {
        console.error("Lỗi lấy danh sách thành viên:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
};

// Cập nhật vai trò (Role) của người dùng
exports.updateUserRole = async (req, res) => {
    try {
        const { user_id, new_role_id } = req.body;

        if (user_id === req.user.id) {
            return res.status(400).json({ message: "Bạn không thể tự hạ bệ hoặc thay đổi quyền của chính mình!" });
        }

        await db.query('UPDATE users SET role_id = $1 WHERE id = $2', [new_role_id, user_id]);
        return res.status(200).json({ message: "Cập nhật phân quyền thành công!" });
    } catch (error) {
        console.error("Lỗi cập nhật quyền:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
};

exports.createSingleUser = async (req, res) => {
    try {
        const { full_name, email, password, role_id } = req.body;
console.log("Dữ liệu nhận được để tạo người dùng đơn lẻ:", { full_name, email, password, role_id });
        if (!full_name || !email || !password || !role_id) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ tất cả các trường dữ liệu bắt buộc!" });
        }

        // Kiểm tra Email đã tồn tại trong hệ thống chưa
        const userExist = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ message: "Địa chỉ Email này đã được đăng ký bởi thành viên khác!" });
        }

        // Mã hóa bảo mật mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Lưu tài khoản vào database
        const insertQuery = `
            INSERT INTO users (full_name, email, password_hash, role_id, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id, full_name, email, role_id
        `;
        const newUser = await db.query(insertQuery, [full_name, email.toLowerCase(), hashedPassword, role_id]);

        return res.status(201).json({
            message: "Tạo tài khoản thành viên thành công!",
            user: newUser.rows[0]
        });

    } catch (error) {
        console.error("Lỗi tạo người dùng đơn lẻ:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi tạo tài khoản!" });
    }
};

exports.importUsersFromExcel = async (req, res) => {
    try {
        // Kiểm tra xem Admin đã đính kèm file chưa
        if (!req.files || !req.files.excelFile) {
            return res.status(400).json({ message: "Vui lòng tải lên file dữ liệu Excel (.xlsx hoặc .xls)!" });
        }

        const file = req.files.excelFile;
        
        // Đọc dữ liệu Buffer từ file Excel đã tải lên
        const workbook = xlsx.read(file.data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Lấy Sheet đầu tiên
        const worksheet = workbook.Sheets[sheetName];
        
        // Chuyển dữ liệu Excel thành mảng JSON
        const rawUsers = xlsx.utils.sheet_to_json(worksheet);

        if (rawUsers.length === 0) {
            return res.status(400).json({ message: "File Excel rỗng, không tìm thấy dữ liệu học viên!" });
        }

        let successCount = 0;
        let failCount = 0;
        const errorDetails = [];

        // Duyệt qua từng dòng trong file Excel để xử lý
        for (let i = 0; i < rawUsers.length; i++) {
            const row = rawUsers[i];
            const { full_name, email, password, role_id } = row;

            // Kiểm tra tính hợp lệ dữ liệu của dòng
            if (!full_name || !email || !password) {
                failCount++;
                errorDetails.push(`Dòng ${i + 2}: Thiếu thông tin bắt buộc (Họ tên/Email/Mật khẩu).`);
                continue;
            }

            try {
                // Kiểm tra xem email đã tồn tại chưa
                const checkEmail = await db.query('SELECT id FROM users WHERE email = $1', [email.toString().toLowerCase()]);
                if (checkEmail.rows.length > 0) {
                    failCount++;
                    errorDetails.push(`Dòng ${i + 2}: Email '${email}' đã tồn tại hệ thống.`);
                    continue;
                }

                // Mã hóa mật khẩu
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password.toString(), salt);
                
                // Mặc định nếu file Excel không ghi role_id thì gán là 3 (Student)
                const finalRoleId = role_id || 3;

                // Thêm vào Database
                await db.query(
                    'INSERT INTO users (full_name, email, password_hash, role_id, created_at) VALUES ($1, $2, $3, $4, NOW())',
                    [full_name, email.toString().toLowerCase(), hashedPassword, finalRoleId]
                );
                
                successCount++;
            } catch (rowError) {
                failCount++;
                errorDetails.push(`Dòng ${i + 2}: Lỗi cơ sở dữ liệu (${rowError.message}).`);
            }
        }

        return res.status(200).json({
            message: "Quá trình import danh sách hoàn tất!",
            summary: {
                total_processed: rawUsers.length,
                success_count: successCount,
                failed_count: failCount
            },
            errors: errorDetails // Trả về chi tiết để Admin biết dòng nào trong file bị lỗi để sửa
        });

    } catch (error) {
        console.error("Lỗi Import file Excel:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi xử lý file Excel!" });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, role_id } = req.body;

        if (!full_name || !email || !role_id) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin cập nhật!" });
        }

        // Kiểm tra xem email mới có bị trùng với người khác không
        const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email.toLowerCase(), id]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: "Email này đã được sử dụng bởi một tài khoản khác!" });
        }

        const query = `
            UPDATE users 
            SET full_name = $1, email = $2, role_id = $3
            WHERE id = $4
            RETURNING id, full_name, email, role_id
        `;
        const result = await db.query(query, [full_name, email.toLowerCase(), role_id, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng này trong hệ thống!" });
        }

        return res.status(200).json({ message: "Cập nhật thông tin thành công!", user: result.rows[0] });
    } catch (error) {
        console.error("Lỗi cập nhật user:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi sửa thông tin!" });
    }
};

exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body; // Truyền lên true hoặc false

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: "Bạn không thể tự khóa chính tài khoản Admin của mình!" });
        }

        const query = 'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, full_name, is_active';
        const result = await db.query(query, [is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy tài khoản yêu cầu!" });
        }

        const statusMessage = is_active ? "Đã mở khóa tài khoản thành công!" : "Đã khóa tài khoản thành viên thành công!";
        return res.status(200).json({ message: statusMessage, user: result.rows[0] });
    } catch (error) {
        console.error("Lỗi thay đổi trạng thái user:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi thay đổi trạng thái khóa!" });
    }
};

exports.deleteSingleUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: "Bạn không thể tự xóa tài khoản Admin đang đăng nhập!" });
        }

        const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id, full_name', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng cần xóa!" });
        }

        return res.status(200).json({ message: `Đã xóa vĩnh viễn thành viên ${result.rows[0].full_name} khỏi hệ thống.` });
    } catch (error) {
        console.error("Lỗi xóa user đơn lẻ:", error.message);
        // Bắt lỗi ràng buộc dữ liệu (Nếu học viên đã có bài thi trong database, PostgreSQL sẽ chặn không cho xóa để tránh mất data)
        if (error.code === '23503') {
            return res.status(400).json({ message: "Không thể xóa học viên này vì dữ liệu lịch sử thi của họ đang tồn tại. Hãy dùng chức năng KHÓA thay vì XÓA!" });
        }
        return res.status(500).json({ message: "Lỗi hệ thống khi xóa thành viên!" });
    }
};

exports.deleteMultipleUsers = async (req, res) => {
    try {
        const { user_ids } = req.body; // Nhận dạng mảng: [12, 13, 14]

        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({ message: "Vui lòng cung cấp danh sách mảng ID các tài khoản cần xóa!" });
        }

        // Chặn không cho Admin tự xóa chính mình nếu lỡ tay chọn tất cả
        if (user_ids.includes(req.user.id)) {
            return res.status(400).json({ message: "Danh sách xóa chứa ID của chính bạn. Vui lòng bỏ chọn tài khoản Admin hiện tại trước khi xóa hàng loạt!" });
        }

        // Thực thi lệnh xóa hàng loạt bằng toán tử IN của SQL
        const query = 'DELETE FROM users WHERE id = ANY($1) RETURNING id';
        const result = await db.query(query, [user_ids]);

        return res.status(200).json({
            message: `Xóa hàng loạt hoàn tất!`,
            requested_count: user_ids.length,
            successfully_deleted_count: result.rowCount
        });
    } catch (error) {
        console.error("Lỗi xóa hàng loạt:", error.message);
        if (error.code === '23503') {
            return res.status(400).json({ message: "Một hoặc nhiều học viên đã có dữ liệu thi thử, hệ thống không thể xóa hàng loạt. Hãy lọc lại hoặc chọn giải pháp Khóa tài khoản." });
        }
        return res.status(500).json({ message: "Lỗi hệ thống khi thực hiện xóa hàng loạt!" });
    }
};