import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const run = async () => {
  const matches = await prisma.match.findMany({
    where: { status: 'IN_PLAY' }
  });
  console.log(JSON.stringify(matches, null, 2));
  process.exit(0);
};
run();
