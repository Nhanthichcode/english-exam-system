import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role_id: 3 });

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get('http://localhost:5000/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.users);
        } catch (error) {
            console.error("Lỗi lấy danh sách user:", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Hàm xử lý Khóa / Mở khóa tài khoản bảo mật
    const toggleStatus = async (id, isActiveCurrently) => {
        try {
            const token = localStorage.getItem('accessToken');
            // Đảo ngược trạng thái: Nếu đang active (true) thì nextStatus sẽ là false
            const nextStatus = !isActiveCurrently; 

            const response = await axios.patch(
                `http://localhost:5000/api/admin/users/${id}/status`, 
                { is_active: nextStatus },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Bóc tách dữ liệu lồng trả về từ API: response.data.user
            const updatedUser = response.data.user;

            if (updatedUser) {
                // Cập nhật cục bộ state của React để thay đổi giao diện ngay lập tức
                setUsers(prevUsers => 
                    prevUsers.map(u => 
                        u.id === id ? { ...u, is_active: updatedUser.is_active } : u
                    )
                );
            } else {
                fetchUsers();
            }
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái:", error.response?.data?.message || error.message);
            alert(error.response?.data?.message || "Lỗi khi cập nhật trạng thái người dùng!");
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(
                'http://localhost:5000/api/admin/users/create-single', 
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            alert("Tạo tài khoản thành công!");
            setFormData({ full_name: '', email: '', password: '', role_id: 3 });
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi tạo tài khoản!");
        }
    };

    if (loading) return <div className="text-center py-10">Đang tải dữ liệu thành viên...</div>;

    return (
        <div className="space-y-8">
            {/* Form thêm nhanh tài khoản */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Tạo tài khoản thành viên mới</h3>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Họ và Tên</label>
                        <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Nguyen Van A" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Địa chỉ Email</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="name@gmail.com" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Mật khẩu ban đầu</label>
                        <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="••••••••" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Vai trò hệ thống</label>
                        <select value={formData.role_id} onChange={e => setFormData({...formData, role_id: parseInt(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20">
                            <option value={3}>Học viên (Student)</option>
                            <option value={2}>Giáo viên (Teacher)</option>
                            <option value={1}>Quản trị viên (Admin)</option>
                        </select>
                    </div>
                    <div className="md:col-span-4 flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 py-2 rounded-lg transition-all">
                            + Khởi Tạo Tài Khoản
                        </button>
                    </div>
                </form>
            </div>

            {/* Bảng danh sách hiển thị */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Danh sách thành viên hệ thống</h3>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-xs font-semibold border-b border-gray-100 uppercase tracking-wider">
                            <th className="p-4">Họ và Tên</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Chức vụ</th>
                            <th className="p-4 text-center">Trạng thái</th>
                            <th className="p-4 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                        {users.map((user) => {
                            // Ép kiểu kiểm tra trạng thái an toàn tuyệt đối
                            const isActive = user.is_active === true || String(user.is_active) === 'true' || user.is_active === null;
                            
                            return (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 font-medium text-gray-900">{user.full_name}</td>
                                    <td className="p-4 text-gray-500">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${user.role_name === 'Admin' ? 'bg-purple-50 text-purple-700' : user.role_name === 'Teacher' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                                            {user.role_name}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${!isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <span className="text-xs ml-1.5 text-gray-500">{!isActive ? 'Đang chạy' : 'Bị Khóa'}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => toggleStatus(user.id, isActive)}
                                            className={`text-xs font-semibold px-3 py-1 rounded-md transition-all ${!isActive ? 'border border-red-200 text-red-600 bg-red-50/30 hover:bg-red-50' : 'border border-green-200 text-green-600 bg-green-50/30 hover:bg-green-50'}`}
                                        >
                                            {!isActive ? 'Khóa lại' : 'Mở khóa'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;