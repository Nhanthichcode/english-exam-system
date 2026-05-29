import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });

            const { accessToken, user } = response.data;

            // 1. Lưu Access Token và thông tin user cơ bản vào LocalStorage/State toàn cục
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(user));

            // 2. Thuật toán điều hướng phân lớp dựa theo Vai trò (role_id)
            switch (user.role_id) {
                case 1:
                    // Vai trò Admin: Đưa thẳng vào khu quản trị thành viên
                    navigate('/admin/users');
                    break;
                case 2:
                    // Vai trò Giáo viên: Đưa vào khu quản lý ngân hàng câu hỏi
                    navigate('/admin/questions');
                    break;
                case 3:
                    // Vai trò Học viên: Đưa ra danh sách đề thi để luyện tập
                    navigate('/exams');
                    break;
                default:
                    // Trường hợp ngoại lệ không xác định vai trò
                    navigate('/');
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Đăng Nhập Hệ Thống</h2>
                <p className="text-center text-gray-400 text-sm mb-6">Sử dụng tài khoản được cấp để truy cập phân hệ</p>
                
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Địa chỉ Email</label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="name@example.com" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Mật khẩu</label>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="••••••••" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-all shadow-sm shadow-blue-600/10">
                        Xác Nhận Đăng Nhập
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;