import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosClient.post('/auth/login', { email, password });
            
            // 1. Lưu Access Token vào localStorage để đính kèm vào các request sau
            localStorage.setItem('accessToken', response.data.accessToken);
            // 2. Lưu thông tin user cơ bản để hiển thị lên giao diện
            localStorage.setItem('userData', JSON.stringify(response.data.user));

            alert('Đăng nhập thành công!');
            // 3. Điều hướng người dùng sang trang Dashboard học viên
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại, vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-3xl font-black text-center text-indigo-600 mb-2">🇬🇧 CHÀO MỪNG</h2>
                <p className="text-gray-500 text-center text-sm mb-6">Đăng nhập để tham gia phòng thi trực tuyến</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Địa chỉ Email</label>
                        <input 
                            type="email" 
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
                        <input 
                            type="password" 
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition duration-200 shadow-md text-sm cursor-pointer disabled:bg-indigo-400"
                    >
                        {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
                    </button>
                </form>

                <p className="text-sm text-gray-600 text-center mt-6">
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="text-indigo-600 font-bold hover:underline">Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;