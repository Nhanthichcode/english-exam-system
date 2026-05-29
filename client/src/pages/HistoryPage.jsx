import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HistoryPage = () => {
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Axios Client đã được cấu hình tự động đính kèm Token ở Interceptors
                const response = await axios.get('http://localhost:5000/api/history/my-history');
                setHistoryList(response.data.history);
            } catch (error) {
                console.error("Lỗi lấy lịch sử:", error.response?.data?.message || error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
     navigator.current;
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Lịch sử luyện thi cá nhân</h1>
                <p className="text-gray-500 text-sm">Xem lại các bài thi thử đã làm và theo dõi tiến độ tăng trưởng điểm số.</p>
            </div>

            {historyList.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
                    <p className="text-gray-500 mb-4">Bạn chưa thực hiện bài thi thử nào trong hệ thống.</p>
                    <button 
                        onClick={() => navigate('/exams')} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-all"
                    >
                        Thi Ngay Cung Thôi!
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-sm font-semibold border-b border-gray-100">
                                <th className="p-4">Tên Đề Thi</th>
                                <th className="p-4">Ngày Làm Bài</th>
                                <th className="p-4">Thời Gian Làm</th>
                                <th className="p-4 text-center">Điểm Số</th>
                                <th className="p-4 text-center">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {historyList.map((item) => {
                                const startTime = new Date(item.start_time);
                                const endTime = new Date(item.end_time);
                                const durationMinutes = Math.round((endTime - startTime) / 60000);

                                return (
                                    <tr key={item.attempt_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-medium text-gray-900">{item.exam_title}</td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {startTime.toLocaleDateString('vi-VN')} {startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">{durationMinutes} phút</td>
                                        <td className="p-4 text-center">
                                            <span className="inline-block bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
                                                {item.score}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => navigate(`/history/attempt/${item.attempt_id}`)}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-200 hover:border-blue-400 px-3 py-1 rounded-md transition-all bg-blue-50/30"
                                            >
                                                Xem Giải Thích
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
