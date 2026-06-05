import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

logger.info('✅ Cloudinary configured');

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer from Multer memory storage
 * @param {object} options - userId, documentType, etc.
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `sarkari-sahayak/documents/${options.userId || 'unknown'}`,
        resource_type: 'auto',
        allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ quality: 'auto' }],
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Generate a signed URL for secure document access (1-hour expiry).
 * @param {string} publicId - Cloudinary public_id
 * @returns {string} Signed URL
 */
export const getSignedUrl = (publicId) => {
  return cloudinary.url(publicId, {
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    type: 'authenticated',
    secure: true,
  });
};

/**
 * Delete a file from Cloudinary.
 * @param {string} publicId - Cloudinary public_id
 */
export const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
};

export default cloudinary;
