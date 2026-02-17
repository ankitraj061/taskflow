// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// async function main() {
//   const result = await prisma.player.updateMany({
//     data: {
//       isSold: false,
//       isUnsold: false,
//       soldPrice: null,
//       teamId: null,
//     },
//   });

//   console.log(`✅ Reset ${result.count} players to fresh state`);
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
