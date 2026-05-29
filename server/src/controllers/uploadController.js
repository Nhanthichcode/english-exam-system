const { uploadToCloudinary } = require('../utils/cloudinaryConfig');

exports.uploadMediaFile = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: "Không tìm thấy tệp tin nào được tải lên!" });
        }

        const file = req.files.file; // Frontend sẽ gửi file qua key 'file'
        const fileMime = file.mimetype;
        
        let folder = 'images';
        let resourceType = 'image';

        // Kiểm tra định dạng để phân loại thư mục lưu trữ
        if (fileMime.startsWith('audio/') || fileMime.includes('video') || fileMime.endsWith('webm') || fileMime.endsWith('mp3')) {
            folder = 'audios';
            resourceType = 'video'; // Cloudinary quản lý file âm thanh trong nhóm 'video'
        } else if (!fileMime.startsWith('image/')) {
            return res.status(400).json({ message: "Định dạng tệp tin không được hỗ trợ (Chỉ chấp nhận Hình ảnh và Âm thanh)!" });
        }

        // Tiến hành upload luồng buffer lên Cloudinary
        const secureUrl = await uploadToCloudinary(file.data, folder, resourceType);

        return res.status(200).json({
            message: "Tải tệp tin lên hệ thống đám mây thành công!",
            file_url: secureUrl,
            file_name: file.name,
            mime_type: fileMime
        });
    } catch (error) {
        console.error("Lỗi upload media lên Cloudinary:", error.message);
        return res.status(500).json({ message: "Lỗi hệ thống khi xử lý lưu trữ tệp tin!" });
    }
};