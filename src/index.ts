import 'reflect-metadata';
import HTTPServer from './http/server.js';
import { Configs } from './scanner/Configs.js';
import { ScannerManager } from './scanner/ScannerManager.js';
import { getEnv } from './utils/env.js';
import { logger } from './utils/logger.js';

async function main() {
  const env = getEnv();
  const configs = new Configs();
  const manager = new ScannerManager(configs);
  const server = new HTTPServer(manager, env.HOST, env.PORT);
  await server.start();
  logger.info(`Server started: http://${server.host}:${server.port}`);
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
