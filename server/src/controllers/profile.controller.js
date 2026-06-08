import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import _import1 from '../services/index.js';
const { profileService } = _import1;

const createProfile = catchAsync(async (req, res) => {
  const profile = await profileService.createProfile(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(profile);
});

const getMyProfile = catchAsync(async (req, res) => {
  const profile = await profileService.getProfileByUserId(req.user.id);
  res.send(profile);
});

const updateProfile = catchAsync(async (req, res) => {
  const profile = await profileService.updateProfileByUserId(req.user.id, req.body);
  res.send(profile);
});

const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Please upload an image file' });
  }
  const profile = await profileService.uploadAvatar(req.user.id, req.file);
  res.send({ message: 'Avatar uploaded successfully', profile });
});

export default {
  createProfile,
  getMyProfile,
  updateProfile,
  uploadAvatar,
};
