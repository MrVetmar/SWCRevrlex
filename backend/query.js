const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const match = await prisma.match.findFirst({
    where: { 
      homeTeam: { contains: 'United States' }
    }
  });
  console.log(JSON.stringify(match, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
