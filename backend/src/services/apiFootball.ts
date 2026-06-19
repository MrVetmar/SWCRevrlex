import axios from 'axios';
import { prisma } from '../index';
import { MatchStatus } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const api = axios.create({
  baseURL: 'https://api.football-data.org/v4',
});

// Interceptor to inject the API key on every request dynamically
api.interceptors.request.use((config) => {
  const apiKey = process.env.API_FOOTBALL_KEY || 'mock-api-key';
  config.headers['X-Auth-Token'] = apiKey;
  return config;
});

const cache = {
  lastDailySync: 0,
};

// football-data.org statuses:
// SCHEDULED, TIMED, IN_PLAY, PAUSED, EXTRA_TIME, PENALTY_SHOOTOUT, FINISHED, SUSPENDED, POSTPONED, CANCELLED, AWARDED
const mapStatus = (status: string): MatchStatus => {
  if (['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(status)) return MatchStatus.IN_PLAY;
  if (['FINISHED', 'AWARDED'].includes(status)) return MatchStatus.FINISHED;
  return MatchStatus.SCHEDULED; // TIMED, SCHEDULED, SUSPENDED, POSTPONED, CANCELLED
};

export const syncMatchesFromAPI = async (force: boolean = false) => {
  const currentApiKey = process.env.API_FOOTBALL_KEY || 'mock-api-key';
  if (currentApiKey === 'mock-api-key') {
    console.log('[Football-Data] Mock API key detected. Skipping sync.');
    return;
  }

  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  try {
    const inPlayMatches = await prisma.match.findMany({
      where: { status: MatchStatus.IN_PLAY }
    });

    const soonMatches = await prisma.match.findMany({
      where: { 
        status: MatchStatus.SCHEDULED,
        startTime: { lte: new Date(now + 2 * ONE_HOUR) }
      }
    });

    let fetchLiveOnly = false;

    if (inPlayMatches.length > 0 || soonMatches.length > 0) {
      fetchLiveOnly = true;
    } else if (!force && now - cache.lastDailySync < ONE_HOUR) {
      return;
    }

    let response;
    
    // In football-data.org, we can fetch all World Cup matches
    // For live matches, we could query /matches?status=IN_PLAY but since WC matches are few,
    // querying /competitions/WC/matches is fine for both live and scheduled.
    // They have an endpoint /matches which supports ?status=IN_PLAY but it fetches ALL competitions.
    // So we'll just fetch the competition matches and filter.
    console.log('[Football-Data] Fetching World Cup matches...');
    response = await api.get('/competitions/WC/matches');
    
    if (!fetchLiveOnly) {
      cache.lastDailySync = now;
    }

    const matches = response.data.matches;
    if (!matches || !Array.isArray(matches)) {
      console.error('[Football-Data] Invalid response format:', response.data);
      return;
    }

    const processedMatches = [];

    for (const match of matches) {
      const matchId = match.id;
      const homeTeam = match.homeTeam?.name || 'TBD';
      const awayTeam = match.awayTeam?.name || 'TBD';
      const homeCrest = match.homeTeam?.crest || null;
      const awayCrest = match.awayTeam?.crest || null;
      const startTime = new Date(match.utcDate);
      const status = mapStatus(match.status);
      
      const homeScore = match.score?.fullTime?.home !== null ? match.score.fullTime.home : null;
      const awayScore = match.score?.fullTime?.away !== null ? match.score.fullTime.away : null;
      
      let minuteStr: string | null = null;
      if (match.status === 'PAUSED') {
        minuteStr = 'HT';
      } else if (['IN_PLAY', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(match.status)) {
        if (match.status === 'PENALTY_SHOOTOUT') {
          minuteStr = 'PEN';
        } else if (match.status === 'EXTRA_TIME') {
          minuteStr = match.minute ? `UZ ${match.minute}'` : 'UZ';
        } else {
          if (match.minute) {
            minuteStr = `${match.minute}'`;
          } else {
            // Calculate manually if API doesn't provide it
            const nowMs = new Date().getTime();
            const startMs = new Date(match.utcDate).getTime();
            const diffMinutes = Math.floor((nowMs - startMs) / 60000);
            
            if (diffMinutes < 0) {
              minuteStr = "0'";
            } else if (diffMinutes <= 45) {
              minuteStr = `${diffMinutes}'`;
            } else if (diffMinutes > 45 && diffMinutes < 60) {
              minuteStr = `45+'`; // Halftime roughly
            } else if (diffMinutes >= 60 && diffMinutes <= 105) {
              minuteStr = `${diffMinutes - 15}'`;
            } else {
              minuteStr = `90+'`;
            }
          }
        }
      }

      const updatedMatch = await prisma.match.upsert({
        where: { id: matchId },
        update: {
          homeScore,
          awayScore,
          status,
          startTime,
          homeTeam,
          awayTeam,
          homeCrest,
          awayCrest,
          minute: minuteStr,
        },
        create: {
          id: matchId,
          homeTeam,
          awayTeam,
          homeCrest,
          awayCrest,
          startTime,
          status,
          homeScore,
          awayScore,
          minute: minuteStr,
        },
      });
      
      processedMatches.push(updatedMatch);
    }

    console.log(`[Football-Data] Synced ${matches.length} matches.`);
    
    return processedMatches;

  } catch (error: any) {
    console.error('[Football-Data] Error fetching data:', error.response?.data || error.message);
  }
};
