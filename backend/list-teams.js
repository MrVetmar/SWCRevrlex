const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: "postgresql://swc_user:swc_password@localhost:5432/swc_db?schema=public" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const matches = await prisma.match.findMany({ select: { homeTeam: true, awayTeam: true } });
  const teams = new Set();
  matches.forEach(m => {
    teams.add(m.homeTeam);
    teams.add(m.awayTeam);
  });
  console.log(Array.from(teams));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
