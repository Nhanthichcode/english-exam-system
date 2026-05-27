# Hệ thống Ngân hàng Câu hỏi & Thi Trực Tuyến Ngoại Ngữ

Dự án xây dựng website thi thử tiếng Anh (TOEIC/IELTS/VSTEP) sử dụng kiến trúc **Decoupled (SPA)** với Frontend bằng **React** và Backend bằng **Node.js + Express + PostgreSQL**.

---

## 🗺️ Sơ đồ Kiến trúc Hệ thống
[ Frontend: React ] <--- (Giao tiếp qua REST API / JSON) ---> [ Backend: Express ] <---> [ Database: PostgreSQL (Neon.tech) ]
---

## 🚦 Tiến độ Dự án (Project Progress)

### 🟩 PHẦN 1: THIẾT LẬP NỀN MÓNG (Hoàn thành 100%)
- [x] **Bước 1:** Khởi tạo cấu trúc Monorepo (`client/` và `server/`).
- [x] **Bước 1.2:** Cấu hình Backend cơ bản với Express, Nodemon và các thư viện core (`cors`, `dotenv`, `cookie-parser`).
- [x] **Bước 2.1:** Chuẩn hóa sơ đồ Cơ sở dữ liệu, sửa lỗi ràng buộc khóa ngoại (Foreign Key)[cite: 14].
- [x] **Bước 2.2:** Khởi tạo Cơ sở dữ liệu PostgreSQL trên nền tảng Cloud **Neon.tech** (Đã tắt tính năng Auth mặc định để tự code).
- [x] **Bước 2.3:** Nạp dữ liệu mẫu ban đầu (`roles`, `skills`, `cefr_levels`) vào database[cite: 11, 13, 17].
- [x] **Bước 2.4:** Kết nối thành công ứng dụng Node.js tới PostgreSQL thông qua thư viện `pg` (Pool) hỗ trợ cấu hình SSL.

### 🟨 PHẦN 2: XÂY DỰNG AUTHENTICATION API (Đang thực hiện ⏳)
- [x] **Bước 3.1:** Viết Router và Controller cho chức năng **Đăng ký tài khoản** (`POST /api/auth/register`)[cite: 10].
  - Mã hóa mật khẩu bằng `bcryptjs`[cite: 12].
  - Mặc định gán `role_id = 3` (Student)[cite: 12].
- [x] **Bước 3.2:** Viết API **Đăng nhập** (`POST /api/auth/login`)[cite: 10].
  - Xác thực mật khẩu[cite: 12].
  - Tạo bộ đôi **Access Token** (lưu ở bộ nhớ tạm Frontend) và **Refresh Token** (lưu an toàn trong `HttpOnly Cookie`)[cite: 15].
- [x] **Bước 3.3:** Viết API **Refresh Token** (`POST /api/auth/refresh`) để tự động duy trì phiên đăng nhập khi Access Token hết hạn[cite: 10, 15].
- [x] **Bước 3.4:** Viết API **Đăng xuất** (`POST /api/auth/logout`) xóa cookie và hủy token trong DB[cite: 10, 15].
- [x] **Bước 3.5:** Viết Middleware xác thực người dùng (`authMiddleware`) và phân quyền (`checkRole`)[cite: 12].

### ⬜ PHẦN 3: CÁC API QUẢN LÝ ĐỀ THI & CÂU HỎI (Chưa thực hiện)
- [x] Thiết kế API Quản lý câu hỏi (Thêm, Sửa, Xóa, Nhóm câu hỏi kèm Audio/Hình ảnh)[cite: 4, 20, 22].
- [x] Thiết kế API Quản lý đề thi và cấu trúc Part Template[cite: 5, 19, 23, 24].

### ⬜ PHẦN 4: API LÀM BÀI THI & CHẤM ĐIỂM (Chưa thực hiện)
- [ ] API lấy đề thi (Bảo mật: Tự động ẩn đáp án đúng trước khi gửi về client)[cite: 7, 22, 25].
- [ ] API Auto-save tiến trình làm bài dạng JSONB[cite: 7, 26].
- [ ] API Nộp bài và logic chấm điểm tự động từ Server[cite: 7, 26, 27].

### ⬜ PHẦN 5: XÂY DỰNG GIAO DIỆN FRONTEND REACT (Chưa thực hiện)
- [ ] Khởi tạo React project với Tailwind CSS.
- [ ] Làm giao diện Đăng ký / Đăng nhập (Quản lý State token)[cite: 10].
- [ ] Làm giao diện Dashboard cho học viên và phòng thi trực tuyến (Đồng hồ đếm ngược, danh sách câu hỏi)[cite: 7].

---

## 🛠️ Thông tin Kỹ thuật Hiện tại (Current Tech Stack)

### Backend (`/server`)
- **Runtime:** Node.js v20+
- **Framework:** Express.js
- **Database Driver:** `pg` (PostgreSQL Client)
- **Công cụ phát triển:** `nodemon` (Auto-reload)

### Database (PostgreSQL - Neon.tech)
- **Trạng thái:** Đã chạy xong Script tạo bảng (16 bảng hoàn chỉnh từ thiết kế)[cite: 11, 27].
- **SSL:** Enabled.

---

## 🏃‍♂️ Hướng dẫn chạy Backend ở hiện tại

1. Di chuyển vào thư mục server:
   ```bash
   cd server
    ```
2. Khởi chạy Server ở chế độ Phát triển (Development):
    ```bash
    npm run dev
    ```
3. Server sẽ chạy tại: http://localhost:5000 và tự động kết nối tới Cloud Database.   