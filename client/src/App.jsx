import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TakeExamPage from './pages/TakeExamPage';
import ResultPage from './pages/ResultPage';    
import HistoryPage from './pages/HistoryPage';
import ReviewExamPage from './pages/ReviewExamPage';

import AdminLayout from './components/AdminLayout';
import AdminUsers from './pages/admin/AdminUsers';
import AdminQuestions from './pages/admin/AdminQuestions';

function App() {
  return (
    <Routes>
      {/* Đường dẫn gốc mặc định tự điều hướng sang trang Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Đường dẫn các trang cụ thể */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      
      {/* Cấu hình 2 route phòng thi & kết quả mới */}
      <Route path="/exams/:id/take" element={<TakeExamPage />} />
      <Route path="/exams/result" element={<ResultPage />} />

      {/* 3. Trang 404 nếu gõ sai URL */}
      <Route path="*" element={<div className="h-screen flex items-center justify-center text-xl font-bold text-gray-500">404 - Không tìm thấy trang yêu cầu!</div>} />
    
      {/* Các route mới cho lịch sử và xem lại bài thi */}
      <Route path="/history" element={<HistoryPage />} />

      <Route path="/history/attempt/:attemptId" element={<ReviewExamPage />} />
      {/* 🚀 KHU VỰC QUẢN TRỊ NÂNG CAO (MỚI BỔ SUNG) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="users" element={<AdminUsers />} />
          <Route path="questions" element={<AdminQuestions />} />
        </Route>
    </Routes>
  );
}

export default App;