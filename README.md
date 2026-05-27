# BÁO CÁO TIẾN ĐỘ VÀ KẾ HOẠCH HÀNH ĐỘNG TIẾP THEO

Tài liệu ghi nhận các tính năng đã được nghiệm thu thông qua Postman/Frontend và lộ trình phát triển các phân hệ tiếp theo của dự án **Hệ thống Thi trực tuyến Ngoại ngữ**.

---

# 1. Cập Nhật Tiến Độ Vừa Thực Hiện (Nghiệm Thu API)

Hệ thống Core API ở Backend đã hoàn thành **95% khung năng lực cốt lõi**, giải quyết triệt để các bài toán đồng bộ dữ liệu và bảo mật hệ thống.

---

## Đồng Bộ Hóa Xác Thực Và Profile

- Đã sửa dứt điểm lỗi cấu trúc mã hóa `jwt malformed` và lỗi ghi nhận dữ liệu trống `accessToken undefined` ở Frontend.
- Nâng cấp mã nguồn tại hai hàm `refreshToken` và `register` để luôn đính kèm trường `full_name` vào Payload của JWT.
- **Nghiệm thu:** API `GET /api/auth/profile` hiện đã xuất ra đầy đủ và chính xác dữ liệu họ tên của thành viên đang đăng nhập.

---

## Quản Lý Ngân Hàng Câu Hỏi Nâng Cao

- Hoàn thiện bộ API CRUD câu hỏi con:
  - Thêm đơn lẻ: `create-single`
  - Cập nhật: `PUT /:id`
  - Xóa đơn lẻ: `DELETE /:id`
- Nghiệm thu thành công API tạo trọn gói:
  - Nhóm câu hỏi (Đoạn văn/Audio)
  - Mảng các câu hỏi con (`create-group`)
- Đã sửa lỗi ràng buộc khóa ngoại danh mục `group_type_code`.

---

## Thuật Toán Xóa Hàng Loạt Thông Minh (Bulk Delete)

- Nâng cấp câu lệnh SQL tích hợp bộ lọc điều kiện:

WHERE id = ANY($1)
AND id NOT IN (
    SELECT DISTINCT question_id
    FROM exam_questions
)

### Nghiệm Thu

- Hệ thống tự động bóc tách và xóa sạch các câu hỏi tự do (rác).
- Tự động bỏ qua và giữ an toàn các câu hỏi đang được sử dụng trong đề thi.
- Server vận hành ổn định, không còn bị sập do lỗi Foreign Key Constraint.

---

## API Lịch Sử Và Tra Cứu Lời Giải (History)

### Đã Hoàn Thiện

- API danh sách lịch sử: `GET /my-history`
  - Thống kê lượt thi, thời gian và điểm số của học viên đang đăng nhập.
- API chi tiết lượt thi: `GET /attempt/:attempt_id`
  - Trả về: Đáp án học viên chọn, Đáp án đúng, Trường explanation (lời giải thích).

### Bảo Mật

- Tích hợp cơ chế phân quyền.
- Ngăn chặn học viên:
  - Xem bài làm của người khác.
  - Truy cập trái phép điểm số không thuộc sở hữu.

---

# 2. Kế Hoạch Hành Động Tiếp Theo (Next Actions Plan)

Lộ trình tiếp theo tập trung vào:
- Kích hoạt hệ thống lưu trữ tệp tin.
- Hoàn thiện giao diện trực quan cho: Học viên, Admin/Giáo viên.

---

## Giai Đoạn 1: Tích Hợp Hệ Thống Upload Tệp Tin (Backend)

### Nhiệm Vụ
Thay thế cơ chế nhập link tĩnh bằng hệ thống upload file trực tiếp. Giáo viên có thể tải lên:
- File âm thanh .mp3
- Hình ảnh .png, .jpg

Dữ liệu sẽ được:
- Lưu tại thư mục /uploads
- Hoặc đẩy lên Cloud Storage: Cloudinary, Firebase Storage

### Kết Quả Kỳ Vọng
Khi tạo nhóm câu hỏi:
- Có thể upload trực tiếp bài nghe.
- Upload hình minh họa từ máy tính.

### Thời Gian Dự Kiến
20 phút

---

## Giai Đoạn 2: Giao Diện Lịch Sử Và Xem Lời Giải (Frontend Học Viên)

### Nhiệm Vụ
Thiết kế hai màn hình mới:
- HistoryPage.jsx
- ReviewExamPage.jsx

### Kết Quả Kỳ Vọng
Học viên có thể:
- Xem danh sách các đề đã thi.
- Click để xem lại toàn bộ bài làm.

Hệ thống sẽ:
- Tô màu xanh cho câu đúng.
- Tô màu đỏ cho câu sai.
- Hiển thị lời giải (Explanation) ngay bên dưới câu hỏi.

### Thời Gian Dự Kiến
30 phút

---

## Giai Đoạn 3: Xây Dựng Khu Vực Quản Trị (Admin And Teacher Dashboard)

### Nhiệm Vụ
Khởi tạo Route bảo mật riêng: `/admin/* `
- Tách biệt hoàn toàn với giao diện học viên.

### Các Chức Năng Chính

#### Quản Lý Thành Viên
- Danh sách người dùng.
- Khóa / Mở khóa tài khoản (is_active).
- Form tạo nhanh tài khoản.

#### Quản Lý Câu Hỏi
- Form thêm câu hỏi trực quan.
- Bảng danh sách câu hỏi.
- Checkbox chọn nhiều.
- Kích hoạt API Bulk Delete thông minh.
