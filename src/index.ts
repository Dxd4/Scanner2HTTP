import 'reflect-metadata';
import HTTPServer from './http/server.js';
import { Configs } from './scanner/Configs.js';
import { ScannerManager } from './scanner/ScannerManager.js';
import { getEnv } from './utils/env.js';

async function main() {
  const env = getEnv();
  const configs = new Configs();
  const manager = new ScannerManager(configs);
  const server = new HTTPServer(manager, env.HOST, env.PORT);
  await server.start();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
