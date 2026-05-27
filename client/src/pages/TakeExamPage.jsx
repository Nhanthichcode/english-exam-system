import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '/src/api/axiosClient';

function TakeExamPage() {
    const { id } = useParams(); // Lấy ID đề thi từ URL
    const navigate = useNavigate();
    
    const [examData, setExamData] = useState(null);
    const [attemptId, setAttemptId] = useState(null);
    const [answers, setAnswers] = useState({}); // Lưu trữ đáp án thí sinh chọn {"1": "A", "2": "B"}
    const [timeLeft, setTimeLeft] = useState(0); // Thời gian làm bài (giây)
    const [loading, setLoading] = useState(true);
    
    const timerRef = useRef(null);

    // 1. Tải đề thi từ Backend khi vào phòng
    useEffect(() => {
        axiosClient.get(`/exams/${id}/take`)
            .then(res => {
                const data = res.data.exam_data;
                setExamData(data);
                setAttemptId(data.attempt_id);
                setTimeLeft(data.total_time_minutes * 60); // Đổi phút thành giây
                setLoading(false);
            })
            .catch(err => {
                alert(err.response?.data?.message || 'Không thể truy cập phòng thi!');
                console.error("Lỗi tải đề thi:", err.message);
                navigate('/dashboard');
            });

        return () => clearInterval(timerRef.current);
    }, [id]);

    // 2. Bộ đếm ngược thời gian (Countdown)
    useEffect(() => {
        if (timeLeft <= 0 && !loading) {
            handleAutoSubmit(); // Tự động nộp bài khi hết giờ
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [timeLeft, loading]);

    // 3. Tự động lưu tiến trình (Auto-save) lên Server mỗi khi answers thay đổi
    useEffect(() => {
        if (attemptId && Object.keys(answers).length > 0) {
            const delayDebounce = setTimeout(() => {
                axiosClient.post('/exams/auto-save', {
                    attempt_id: attemptId,
                    current_progress: answers
                }).catch(err => console.error("Lỗi tự động lưu bài:", err.message));
            }, 2000); // Tự động lưu sau 2 giây khi người dùng ngừng click chọn

            return () => clearTimeout(delayDebounce);
        }
    }, [answers, attemptId]);

    // 4. Xử lý khi thí sinh tích chọn đáp án
    const handleSelectOption = (questionId, optionKey) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionKey
        }));
    };

    // 5. Hàm nộp bài thủ công
    const handleSubmitExam = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn nộp bài thi này không?")) return;
        executeSubmit();
    };

    // 6. Hàm tự động nộp bài khi hết giờ
    const handleAutoSubmit = () => {
        alert("🚨 Hết giờ làm bài! Hệ thống tự động nộp bài của bạn.");
        executeSubmit();
    };

    const executeSubmit = async () => {
        clearInterval(timerRef.current);
        try {
            const res = await axiosClient.post('/exams/submit', {
                attempt_id: attemptId,
                answers: answers
            });
            // Nộp xong thì truyền kết quả chấm điểm sang trang hiển thị kết quả
            navigate(`/exams/result`, { state: { resultData: res.data } });
        } catch (err) {
            alert("Lỗi khi nộp bài thi: " + (err.response?.data?.message || err.message));
        }
    };

    // Định dạng hiển thị thời gian HH:MM:SS
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-lg font-medium text-gray-500">正在加载 đề thi bảo mật...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* VÙNG BÊN TRÁI: HIỂN THỊ NỘI DUNG ĐỀ THI (Cuộn độc lập) */}
            <div className="flex-1 h-screen overflow-y-auto p-6 pb-24">
                <h1 className="text-2xl font-black text-gray-800 mb-6 uppercase border-b pb-3 border-gray-200">
                    📝 {examData.title}
                </h1>

                {examData.sections.map((section) => (
                    <div key={section.id} className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-indigo-600 mb-2">
                            Phần {section.section_order}: {section.instructions}
                        </h2>
                        
                        {/* Duyệt qua từng Nhóm câu hỏi (Đoạn văn / Audio) */}
                        {section.groups?.map((group, gIdx) => (
                            <div key={group.group_id} className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                                <h3 className="text-sm font-bold text-gray-700 bg-gray-200 px-3 py-1 rounded-md inline-block">
                                    {group.title || `Nhóm câu hỏi ${gIdx + 1}`}
                                </h3>

                                {group.audio_url && (
                                    <div className="my-3">
                                        <audio src={group.audio_url} controls className="w-full max-w-md" />
                                    </div>
                                )}

                                {group.image_url && (
                                    <img src={group.image_url} alt="Question context" className="max-w-full h-auto rounded-lg border" />
                                )}

                                {/* Duyệt qua các câu hỏi con trắc nghiệm */}
                                <div className="space-y-6 mt-4">
                                    {group.questions.map((q) => (
                                        <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                                            <p className="font-semibold text-gray-800 text-sm mb-3">
                                                Câu {q.order_in_section}: {q.question_text}
                                            </p>
                                            
                                            {/* Render các lựa chọn A, B, C, D */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {Object.entries(q.options).map(([key, val]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleSelectOption(q.id, key)}
                                                        className={`text-left px-4 py-2.5 rounded-xl border text-sm transition font-medium cursor-pointer ${
                                                            answers[q.id] === key
                                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-xs'
                                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <span className="inline-block bg-gray-100 rounded-md px-2 py-0.5 mr-2 text-xs text-gray-500 font-bold border">
                                                            {key}
                                                        </span>
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* VÙNG BÊN PHẢI: ĐỒNG HỒ & DANH SÁCH CHECKBOX CÂU HỎI (Cố định) */}
            <div className="w-full md:w-80 bg-white border-l border-gray-200 p-6 flex flex-col justify-between h-screen shadow-sm">
                <div>
                    <div className="text-center bg-gray-900 text-white py-4 px-2 rounded-2xl mb-6 shadow-inner">
                        <span className="block text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Thời gian còn lại</span>
                        <span className="text-3xl font-mono font-black tracking-wider text-amber-400">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <h3 className="font-bold text-gray-700 mb-3 text-sm">Tiến độ bài làm:</h3>
                    {/* Lưới hiển thị các ô câu hỏi trực quan để biết câu nào làm rồi, câu nào chưa */}
                    <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1 border rounded-xl bg-gray-50">
                        {examData.sections.flatMap(s => s.groups.flatMap(g => g.questions)).map((q) => (
                            <div
                                key={q.id}
                                className={`h-9 flex items-center justify-center text-xs font-bold rounded-lg border transition ${
                                    answers[q.id]
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-500'
                                }`}
                            >
                                {q.order_in_section}
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleSubmitExam}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl tracking-wider transition shadow-md cursor-pointer mt-6"
                >
                    NỘP BÀI THI
                </button>
            </div>
        </div>
    );
}

export default TakeExamPage;