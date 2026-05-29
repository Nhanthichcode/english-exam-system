import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { path: '/admin/users', label: '👥 Quản lý Thành viên' },
        { path: '/admin/questions', label: '📝 Ngân hàng Câu hỏi' },
    ];

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar bên trái */}
            <div className="w-64 bg-gray-900 text-white flex flex-col justify-between">
                <div>
                    <div className="p-6 border-b border-gray-800 text-center">
                        <h2 className="text-xl font-bold tracking-wider text-blue-400">ADMIN CONTROL</h2>
                        <p className="text-xs text-gray-400 mt-1">Hệ thống quản trị EdTech</p>
                    </div>
                    <nav className="mt-6 px-4 space-y-2">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                        isActive 
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                
                <div className="p-4 border-t border-gray-800">
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white py-2 px-4 rounded-lg text-sm font-medium transition-all text-center"
                    >
                        &larr; Về Trang Chủ Học Viên
                    </button>
                </div>
            </div>

            {/* Vùng nội dung bên phải */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-end items-center">
                    <div className="text-sm text-gray-600 font-medium">
                        Quyền hạn: <span className="text-blue-600">Quản trị viên</span>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
                    <Outlet /> {/* Nơi chứa nội dung thay đổi của từng trang con */}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;