import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ReviewExamPage = () => {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttemptDetail = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/history/attempt/${attemptId}`);
                setDetail(response.data);
            } catch (error) {
                alert(error.response?.data?.message || "Không thể tải chi tiết lượt thi!");
                navigate('/history');
            } finally {
                setLoading(false);
            }
        };
        fetchAttemptDetail();
    }, [attemptId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header Thống kê kết quả nhanh */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <button onClick={() => navigate('/history')} className="text-sm text-gray-500 hover:text-blue-600 mb-2 inline-block">
                        &larr; Quay lại lịch sử
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">{detail.exam_title}</h1>
                    <p className="text-sm text-gray-400">Hoàn thành vào: {new Date(detail.end_time).toLocaleString('vi-VN')}</p>
                </div>
                <div className="text-center bg-blue-50 border border-blue-100 px-6 py-3 rounded-xl">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Điểm Số Đạt Được</span>
                    <div className="text-3xl font-extrabold text-blue-700">{detail.score}</div>
                </div>
            </div>

            {/* Danh sách câu hỏi kèm lời giải thích */}
            <div className="space-y-6">
                {detail.questions.map((question, index) => {
                    const studentChoice = detail.student_answers?.[question.question_id];
                    const correctChoice = question.correct_answer?.key;
                    const isCorrect = studentChoice === correctChoice;

                    return (
                        <div key={question.question_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
                            {/* Thanh chỉ báo Đúng / Sai ở đầu thẻ */}
                            <div className={`absolute top-0 left-0 right-0 h-1.5 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>

                            <div className="flex justify-between items-start mb-4">
                                <span className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-md text-sm">
                                    Câu hỏi {index + 1}
                                </span>
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {isCorrect ? '✓ Đúng' : '✗ Sai'}
                                </span>
                            </div>

                            <p className="text-gray-800 font-medium mb-4">{question.question_text}</p>

                            {/* Khối danh sách các Options lựa chọn */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                {Object.entries(question.options).map(([key, value]) => {
                                    let optionStyle = "border-gray-200 bg-gray-50 text-gray-700";

                                    // Nếu đây là phương án học viên đã chọn
                                    if (key === studentChoice) {
                                        optionStyle = isCorrect 
                                            ? "border-green-500 bg-green-50 text-green-800 font-medium" 
                                            : "border-red-500 bg-red-50 text-red-800 font-medium";
                                    }
                                    // Tô xanh phương án đúng nếu học viên chọn sai để học viên biết đáp án chuẩn
                                    if (key === correctChoice && !isCorrect) {
                                        optionStyle = "border-green-500 bg-green-50 text-green-800 font-medium ring-2 ring-green-200";
                                    }

                                    return (
                                        <div key={key} className={`border p-3 rounded-lg text-sm flex items-center gap-2 ${optionStyle}`}>
                                            <span className="font-bold uppercase">{key}.</span>
                                            <span>{value}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Hộp thoại Lời giải thích (Explanation) */}
                            {question.explanation && (
                                <div className="mt-4 bg-yellow-50/50 border border-yellow-100 rounded-lg p-4 text-sm text-gray-700">
                                    <div className="font-bold text-yellow-800 mb-1">💡 Giải thích đáp án:</div>
                                    <p className="italic text-gray-600">{question.explanation}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ReviewExamPage;