import fs from 'node:fs';
import path from 'path';
import pino from 'pino';
import pretty from 'pino-pretty';
import { createStream } from 'rotating-file-stream';

const isDevelopment =
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
try {
  fs.mkdirSync(logDir, { recursive: true });
} catch {
  // ignore
}

const fileStream = createStream('app.log', {
  size: process.env.LOG_FILE_SIZE || '1M',
  maxFiles: Number(process.env.LOG_FILE_COUNT) || 5,
  compress: 'gzip',
  path: logDir,
});

const prettyFileStream = pretty({
  colorize: false,
  translateTime: 'yyyy-mm-dd HH:MM:ss Z',
  ignore: 'pid,hostname',
  destination: fileStream,
});

let logger: pino.Logger;

if (isDevelopment) {
  const prettyStream = pretty({
    colorize: true,
    translateTime: 'yyyy-mm-dd HH:MM:ss Z',
    ignore: 'pid,hostname',
  });
  logger = pino(
    { level: process.env.LOG_LEVEL || 'debug' },
    pino.multistream([{ stream: prettyStream }, { stream: prettyFileStream }]),
  );
} else {
  logger = pino(
    { level: process.env.LOG_LEVEL || 'info' },
    pino.multistream([
      { stream: process.stdout },
      { stream: prettyFileStream },
    ]),
  );
}

export { logger };
