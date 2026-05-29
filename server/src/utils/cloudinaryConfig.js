const cloudinary = require('cloudinary').v2;

// Cấu hình lấy tài nguyên từ file .env của bạn
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Hàm upload file từ Buffer lên Cloudinary
 * @param {Buffer} fileBuffer - Dữ liệu file dạng buffer (từ express-fileupload)
 * @param {String} folder - Thư mục lưu trữ trên Cloudinary (vd: 'audio', 'images')
 * @param {String} resourceType - Kiểu tài nguyên: 'image' hoặc 'video' (dành cho audio)
 */
const uploadToCloudinary = (fileBuffer, folder, resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `english_exam_system/${folder}`,
                resource_type: resourceType
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url); // Trả về đường dẫn https an toàn
            }
        );
        // Ghi dữ liệu từ buffer vào luồng upload
        uploadStream.end(fileBuffer);
    });
};

module.exports = { cloudinary, uploadToCloudinary };