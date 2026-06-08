import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import _import1 from '../../validations/index.js';
const { profileValidation } = _import1;
import _import2 from '../../controllers/index.js';
const { profileController } = _import2;
import upload from '../../middlewares/upload.js';

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(profileValidation.createProfile), profileController.createProfile)
  .put(auth(), validate(profileValidation.updateProfile), profileController.updateProfile);

router.get('/me', auth(), profileController.getMyProfile);

router.post('/avatar', auth(), upload.single('avatar'), profileController.uploadAvatar);

export default router;
