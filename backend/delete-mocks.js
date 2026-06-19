const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: "postgresql://swc_user:swc_password@localhost:5432/swc_db?schema=public" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.prediction.deleteMany({
    where: {
      matchId: { lte: 1000 }
    }
  });

  await prisma.match.deleteMany({
    where: {
      id: { lte: 1000 }
    }
  });

  console.log('Mock matches deleted successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
