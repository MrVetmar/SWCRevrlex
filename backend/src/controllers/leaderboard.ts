import { Request, Response } from 'express';
import { prisma } from '../index';

export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { totalPoints: 'desc' },
      take: 10,
      select: {
        id: true,
        username: true,
        totalPoints: true,
        achievements: true,
        avatarUrl: true,
      },
    });

    res.json({ leaderboard: topUsers });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ error: 'Internal server error while fetching leaderboard.' });
  }
};
