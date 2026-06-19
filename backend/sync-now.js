const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
require('dotenv').config();

const prisma = new PrismaClient();

const mapStatus = (status) => {
  if (['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(status)) return 'IN_PLAY';
  if (['FINISHED', 'AWARDED'].includes(status)) return 'FINISHED';
  return 'SCHEDULED'; 
};

const syncMatchesFromAPI = async () => {
  const api = axios.create({ baseURL: 'https://api.football-data.org/v4' });
  api.interceptors.request.use((config) => {
    config.headers['X-Auth-Token'] = process.env.API_FOOTBALL_KEY;
    return config;
  });

  try {
    const response = await api.get('/competitions/WC/matches');
    const matches = response.data.matches;
    
    let updatedCount = 0;
    for (const match of matches) {
      const matchId = match.id;
      const startTime = new Date(match.utcDate);
      let status = mapStatus(match.status);
      
      const homeScore = match.score?.fullTime?.home !== null ? match.score.fullTime.home : null;
      const awayScore = match.score?.fullTime?.away !== null ? match.score.fullTime.away : null;

      const nowMs = new Date().getTime();
      const startMs = new Date(match.utcDate).getTime();
      const diffMinutes = Math.floor((nowMs - startMs) / 60000);
      
      if (status === 'IN_PLAY' && diffMinutes > 140 && homeScore !== null && awayScore !== null) {
        status = 'FINISHED';
      }

      await prisma.match.updateMany({
        where: { id: matchId },
        data: { status }
      });
      updatedCount++;
    }
    console.log(`Synced ${updatedCount} matches.`);
  } catch (err) {
    console.error(err);
  }
};

syncMatchesFromAPI().then(() => prisma.$disconnect());
