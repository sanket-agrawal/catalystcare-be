import { PrismaClient } from "@prisma/client";
import { serverConfig } from "../../shared/config/server.config";

const prismaOption: { log: ('query' | 'info' | 'warn' | 'error')[] } = {
  log: []
}

if (serverConfig.nodeEnv !== 'production' && serverConfig.nodeEnv !== 'development') {
  prismaOption.log = ['query', 'info', 'warn', 'error']
}

const prisma = new PrismaClient(prismaOption);

export { prisma };
