import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient() {
  // Reuse existing pool if available
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
      // Limit pool size to prevent connection exhaustion
      // For serverless, keep this small (each instance gets its own pool)
      max: parseInt(process.env.DATABASE_POOL_MAX ?? "10", 10),
      min: parseInt(process.env.DATABASE_POOL_MIN ?? "2", 10),
      // Connection timeout (milliseconds)
      connectionTimeoutMillis: 5000,
      // Idle timeout - close idle clients after this many milliseconds
      idleTimeoutMillis: 30000,
      // Maximum time a client can remain in the pool
      maxLifetimeSeconds: 3600,
    });

  // Store pool globally to reuse across requests
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache the Prisma client globally to reuse across requests in the same process
// This is important for serverless environments where the same function instance
// may handle multiple requests
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
