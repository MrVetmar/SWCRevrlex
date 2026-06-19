import { Request, Response } from 'express';
import { prisma } from '../index';

export const getMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { startTime: 'asc' },
    });

    const groupedStats = await prisma.prediction.groupBy({
      by: ['matchId', 'predictedWinner'],
      _count: { predictedWinner: true }
    });

    const matchesWithStats = matches.map(match => {
      const stats = groupedStats.filter(s => s.matchId === match.id);
      const total = stats.reduce((acc, curr) => acc + curr._count.predictedWinner, 0);
      const home = stats.find(s => s.predictedWinner === 'HOME')?._count.predictedWinner || 0;
      const away = stats.find(s => s.predictedWinner === 'AWAY')?._count.predictedWinner || 0;
      const draw = stats.find(s => s.predictedWinner === 'DRAW')?._count.predictedWinner || 0;

      return {
        ...match,
        predictionStats: total > 0 ? {
          total,
          homePercent: Math.round((home / total) * 100),
          awayPercent: Math.round((away / total) * 100),
          drawPercent: Math.round((draw / total) * 100),
        } : null
      };
    });

    res.json({ matches: matchesWithStats });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Internal server error while fetching matches.' });
  }
};

export const getMatchById = async (req: Request, res: Response): Promise<void> => {
  try {
    const matchId = parseInt(req.params.id as string);
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      res.status(404).json({ error: 'Match not found.' });
      return;
    }

    res.json({ match });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error while fetching match.' });
  }
};
