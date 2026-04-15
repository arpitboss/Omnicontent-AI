import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (filePath: string, publicId: string, isVideo: boolean = false): Promise<string> => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            public_id: publicId,
            resource_type: isVideo ? "video" : "auto",
            overwrite: true,
        });
        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw error;
    }
};
