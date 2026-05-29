import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminQuestions = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Quản lý trạng thái đóng/mở modal và chế độ (create hoặc edit)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' hoặc 'edit'
    const [currentQuestionId, setCurrentQuestionId] = useState(null);

    // Quản lý dữ liệu biểu mẫu (Form State) đồng bộ với bảng questions và question_groups
    const [formData, setFormData] = useState({
        question_text: '',
        question_type: 'SINGLE_CHOICE',
        options: { A: '', B: '', C: '', D: '' },
        correct_answer: '',
        explanation: '',
        order_in_group: 1,
        // Dữ liệu bổ sung cho Question Group lồng kèm
        title: '',
        cefr_level_id: 1,
        difficulty: 3,
        group_type_code: 'READING_SINGLE'
    });

    // Quản lý file media tải lên từ máy tính
    const [audioFile, setAudioFile] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    // 1. Tải danh sách toàn bộ câu hỏi cho Admin
    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const response = await axios.get('http://localhost:5000/api/questions/admin-list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuestions(response.data.questions || []);
        } catch (error) {
            console.error("Lỗi lấy danh sách câu hỏi:", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    // 2. Hàm xử lý upload Media lên server (Giống cấu hình Form trong ảnh Postman của bạn)
    const uploadMediaFile = async (file) => {
        if (!file) return null;
        const token = localStorage.getItem('accessToken');
        const mediaFormData = new FormData();
        
        // Gắn file vào trường tương ứng (Trùng khớp cấu hình multipart của backend)
        mediaFormData.append('file', file); 

        try {
            const response = await axios.post('http://localhost:5000/api/upload/media', mediaFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data.fileUrl; // Trả về đường dẫn url sau khi lưu thành công
        } catch (error) {
            console.error("Lỗi tải tệp tin media lên server:", error.message);
            return null;
        }
    };

    // 3. Hàm xử lý submit Form (Tạo mới hoặc Cập nhật đơn mục tiêu)
    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem('accessToken');
        
        let audioUrl = null;
        let imageUrl = null;
        if (audioFile) audioUrl = await uploadMediaFile(audioFile);
        if (imageFile) imageUrl = await uploadMediaFile(imageFile);

        // 🚀 ĐỒNG BỘ BIẾN: Khai báo thêm trường 'type' lấy từ 'question_type' để vừa lòng cơ chế check của Backend
        const payload = {
            ...formData,
            type: formData.question_type, // Đảm bảo Backend nhận được trường 'type'
            ...(audioUrl && { audio_url: audioUrl }),
            ...(imageUrl && { image_url: imageUrl })
        };

        if (modalMode === 'create') {
            await axios.post('http://localhost:5000/api/questions/create', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Tạo câu hỏi mới thành công!");
        } else {
            await axios.put(`http://localhost:5000/api/questions/update/${currentQuestionId}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Cập nhật thông tin câu hỏi thành công!");
        }

        closeModal();
        fetchQuestions(); 
    } catch (error) {
        // Hiển thị trực quan thông báo lỗi chi tiết từ Backend trả về
        alert(error.response?.data?.message || "Xảy ra lỗi trong quá trình thực thi!");
    }
};

    // 4. Hàm kích hoạt chế độ SỬA câu hỏi, nạp dữ liệu cũ vào biểu mẫu
    const openEditModal = async (question) => {
        setModalMode('edit');
        setCurrentQuestionId(question.id);
        
        try {
            const token = localStorage.getItem('accessToken');
            // Lấy thông tin chi tiết đầy đủ của một câu hỏi cụ thể kèm group của nó
            const response = await axios.get(`http://localhost:5000/api/questions/detail/${question.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const qDetail = response.data.question;

            setFormData({
                question_text: qDetail.question_text || '',
                question_type: qDetail.question_type || 'SINGLE_CHOICE',
                options: qDetail.options || { A: '', B: '', C: '', D: '' },
                correct_answer: qDetail.correct_answer || '',
                explanation: qDetail.explanation || '',
                order_in_group: qDetail.order_in_group || 1,
                title: qDetail.group_title || '',
                cefr_level_id: qDetail.cefr_level_id || 1,
                difficulty: qDetail.difficulty || 3,
                group_type_code: qDetail.group_type_code || 'READING_SINGLE'
            });
            setIsModalOpen(true);
        } catch (error) {
            alert("Không thể tải thông tin chi tiết câu hỏi cần sửa!");
        }
    };

    // 5. Hàm XÓA đơn mục tiêu cẩn thận
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi đơn lẻ này không? Thao tác này không thể hoàn tác.")) return;
        try {
            const token = localStorage.getItem('accessToken');
            await axios.delete(`http://localhost:5000/api/questions/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Đã xóa câu hỏi khỏi hệ thống thành công!");
            fetchQuestions(); // Làm mới dữ liệu
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi hệ thống khi xóa câu hỏi!");
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setFormData({
            question_text: '',
            question_type: 'SINGLE_CHOICE',
            options: { A: '', B: '', C: '', D: '' },
            correct_answer: '',
            explanation: '',
            order_in_group: 1,
            title: '',
            cefr_level_id: 1,
            difficulty: 3,
            group_type_code: 'READING_SINGLE'
        });
        setAudioFile(null);
        setImageFile(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentQuestionId(null);
    };

    if (loading) return <div className="text-center py-10 font-medium text-gray-500">Đang tải ngân hàng câu hỏi...</div>;

    return (
        <div className="space-y-6">
            {/* Header của Bàn làm việc */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Ngân hàng Câu hỏi Hệ thống</h2>
                    <p className="text-sm text-gray-400">Quản lý, thêm, sửa đổi thông tin chi tiết và dữ liệu đa phương tiện</p>
                </div>
                <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2">
                    <span className="text-lg font-bold">+</span> Thêm Câu Hỏi Mới
                </button>
            </div>

            {/* Bảng hiển thị danh sách câu hỏi */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-xs font-semibold border-b border-gray-200 uppercase tracking-wider">
                            <th className="p-4 w-16 text-center">ID</th>
                            <th className="p-4">Nội dung câu hỏi</th>
                            <th className="p-4 w-40">Phân loại đề</th>
                            <th className="p-4 w-32 text-center">Thứ tự</th>
                            <th className="p-4 w-44 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                        {questions.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center p-8 text-gray-400 font-medium">Chưa có câu hỏi nào trong ngân hàng dữ liệu. Hãy bấm thêm mới!</td>
                            </tr>
                        ) : (
                            questions.map((q) => (
                                <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 text-center font-semibold text-gray-400">{q.id}</td>
                                    <td className="p-4 font-medium text-gray-900 max-w-xs truncate">{q.question_text || "--- Câu hỏi dạng đa phương tiện / Không có text ---"}</td>
                                    <td className="p-4">
                                        <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                                            {q.question_type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center text-gray-500">Mục số {q.order_in_group}</td>
                                    <td className="p-4 text-center flex justify-center gap-2">
                                        <button onClick={() => openEditModal(q)} className="text-xs font-semibold border border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-50 px-3 py-1.5 rounded-md transition-all">
                                            Sửa bản ghi
                                        </button>
                                        <button onClick={() => handleDelete(q.id)} className="text-xs font-semibold border border-red-200 text-red-600 bg-red-50/30 hover:bg-red-50 px-3 py-1.5 rounded-md transition-all">
                                            Xóa bỏ
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL THÊM / SỬA ĐƠN MỤC TIÊU */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {modalMode === 'create' ? 'Thêm câu hỏi mới vào ngân hàng' : `Chỉnh sửa câu hỏi ID: #${currentQuestionId}`}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 font-bold text-xl outline-none">×</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Khối thông tin nhóm câu hỏi */}
                            <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tiêu đề nhóm bài đọc/nghe (Không bắt buộc)</label>
                                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Ví dụ: Đọc đoạn văn sau và trả lời..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Mã loại nhóm câu hỏi</label>
                                    <select value={formData.group_type_code} onChange={e => setFormData({...formData, group_type_code: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20">
                                        <option value="READING_SINGLE">Đọc hiểu đơn lẻ (Reading Single)</option>
                                        <option value="LISTENING_PART1">Nghe hiểu tranh ảnh (Part 1)</option>
                                        <option value="WRITING_ESSAY">Viết luận ngắn (Essay)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Khung năng lực CEFR</label>
                                    <select value={formData.cefr_level_id} onChange={e => setFormData({...formData, cefr_level_id: parseInt(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20">
                                        <option value={1}>A1 (Sơ cấp)</option>
                                        <option value={2}>A2 (Sơ trung cấp)</option>
                                        <option value={3}>B1 (Trung cấp)</option>
                                        <option value={4}>B2 (Trên trung cấp)</option>
                                        <option value={5}>C1 (Cao cấp)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Khối nội dung chính của câu hỏi */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Nội dung câu hỏi *</label>
                                <textarea required rows="2" value={formData.question_text} onChange={e => setFormData({...formData, question_text: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Nhập nội dung câu hỏi trắc nghiệm hoặc đề bài cần hỏi..."></textarea>
                            </div>

                            {/* Xử lý File Media đính kèm (Đồng bộ cấu hình Form Postman của bạn) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200/60">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tệp hình ảnh đính kèm (Image)</label>
                                    <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tệp âm thanh đính kèm (Audio)</label>
                                    <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files[0])} className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                </div>
                            </div>

                            {/* Các đáp án lựa chọn trắc nghiệm */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                    <div key={opt}>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Đáp án {opt} *</label>
                                        <input type="text" required value={formData.options[opt] || ''} onChange={e => setFormData({
                                            ...formData,
                                            options: { ...formData.options, [opt]: e.target.value }
                                        })} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder={`Nhập lựa chọn ${opt}`} />
                                    </div>
                                ))}
                            </div>

                            {/* Đáp án đúng & Giải thích lý do chọn */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Đáp án đúng *</label>
                                    <select required value={formData.correct_answer} onChange={e => setFormData({...formData, correct_answer: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                                        <option value="">-- Chọn đáp án đúng --</option>
                                        <option value="A">Đáp án A</option>
                                        <option value="B">Đáp án B</option>
                                        <option value="C">Đáp án C</option>
                                        <option value="D">Đáp án D</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Giải thích chi tiết đáp án</label>
                                    <input type="text" value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Giải thích ngữ pháp hoặc từ vựng lựa chọn..." />
                                </div>
                            </div>

                            {/* Khối nút hành động lưu trữ cuối Modal */}
                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button type="button" onClick={closeModal} className="border border-gray-200 text-gray-600 font-medium text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-all">
                                    Hủy thao tác
                                </button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-2 rounded-lg shadow-sm transition-all">
                                    {modalMode === 'create' ? 'Xác nhận Thêm' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminQuestions;