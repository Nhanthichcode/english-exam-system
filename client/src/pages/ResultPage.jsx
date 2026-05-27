import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function ResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Đọc dữ liệu điểm số từ state điều hướng nhận được
    const result = location.state?.resultData;

    if (!result) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <p className="text-gray-500 font-semibold mb-4">Không tìm thấy dữ liệu kết quả bài thi!</p>
                <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">Về Dashboard</button>
            </div>
        );
    }

    const { summary, detailed_report } = result;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
                <h1 className="text-3xl font-black text-center text-emerald-600 mb-6 uppercase tracking-wide">🏆 KẾT QUẢ BÀI THI</h1>

                {/* Khối tóm tắt điểm số */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-900 text-white p-6 rounded-2xl text-center mb-8 shadow-inner">
                    <div className="border-r border-gray-700 md:border-r">
                        <span className="block text-xs font-bold text-gray-400 uppercase">Tổng điểm</span>
                        <span className="text-2xl font-black text-amber-400">{summary.final_score}</span>
                    </div>
                    <div className="md:border-r border-gray-700">
                        <span className="block text-xs font-bold text-gray-400 uppercase">Số câu đúng</span>
                        <span className="text-2xl font-black text-emerald-400">{summary.correct_answers}/{summary.total_questions}</span>
                    </div>
                    <div className="border-r border-gray-700">
                        <span className="block text-xs font-bold text-gray-400 uppercase">Số câu sai</span>
                        <span className="text-2xl font-black text-red-400">{summary.wrong_answers}</span>
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase">Mã lượt thi</span>
                        <span className="text-2xl font-mono font-bold text-indigo-300">#{summary.attempt_id}</span>
                    </div>
                </div>

                {/* Khối báo cáo chi tiết từng câu */}
                <h3 className="font-black text-gray-800 mb-4 text-base uppercase border-b pb-2">Chi tiết từng câu:</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto p-2 bg-gray-50 rounded-xl border">
                    {detailed_report.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-2xs">
                            <span className="text-sm font-bold text-gray-700">Câu hỏi #{idx + 1}</span>
                            <div className="flex items-center space-x-4 text-sm">
                                <span className="text-gray-500 font-medium">Bạn chọn: <strong className="text-gray-800">{item.student_answer || 'Bỏ trống'}</strong></span>
                                <span className="text-gray-500 font-medium">Đáp án đúng: <strong className="text-emerald-600">{item.correct_answer}</strong></span>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                                    item.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {item.is_correct ? 'ĐÚNG' : 'SAI'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full mt-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow cursor-pointer"
                >
                    QUAY LẠI TRANG CHỦ DASHBOARD
                </button>
            </div>
        </div>
    );
}

export default ResultPage;