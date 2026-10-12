import { PrismaClient } from "@prisma/client";
import { datasourceUrl } from "./db-config";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const url = datasourceUrl();
export const prisma = globalForPrisma.prisma ?? new PrismaClient(url ? { datasourceUrl: url } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
