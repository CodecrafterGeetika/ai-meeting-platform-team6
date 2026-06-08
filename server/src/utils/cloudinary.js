import { v2 as cloudinary } from 'cloudinary';
import config from '../config/config.js';
import fs from 'fs';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    
    // Upload the file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'image',
      folder: 'avatars',
    });
    
    // File uploaded successfully, remove from local storage
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    // Remove the locally saved temporary file if upload fails
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

export const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl) return;
    
    // Extract public ID from the Cloudinary URL
    const parts = imageUrl.split('/');
    const publicId = 'avatars/' + parts[parts.length - 1].split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
  }
};

export default cloudinary;
