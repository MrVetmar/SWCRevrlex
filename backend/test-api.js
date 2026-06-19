const axios = require('axios');
require('dotenv').config();

const run = async () => {
  const api = axios.create({ baseURL: 'https://api.football-data.org/v4' });
  api.interceptors.request.use((config) => {
    config.headers['X-Auth-Token'] = process.env.API_FOOTBALL_KEY;
    return config;
  });

  try {
    const response = await api.get('/competitions/WC/matches');
    const liveMatches = response.data.matches.filter(m => ['IN_PLAY', 'PAUSED'].includes(m.status));
    if (liveMatches.length > 0) {
      console.log("Found live matches:", JSON.stringify(liveMatches[0], null, 2));
    } else {
      console.log("No live matches right now. showing a sample match:");
      console.log(JSON.stringify(response.data.matches[0], null, 2));
    }
  } catch (err) {
    console.error(err.message);
  }
};
run();
