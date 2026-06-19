import { Request, Response } from 'express';
import { prisma } from '../index';

export const getMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { startTime: 'asc' },
    });
    res.json({ matches });
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
