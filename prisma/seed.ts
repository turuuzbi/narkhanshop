import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../src/lib/seed";

const prisma = new PrismaClient();

async function main() {
  // `--if-empty` is used by the Postgres build step so redeploys don't wipe real data.
  if (process.argv.includes("--if-empty") && (await prisma.product.count()) > 0) {
    console.log("✓ Database already has data — seed skipped");
    return;
  }
  const r = await seedDatabase(prisma);
  console.log(`✓ Seeded ${r.products} products and ${r.orders} orders`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
