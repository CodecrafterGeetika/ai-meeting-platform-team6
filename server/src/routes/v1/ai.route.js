import express from 'express';
import auth from '../../middlewares/auth.js';
import aiController from '../../controllers/ai.controller.js';

const router = express.Router();

router.post('/:meetingId/ai-summary', auth(), aiController.generateSummary);
router.post('/:meetingId/transcript', auth(), aiController.saveTranscript);
router.post('/test', auth(), aiController.testAI);

export default router;