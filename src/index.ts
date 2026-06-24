import 'reflect-metadata';
import HTTPServer from './http/server.js';
import { Configs } from './scanner/Configs.js';
import { ScannerManager } from './scanner/ScannerManager.js';

async function main() {
  const configs = new Configs();
  const manager = new ScannerManager(configs);
  const server = new HTTPServer(manager);
  await server.start();
}

void main();
