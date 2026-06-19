import { syncMatchesFromAPI } from './src/services/apiFootball';

const run = async () => {
  console.log('Running manual sync...');
  await syncMatchesFromAPI(true);
  console.log('Manual sync complete.');
  process.exit(0);
};

run();
