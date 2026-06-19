import { Router } from 'express';
import { submitPrediction, getUserPredictions, getMatchPredictions } from '../controllers/predictions';
import { authenticate } from '../middleware/auth';

const router = Router();

// Require authentication
router.use(authenticate);

router.post('/', submitPrediction);
router.get('/', getUserPredictions);
router.get('/match/:matchId', getMatchPredictions);

export default router;
