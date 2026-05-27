import React from 'react';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('userData')) || { full_name: 'Học viên' };

    const handleLogout = () => {
        localStorage.clear(); // Xóa sạch token trong máy
        alert('Đã đăng xuất tài khoản!');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Xin chào, {user.full_name}! 👋</h1>
                    <p className="text-sm text-gray-500">Mã vai trò của bạn: Role ID = {user.role_id} (Học sinh)</p>
                </div>
                <button 
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-xl transition cursor-pointer"
                >
                    Đăng xuất
                </button>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-md">
                    <h3 className="text-lg font-bold mb-2">Luyện thi TOEIC</h3>
                    <p className="text-sm text-indigo-100 mb-4">Trải nghiệm phòng thi mô phỏng đầy đủ với đồng hồ bấm giờ và chấm điểm tự động.</p>
                    <button className="px-4 py-2 bg-white text-indigo-600 font-bold text-xs rounded-lg shadow cursor-pointer">VÀO PHÒNG THI</button>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;