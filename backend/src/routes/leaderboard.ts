import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboard';

const router = Router();

router.get('/', getLeaderboard);

export default router;
