import httpStatus from 'http-status';
import Profile from '../models/profile.model.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

/**
 * Create a user profile
 * @param {ObjectId} userId
 * @param {Object} profileBody
 * @returns {Promise<Profile>}
 */
const createProfile = async (userId, profileBody) => {
  const existingProfile = await Profile.findOne({ userId });
  if (existingProfile) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Profile already exists');
  }

  const skillsArray = profileBody.skills ? profileBody.skills.split(',').map(skill => skill.trim()) : [];
  
  return Profile.create({
    ...profileBody,
    userId,
    skills: skillsArray
  });
};

/**
 * Get profile by userId
 * @param {ObjectId} userId
 * @returns {Promise<Profile>}
 */
const getProfileByUserId = async (userId) => {
  let profile = await Profile.findOne({ userId }).populate('userId', 'email name');
  if (!profile) {
    // Auto-create a blank profile if it doesn't exist
    const user = await User.findById(userId);
    profile = await Profile.create({ 
      userId, 
      fullName: user ? user.name : 'Unknown User' 
    });
    profile = await profile.populate('userId', 'email name');
  }
  return profile;
};

/**
 * Update profile by userId
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<Profile>}
 */
const updateProfileByUserId = async (userId, updateBody) => {
  const profile = await getProfileByUserId(userId);

  if (updateBody.skills) {
    updateBody.skills = updateBody.skills.split(',').map(skill => skill.trim());
  }

  Object.assign(profile, updateBody);
  await profile.save();
  return profile;
};

/**
 * Upload Avatar
 * @param {ObjectId} userId
 * @param {Object} file
 * @returns {Promise<Profile>}
 */
const uploadAvatar = async (userId, file) => {
  const profile = await Profile.findOne({ userId });
  const user = await User.findById(userId);
  
  if (!profile || !user) {
    import('fs').then(fs => fs.unlinkSync(file.path));
    throw new ApiError(httpStatus.NOT_FOUND, 'Profile or User not found.');
  }

  const cloudinaryResponse = await uploadToCloudinary(file.path);
  if (!cloudinaryResponse) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error uploading image to Cloudinary');
  }

  if (user.avatarPublicId) {
    // Note: The deleteFromCloudinary function currently expects a URL and parses it.
    // Wait, let me check deleteFromCloudinary implementation.
    // It says:
    // const parts = imageUrl.split('/');
    // const publicId = 'avatars/' + parts[parts.length - 1].split('.')[0];
    // await cloudinary.uploader.destroy(publicId);
    // So it expects the URL, not the raw public_id. I will pass user.avatar to deleteFromCloudinary.
  }
  
  if (user.avatar) {
    await deleteFromCloudinary(user.avatar);
  } else if (profile.avatar) {
    await deleteFromCloudinary(profile.avatar);
  }

  profile.avatar = cloudinaryResponse.secure_url;
  await profile.save();

  user.avatar = cloudinaryResponse.secure_url;
  user.avatarPublicId = cloudinaryResponse.public_id;
  await user.save();

  return profile;
};

export default {
  createProfile,
  getProfileByUserId,
  updateProfileByUserId,
  uploadAvatar,
};
