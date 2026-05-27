import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:5000/api', // Đường dẫn chạy Server Backend Express của bạn
    withCredentials: true, // RẤT QUAN TRỌNG: Cho phép tự động gửi và nhận HttpOnly Cookie (Refresh Token)
    headers: {
        'Content-Type': 'application/json',
    }
});

// Tự động đính kèm Access Token vào Header (Authorization) của mọi request nếu có lưu trong máy
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Nếu Server trả về 403 (hoặc 401) và request này chưa từng được thử lại
        if ((error.response?.status === 403 || error.response?.status === 401) && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Gọi API âm thầm gia hạn Token
                const res = await axios.post('http://localhost:5000/api/auth/refresh', {}, { withCredentials: true });
                const newAccessToken = res.data.accessToken;
                if (newAccessToken) {
                    // Lưu token mới vào máy
                    localStorage.setItem('accessToken', newAccessToken);

                    // Gắn token mới vào request cũ và chạy lại
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return axiosClient(originalRequest);
                }
            } catch (refreshError) {
                // Nếu cả cookie refresh token cũng hết hạn -> Bắt đăng nhập lại
                console.error("Phiên đăng nhập đã hết hạn hoàn toàn.");
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);
export default axiosClient;