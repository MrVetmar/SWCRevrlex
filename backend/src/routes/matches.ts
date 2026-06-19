import { Router } from 'express';
import { getMatches, getMatchById } from '../controllers/matches';
import { authenticate } from '../middleware/auth';

const router = Router();

// Require authentication for match routes
router.use(authenticate);

router.get('/', getMatches);
router.get('/:id', getMatchById);

export default router;
