import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { MatchStatus } from '@prisma/client';

export const submitPrediction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { matchId, predictedDifference, predictedWinner } = req.body;

    if (!userId || !matchId || predictedDifference === undefined || !predictedWinner) {
      res.status(400).json({ error: 'Missing required prediction fields.' });
      return;
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });

    if (!match) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }

    // 15-minute lock rule
    const now = new Date();
    const lockTime = new Date(match.startTime.getTime() - 15 * 60 * 1000);

    if (now >= lockTime || match.status !== MatchStatus.SCHEDULED) {
      res.status(403).json({ error: 'Predictions for this match are locked.' });
      return;
    }

    // Upsert to handle 1 prediction per match rule (can only update if it hasn't locked)
    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
      update: {
        predictedDifference: Math.abs(parseInt(predictedDifference)),
        predictedWinner,
      },
      create: {
        userId,
        matchId,
        predictedDifference: Math.abs(parseInt(predictedDifference)),
        predictedWinner,
      },
    });

    res.json({ message: 'Prediction saved successfully.', prediction });
  } catch (error) {
    console.error('Prediction submission error:', error);
    res.status(500).json({ error: 'Internal server error during prediction submission.' });
  }
};

export const getUserPredictions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const predictions = await prisma.prediction.findMany({
      where: { userId },
      include: { match: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ predictions });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error while fetching predictions.' });
  }
};

export const getMatchPredictions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;
    const matchIdNum = Number(matchId);
    
    const match = await prisma.match.findUnique({
      where: { id: matchIdNum }
    });

    if (!match) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }

    // Lock rule: Only show other's predictions if match is locked (within 15 mins of start or already started)
    const now = new Date();
    const lockTime = new Date(match.startTime.getTime() - 15 * 60 * 1000);
    
    if (now < lockTime && match.status === 'SCHEDULED') {
      res.status(403).json({ error: 'Tahminler maç saatine 15 dakika kalana kadar gizlidir.' });
      return;
    }

    const predictions = await prisma.prediction.findMany({
      where: { matchId: matchIdNum },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json({ predictions });
  } catch (error) {
    console.error('Fetch match predictions error:', error);
    res.status(500).json({ error: 'Internal server error while fetching match predictions.' });
  }
};
