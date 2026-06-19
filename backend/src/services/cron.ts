import { prisma } from '../index';
import { MatchStatus, PredictionStatus, Winner } from '@prisma/client';
import { io } from '../index';
import { syncMatchesFromAPI } from './apiFootball';

export const evaluatePredictions = async () => {
  try {
    // Fetch live matches or daily schedule
    const updatedMatches = await syncMatchesFromAPI();
    
    if (updatedMatches && updatedMatches.length > 0) {
      // Broadcast live updates to clients
      io.emit('match_update', updatedMatches);
    }

    const finishedMatches = await prisma.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
      },
    });

    for (const match of finishedMatches) {
      if (match.homeScore === null || match.awayScore === null) continue;

      const actualHomeScore = match.homeScore;
      const actualAwayScore = match.awayScore;
      const actualGoalDiff = actualHomeScore - actualAwayScore;
      let actualWinner: Winner;

      if (actualHomeScore > actualAwayScore) actualWinner = 'HOME';
      else if (actualAwayScore > actualHomeScore) actualWinner = 'AWAY';
      else actualWinner = 'DRAW';

      const pendingPredictions = await prisma.prediction.findMany({
        where: {
          matchId: match.id,
          status: PredictionStatus.PENDING,
        },
      });

      for (const prediction of pendingPredictions) {
        let points = 0;
        
        // Correct Winner: 3 points
        if (prediction.predictedWinner === actualWinner) {
          points += 3;
          
          // If winner is correct, check difference (an extra 2 points)
          if (prediction.predictedDifference === Math.abs(actualGoalDiff)) {
            points += 2;
          }
        }

        await prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            pointsAwarded: points,
            status: PredictionStatus.EVALUATED,
          },
        });

        // Calculate total points securely via aggregate
        const agg = await prisma.prediction.aggregate({
          _sum: { pointsAwarded: true },
          where: { userId: prediction.userId }
        });
        const totalPointsSum = agg._sum.pointsAwarded || 0;

        // Give achievement if perfect score
        let achievementUpdate: any = undefined;
        if (points === 5) {
          const user = await prisma.user.findUnique({ where: { id: prediction.userId } });
          let currentAchievements: string[] = [];
          if (user?.achievements) {
            try {
              currentAchievements = Array.isArray(user.achievements) ? user.achievements as string[] : [];
            } catch (e) {}
          }
          if (!currentAchievements.includes('EXACT_GUESS')) {
            currentAchievements.push('EXACT_GUESS');
            achievementUpdate = currentAchievements;
          }
        }

        const dataToUpdate: any = { totalPoints: totalPointsSum };
        if (achievementUpdate) {
          dataToUpdate.achievements = achievementUpdate;
        }

        // Update user
        await prisma.user.update({
          where: { id: prediction.userId },
          data: dataToUpdate,
        });

        // Emit real-time update
        io.emit('prediction_evaluated', {
          userId: prediction.userId,
          matchId: match.id,
          pointsEarned: points,
        });
      }
    }

    // After evaluation, broadcast the new leaderboard
    const topUsers = await prisma.user.findMany({
      orderBy: { totalPoints: 'desc' },
      take: 100,
      select: { id: true, username: true, totalPoints: true, achievements: true, avatarUrl: true },
    });
    io.emit('leaderboard_update', topUsers);

  } catch (error) {
    console.error('Error running cron job:', error);
  }
};
