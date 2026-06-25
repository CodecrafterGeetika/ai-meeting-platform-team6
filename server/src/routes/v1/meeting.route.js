import express from 'express';
import multer from 'multer';
import fs from 'fs';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import meetingValidation from '../../validations/meeting.validation.js';
import meetingController from '../../controllers/meeting.controller.js';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync('uploads/')) {
      fs.mkdirSync('uploads/', { recursive: true });
    }
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
  }
});

const uploadAudio = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(meetingValidation.createMeeting), meetingController.createMeeting)
  .get(auth(), meetingController.getMeetings);

router
  .route('/:meetingId')
  .get(auth(), validate(meetingValidation.meetingId), meetingController.getMeeting)
  .patch(auth(), validate(meetingValidation.updateMeeting), meetingController.updateMeeting)
  .delete(auth(), validate(meetingValidation.meetingId), meetingController.deleteMeeting);

router.post('/join', auth(), validate(meetingValidation.joinMeeting), meetingController.joinMeeting);
router.post('/:meetingId/start', auth(), validate(meetingValidation.meetingId), meetingController.startMeeting);
router.post('/:meetingId/end', auth(), validate(meetingValidation.meetingId), meetingController.endMeeting);
router.post('/:meetingId/transcribe', auth(), uploadAudio.single('audio'), meetingController.transcribeMeeting);

export default router;
